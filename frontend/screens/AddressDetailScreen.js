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
  listAll,
} from 'firebase/storage';
import MapView, { Marker } from 'react-native-maps';
import addressDetailStyles from '../styles/adress/addressDetailStyles';
export default function AddressDetailScreen({ route, navigation }) {
  const { addressId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(null);

  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [pickedUri, setPickedUri] = useState(null);

  // Rating state
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

  // Suppression d’un commentaire par son auteur uniquement
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


  //Sauvegarde/maj de la note utilisateur
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
      <View style={addressDetailStyles.starsRow}>
        {stars.map((s) => {
          const filled = s <= value;
          return (
            <Pressable key={s} onPress={() => onSelect?.(s)} style={addressDetailStyles.starBtn} hitSlop={8}>
              <Text style={[addressDetailStyles.star, filled ? addressDetailStyles.starFilled : addressDetailStyles.starEmpty]}>
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
      <View style={addressDetailStyles.center}>
        <ActivityIndicator />
        <Text style={addressDetailStyles.mt8}>Chargement…</Text>
      </View>
    );
  }

  if (!address) {
    return (
      <View style={addressDetailStyles.center}>
        <Text>Aucune adresse à afficher.</Text>
      </View>
    );
  }

  // Mini-carte web (react-leaflet)
  const WebMiniMap = () => {
    if (!hasLocation) return null;
    if (leafletError) {
      return (
        <View style={addressDetailStyles.mapCard}>
          <Text style={addressDetailStyles.sectionTitle}>Localisation</Text>
          <View style={addressDetailStyles.mapPlaceholder}>
            <Text style={{ color: '#666', fontSize: 12 }}>
              Carte web indisponible ({leafletError}).
            </Text>
          </View>
          <Text style={addressDetailStyles.coords}>
            {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
          </Text>
        </View>
      );
    }
    if (!leafletReady || !RL) {
      return (
        <View style={addressDetailStyles.mapCard}>
          <Text style={addressDetailStyles.sectionTitle}>Localisation</Text>
          <View style={addressDetailStyles.mapPlaceholder}>
            <ActivityIndicator />
            <Text style={{ marginTop: 6, color: '#666', fontSize: 12 }}>Chargement de la carte…</Text>
          </View>
          <Text style={addressDetailStyles.coords}>
            {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
          </Text>
        </View>
      );
    }
    const { MapContainer, TileLayer, Marker: RLMarker } = RL;
    return (
      <View style={addressDetailStyles.mapCard}>
        <Text style={addressDetailStyles.sectionTitle}>Localisation</Text>
        <View style={addressDetailStyles.miniMapWebWrapper}>
          <MapContainer
            center={[address.location.latitude, address.location.longitude]}
            zoom={16}
            style={addressDetailStyles.miniMapWeb}
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
        <Text style={addressDetailStyles.coords}>
          {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={addressDetailStyles.container}>
      <Text style={addressDetailStyles.title}>{address.title || 'Adresse'}</Text>

      {/* Rating */}
      <View style={addressDetailStyles.ratingCard}>
        <View style={addressDetailStyles.ratingTopRow}>
          <Text style={addressDetailStyles.ratingTitle}>Note globale</Text>
          <Text style={addressDetailStyles.ratingBadge}>
            {avgRating ? `${avgRating} / 5` : '– / 5'} · {ratingsCount} avis
          </Text>
        </View>
        <Stars value={userRating} onSelect={handleRate} />
        {!user && <Text style={addressDetailStyles.ratingHint}>Connecte-toi pour noter cette adresse.</Text>}
      </View>

      {/* Mini-carte */}
      {hasLocation && Platform.OS !== 'web' && miniMapRegion && (
        <View style={addressDetailStyles.mapCard}>
          <Text style={addressDetailStyles.sectionTitle}>Localisation</Text>
          <MapView style={addressDetailStyles.miniMap} pointerEvents="none" initialRegion={miniMapRegion}>
            <Marker
              coordinate={{
                latitude: address.location.latitude,
                longitude: address.location.longitude,
              }}
              title={address.title || 'Adresse'}
            />
          </MapView>
          <Text style={addressDetailStyles.coords}>
            {address.location.latitude.toFixed(6)}, {address.location.longitude.toFixed(6)}
          </Text>
        </View>
      )}
      {hasLocation && Platform.OS === 'web' && <WebMiniMap />}

      {/* Galerie */}
      {!!address.images?.length && (
        <ScrollView horizontal style={addressDetailStyles.imagesRow} showsHorizontalScrollIndicator={false}>
          {address.images.map((u, idx) => (
            <Image key={`${u}-${idx}`} source={{ uri: u }} style={addressDetailStyles.image} />
          ))}
        </ScrollView>
      )}

      {/* Ajouter une image */}
      <View style={addressDetailStyles.section}>
        <Text style={addressDetailStyles.sectionTitle}>Ajouter une image</Text>
        {pickedUri ? (
          <Image source={{ uri: pickedUri }} style={addressDetailStyles.preview} />
        ) : (
          <Text style={addressDetailStyles.muted}>Aucune image sélectionnée</Text>
        )}
        <View style={addressDetailStyles.row}>
          <Pressable onPress={pickImage} style={addressDetailStyles.btnOutline}>
            <Text style={addressDetailStyles.btnOutlineText}>Choisir dans la galerie</Text>
          </Pressable>
          <Pressable
            onPress={uploadImage}
            disabled={!pickedUri || uploading}
            style={[addressDetailStyles.btn, (!pickedUri || uploading) && addressDetailStyles.btnDisabled]}
          >
            <Text style={addressDetailStyles.btnText}>{uploading ? 'Envoi…' : 'Envoyer'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Nouveau commentaire */}
      <View style={addressDetailStyles.section}>
        <Text style={addressDetailStyles.sectionTitle}>Nouveau commentaire</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Écris ton commentaire…"
          style={addressDetailStyles.input}
          multiline
        />
        <Pressable onPress={submitComment} disabled={sending} style={[addressDetailStyles.btn, sending && addressDetailStyles.btnDisabled]}>
          <Text style={addressDetailStyles.btnText}>{sending ? 'Envoi…' : 'Publier'}</Text>
        </Pressable>
      </View>

      {/* Commentaires */}
      {!!address.comments?.length && (
        <View style={addressDetailStyles.section}>
          <Text style={addressDetailStyles.sectionTitle}>Commentaires</Text>
          {address.comments.map((c) => {
            const canDelete = user && c.authorUid === user.uid;
            return (
              <View key={c._id} style={addressDetailStyles.commentRow}>
                {canDelete && (
                  <Pressable
                    onPress={() => deleteOwnComment(c._id, c.authorUid)}
                    style={addressDetailStyles.deletePill}
                    hitSlop={8}
                  >
                    <Text style={addressDetailStyles.deletePillText}>Suppr.</Text>
                  </Pressable>
                )}
                <View style={addressDetailStyles.commentBubble}>
                  <Text style={addressDetailStyles.commentAuthor}>{c.author?.displayName || 'Anonyme'}</Text>
                  <Text style={addressDetailStyles.commentText}>{c.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Suppression de l’adresse (propriétaire) */}
      {user && address.ownerUid === user.uid && (
        <View style={addressDetailStyles.section}>
          <Pressable onPress={deleteAddress} style={[addressDetailStyles.btn, { backgroundColor: '#d9534f' }]}>
            <Text style={addressDetailStyles.btnText}>Supprimer l’adresse</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}


