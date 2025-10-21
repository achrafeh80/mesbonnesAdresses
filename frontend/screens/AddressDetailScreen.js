// /frontend/screens/AddressDetailScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../utils/firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll, // ✅ pour supprimer tout un dossier
} from 'firebase/storage';
import MapView, { Marker } from 'react-native-maps';

export default function AddressDetailScreen({ route, navigation }) {
  const { addressId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(null);

  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [pickedUri, setPickedUri] = useState(null);

  // ⭐️ Rating state
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [ratingsCount, setRatingsCount] = useState(0);

  // Web: react-leaflet dynamic
  const [RL, setRL] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [leafletError, setLeafletError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  // Charge react-leaflet côté web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let mounted = true;
    (async () => {
      try {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        const [{ MapContainer, TileLayer, Marker: RLMarker }, leaflet] = await Promise.all([
          import('react-leaflet'),
          import('leaflet'),
        ]);

        const L = leaflet.default || leaflet;
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (mounted) {
          setRL({ MapContainer, TileLayer, Marker: RLMarker, L });
          setLeafletReady(true);
        }
      } catch (e) {
        if (mounted) {
          setLeafletError(e?.message || String(e));
          setLeafletReady(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadAddress = async () => {
    if (!addressId) {
      setLoading(false);
      Alert.alert('Erreur', "Identifiant d'adresse manquant.");
      return;
    }
    setLoading(true);
    try {
      // Adresse
      const addressRef = doc(db, 'addresses', addressId);
      const docSnap = await getDoc(addressRef);
      if (!docSnap.exists()) throw new Error('Adresse introuvable');

      const data = docSnap.data();
      const addressObj = {
        _id: docSnap.id,
        ...data,
        images: data.images || [],
      };

      // Commentaires
      const commentsRef = collection(db, 'addresses', addressId, 'comments');
      const commentsSnap = await getDocs(query(commentsRef, orderBy('createdAt', 'desc')));
      const commentsList = commentsSnap.docs.map((d) => {
        const cData = d.data();
        return {
          _id: d.id,
          ...cData, // authorUid, authorName, text, createdAt
          author: { displayName: cData.authorName || 'Anonyme' },
        };
      });
      addressObj.comments = commentsList;

      // Notes
      const ratingsRef = collection(db, 'addresses', addressId, 'ratings');
      const ratingsSnap = await getDocs(ratingsRef);
      let sum = 0;
      let count = 0;
      let myRating = 0;
      ratingsSnap.forEach((r) => {
        const rv = r.data()?.stars || 0;
        if (rv > 0) {
          sum += rv;
          count += 1;
        }
        if (user && r.id === user.uid) {
          myRating = rv;
        }
      });
      setAvgRating(count > 0 ? Number((sum / count).toFixed(1)) : null);
      setRatingsCount(count);
      setUserRating(myRating);

      setAddress(addressObj);
    } catch (e) {
      console.log('Address fetch error:', e);
      Alert.alert('Erreur', "Impossible de charger l'adresse.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId]);

  const submitComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Info', 'Écris un commentaire avant de l’envoyer.');
      return;
    }
    setSending(true);
    try {
      if (!user) throw new Error('Utilisateur non connecté');
      const commentText = comment.trim();
      await addDoc(collection(db, 'addresses', addressId, 'comments'), {
        text: commentText,
        authorUid: user.uid,
        authorName: user.displayName || user.email || 'Anonyme',
        createdAt: serverTimestamp(),
      });
      await loadAddress();
      setComment('');
      Alert.alert('Succès', 'Commentaire ajouté.');
    } catch (e) {
      console.log('Comment error:', e);
      Alert.alert('Erreur', e.message || "Impossible d’envoyer le commentaire.");
    } finally {
      setSending(false);
    }
  };

  // 🔴 Suppression d’un commentaire par son auteur uniquement
  const deleteOwnComment = async (commentId, authorUid) => {
    try {
      if (!user || user.uid !== authorUid) {
        Alert.alert('Action non autorisée', 'Vous ne pouvez supprimer que vos propres commentaires.');
        return;
      }
      await deleteDoc(doc(db, 'addresses', addressId, 'comments', commentId));
      await loadAddress();
    } catch (e) {
      console.warn('Delete comment error:', e?.message || e);
      Alert.alert('Erreur', "Impossible de supprimer le commentaire.");
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Accès à la galerie requis.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (asset?.uri) setPickedUri(asset.uri);
    } catch (e) {
      console.log('pickImage error:', e);
      Alert.alert('Erreur', 'Impossible de sélectionner une image.');
    }
  };

  const uploadImage = async () => {
    if (!pickedUri) {
      Alert.alert('Info', 'Sélectionne une image d’abord.');
      return;
    }
    setUploading(true);
    try {
      if (!user) throw new Error('Utilisateur non connecté');
      const response = await fetch(pickedUri);
      const blob = await response.blob();
      const imageRef = ref(storage, `addresses/${addressId}/${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      await updateDoc(doc(db, 'addresses', addressId), {
        images: arrayUnion(downloadURL),
      });
      setPickedUri(null);
      await loadAddress();
      Alert.alert('Succès', 'Image envoyée.');
    } catch (e) {
      console.log('uploadImage error:', e);
      Alert.alert('Erreur', e.message || "Impossible d’envoyer l’image.");
    } finally {
      setUploading(false);
    }
  };


const deleteAddress = async () => {
  if (!user || !address || address.ownerUid !== user.uid) {
    Alert.alert('Action non autorisée', "Seul le propriétaire peut supprimer l’adresse.");
    return;
  }

  // --- vraie suppression (Storage + sous-collections + doc) ---
  const doDelete = async () => {
    try {
      // 1) Supprimer tous les fichiers Storage du dossier addresses/{addressId}
      try {
        const folderRef = ref(storage, `addresses/${addressId}`);
        const list = await listAll(folderRef);
        for (const item of list.items) await deleteObject(item);
        for (const prefix of list.prefixes) {
          const sub = await listAll(prefix);
          for (const it of sub.items) await deleteObject(it);
        }
      } catch (e) {
        // pas bloquant si le dossier n'existe pas
        console.warn('Storage clean warning:', e?.message || e);
      }

      // 2) Supprimer sous-collections Firestore (comments, ratings) en batch
      const batch = writeBatch(db);

      const commentsRef = collection(db, 'addresses', addressId, 'comments');
      const commentsSnap = await getDocs(commentsRef);
      commentsSnap.forEach((c) => batch.delete(c.ref));

      const ratingsRef = collection(db, 'addresses', addressId, 'ratings');
      const ratingsSnap = await getDocs(ratingsRef);
      ratingsSnap.forEach((r) => batch.delete(r.ref));

      await batch.commit();

      // 3) Supprimer le document adresse
      await deleteDoc(doc(db, 'addresses', addressId));

      // 4) Retour à l’écran précédent
      Alert.alert('Succès', 'Adresse supprimée.');
      navigation.goBack();
    } catch (e) {
      console.error('Delete address failed:', e);
      Alert.alert('Erreur', 'La suppression a échoué.');
    }
  };

  // --- confirmation cross-platform ---
  if (Platform.OS === 'web') {
    // Alert avec boutons n'exécute pas le callback sur web → on utilise confirm()
    if (window.confirm('Supprimer définitivement cette adresse ?')) {
      await doDelete();
    }
  } else {
    Alert.alert('Confirmation', 'Supprimer définitivement cette adresse ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: doDelete },
    ]);
  }
};


  // ⭐️ Sauvegarde/maj de la note utilisateur
  const handleRate = async (stars) => {
    try {
      if (!user) {
        Alert.alert('Connexion requise', 'Connecte-toi pour noter cette adresse.');
        return;
      }
      setUserRating(stars);
      await setDoc(
        doc(db, 'addresses', addressId, 'ratings', user.uid),
        { stars, createdAt: serverTimestamp() },
        { merge: true }
      );
      const ratingsRef = collection(db, 'addresses', addressId, 'ratings');
      const snap = await getDocs(ratingsRef);
      let sum = 0;
      let count = 0;
      snap.forEach((r) => {
        const v = r.data()?.stars || 0;
        if (v > 0) {
          sum += v;
          count += 1;
        }
      });
      const newAvg = count > 0 ? Number((sum / count).toFixed(1)) : null;
      setAvgRating(newAvg);
      setRatingsCount(count);
      await updateDoc(doc(db, 'addresses', addressId), {
        averageRating: newAvg,
        ratingsCount: count,
      });
    } catch (e) {
      console.warn('Rating error:', e?.message || e);
      Alert.alert('Erreur', "Impossible d'enregistrer la note.");
    }
  };

  const Stars = ({ value = 0, onSelect }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <View style={styles.starsRow}>
        {stars.map((s) => {
          const filled = s <= value;
          return (
            <Pressable key={s} onPress={() => onSelect?.(s)} style={styles.starBtn} hitSlop={8}>
              <Text style={[styles.star, filled ? styles.starFilled : styles.starEmpty]}>
                {filled ? '★' : '☆'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const hasLocation =
    address?.location &&
    typeof address.location.latitude === 'number' &&
    typeof address.location.longitude === 'number';

  const miniMapRegion = useMemo(() => {
    if (!hasLocation) return null;
    return {
      latitude: address.location.latitude,
      longitude: address.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [hasLocation, address?.location]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.mt8}>Chargement…</Text>
      </View>
    );
  }

  if (!address) {
    return (
      <View style={styles.center}>
        <Text>Aucune adresse à afficher.</Text>
      </View>
    );
  }

  // Mini-carte web (react-leaflet)
  const WebMiniMap = () => {
    if (!hasLocation) return null;
    if (leafletError) {
      return (
        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={{ color: '#666', fontSize: 12 }}>
              Carte web indisponible ({leafletError}).
            </Text>
          </View>
          <Text style={styles.coords}>
            {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
          </Text>
        </View>
      );
    }
    if (!leafletReady || !RL) {
      return (
        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator />
            <Text style={{ marginTop: 6, color: '#666', fontSize: 12 }}>Chargement de la carte…</Text>
          </View>
          <Text style={styles.coords}>
            {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
          </Text>
        </View>
      );
    }
    const { MapContainer, TileLayer, Marker: RLMarker } = RL;
    return (
      <View style={styles.mapCard}>
        <Text style={styles.sectionTitle}>Localisation</Text>
        <View style={styles.miniMapWebWrapper}>
          <MapContainer
            center={[address.location.latitude, address.location.longitude]}
            zoom={16}
            style={styles.miniMapWeb}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <RLMarker position={[address.location.latitude, address.location.longitude]} />
          </MapContainer>
        </View>
        <Text style={styles.coords}>
          {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{address.title || 'Adresse'}</Text>

      {/* ⭐️ Rating */}
      <View style={styles.ratingCard}>
        <View style={styles.ratingTopRow}>
          <Text style={styles.ratingTitle}>Note globale</Text>
          <Text style={styles.ratingBadge}>
            {avgRating ? `${avgRating} / 5` : '– / 5'} · {ratingsCount} avis
          </Text>
        </View>
        <Stars value={userRating} onSelect={handleRate} />
        {!user && <Text style={styles.ratingHint}>Connecte-toi pour noter cette adresse.</Text>}
      </View>

      {/* 🗺️ Mini-carte */}
      {hasLocation && Platform.OS !== 'web' && miniMapRegion && (
        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <MapView style={styles.miniMap} pointerEvents="none" initialRegion={miniMapRegion}>
            <Marker
              coordinate={{
                latitude: address.location.latitude,
                longitude: address.location.longitude,
              }}
              title={address.title || 'Adresse'}
            />
          </MapView>
          <Text style={styles.coords}>
            {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
          </Text>
        </View>
      )}
      {hasLocation && Platform.OS === 'web' && <WebMiniMap />}

      {/* Galerie */}
      {!!address.images?.length && (
        <ScrollView horizontal style={styles.imagesRow} showsHorizontalScrollIndicator={false}>
          {address.images.map((u, idx) => (
            <Image key={`${u}-${idx}`} source={{ uri: u }} style={styles.image} />
          ))}
        </ScrollView>
      )}

      {/* Ajouter une image */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajouter une image</Text>
        {pickedUri ? (
          <Image source={{ uri: pickedUri }} style={styles.preview} />
        ) : (
          <Text style={styles.muted}>Aucune image sélectionnée</Text>
        )}
        <View style={styles.row}>
          <Pressable onPress={pickImage} style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>Choisir dans la galerie</Text>
          </Pressable>
          <Pressable
            onPress={uploadImage}
            disabled={!pickedUri || uploading}
            style={[styles.btn, (!pickedUri || uploading) && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>{uploading ? 'Envoi…' : 'Envoyer'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Nouveau commentaire */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nouveau commentaire</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Écris ton commentaire…"
          style={styles.input}
          multiline
        />
        <Pressable onPress={submitComment} disabled={sending} style={[styles.btn, sending && styles.btnDisabled]}>
          <Text style={styles.btnText}>{sending ? 'Envoi…' : 'Publier'}</Text>
        </Pressable>
      </View>

      {/* Commentaires */}
      {!!address.comments?.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commentaires</Text>
          {address.comments.map((c) => {
            const canDelete = user && c.authorUid === user.uid;
            return (
              <View key={c._id} style={styles.commentRow}>
                {canDelete && (
                  <Pressable
                    onPress={() => deleteOwnComment(c._id, c.authorUid)}
                    style={styles.deletePill}
                    hitSlop={8}
                  >
                    <Text style={styles.deletePillText}>Suppr.</Text>
                  </Pressable>
                )}
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{c.author?.displayName || 'Anonyme'}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Suppression de l’adresse (propriétaire) */}
      {user && address.ownerUid === user.uid && (
        <View style={styles.section}>
          <Pressable onPress={deleteAddress} style={[styles.btn, { backgroundColor: '#d9534f' }]}>
            <Text style={styles.btnText}>Supprimer l’adresse</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  mt8: { marginTop: 8 },
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },

  // ⭐️ Rating
  ratingCard: {
    borderWidth: 1,
    borderColor: '#E6E8EC',
    backgroundColor: '#FAFBFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  ratingTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  ratingTitle: { fontSize: 16, fontWeight: '700' },
  ratingBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF4FF',
    color: '#1D4ED8',
  },
  ratingHint: { marginTop: 6, color: '#666' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starBtn: { padding: 4 },
  star: { fontSize: 24, lineHeight: 28 },
  starFilled: { color: '#F5A524' },
  starEmpty: { color: '#D9DEE7' },

  // 🗺️ Map
  mapCard: {
    borderWidth: 1,
    borderColor: '#E6E8EC',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  miniMap: { height: 160, borderRadius: 10 },
  coords: { marginTop: 6, color: '#555', fontSize: 12 },

  // Web (leaflet)
  miniMapWebWrapper: { height: 160, borderRadius: 10, overflow: 'hidden' },
  miniMapWeb: { height: '100%', width: '100%' },
  mapPlaceholder: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
  },

  // Galerie + formulaires
  imagesRow: { marginBottom: 12 },
  image: { width: 140, height: 100, borderRadius: 8, marginRight: 8, backgroundColor: '#eee' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '600' },
  btnOutline: {
    borderColor: '#007AFF',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    flex: 1,
  },
  btnOutlineText: { color: '#007AFF', fontWeight: '600' },
  preview: { width: '100%', height: 200, marginBottom: 8, borderRadius: 4 },
  muted: { color: '#777', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // 💬 Commentaires
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  deletePill: {
    backgroundColor: '#d9534f',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  deletePillText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  commentAuthor: { fontWeight: '700', marginBottom: 2 },
  commentText: { marginBottom: 2 },
});
