import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Image,
  Pressable,
  Switch,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { db, storage } from '../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ---------- Leaflet (web) loader ----------
const ensureLeafletLoaded = async () => {
  if (typeof window === 'undefined' || Platform.OS !== 'web') return;

  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('leaflet-js')) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }
};

export default function CreateAddressScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const [photo, setPhoto] = useState(null); // uri locale
  const [location, setLocation] = useState(null); // { latitude, longitude }

  // Recherche (Nominatim)
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Refs Leaflet (web)
  const webMapRef = useRef(null);
  const webLeafletMap = useRef(null);
  const webMarkerRef = useRef(null);

  // ---------- Image ----------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };
  const clearPhoto = () => setPhoto(null);

  // ---------- Localisation ----------
  const useCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert("Permission de localisation refusée");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setLocation(coords);

    // Centre la carte + curseur
    if (Platform.OS === 'web' && webLeafletMap.current && window.L) {
      const L = window.L;
      webLeafletMap.current.setView([coords.latitude, coords.longitude], 16);
      const latlng = L.latLng(coords.latitude, coords.longitude);
      if (webMarkerRef.current) {
        webMarkerRef.current.setLatLng(latlng);
      } else {
        webMarkerRef.current = L.marker(latlng).addTo(webLeafletMap.current);
      }
    }
  };

  // ---------- Recherche d’adresse (Nominatim) ----------
  const searchPlaces = useCallback(async (text) => {
    setQuery(text);
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=' +
        encodeURIComponent(text);
      const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      const data = await res.json();
      const items = (data || []).map((item) => ({
        key: item.place_id.toString(),
        label: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
      setSuggestions(items);
    } catch (e) {
      console.warn('Nominatim error', e);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const selectSuggestion = (item) => {
    const coords = { latitude: item.lat, longitude: item.lon };
    setLocation(coords);
    setSuggestions([]);

    // Place le curseur sur la carte
    if (Platform.OS === 'web' && webLeafletMap.current && window.L) {
      const L = window.L;
      webLeafletMap.current.setView([coords.latitude, coords.longitude], 16);
      const latlng = L.latLng(coords.latitude, coords.longitude);
      if (webMarkerRef.current) {
        webMarkerRef.current.setLatLng(latlng);
      } else {
        webMarkerRef.current = L.marker(latlng).addTo(webLeafletMap.current);
      }
    }
  };

  // ---------- Créer l’adresse ----------
  const createAddress = async () => {
    if (!title.trim()) {
      alert('Titre requis');
      return;
    }
    if (!location) {
      alert('Choisissez une localisation');
      return;
    }
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert('Vous devez être connecté');
        return;
      }

      // Upload photo
      let photoURL = null;
      if (photo) {
        const response = await fetch(photo);
        const blob = await response.blob();
        const imageRef = ref(storage, `addresses/${user.uid}_${Date.now()}.jpg`);
        await uploadBytes(imageRef, blob);
        photoURL = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'addresses'), {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        location: { latitude: location.latitude, longitude: location.longitude },
        ownerUid: user.uid,
        ownerName: user.displayName || user.email || 'Anonyme',
        images: photoURL ? [photoURL] : [],
        createdAt: serverTimestamp(),
      });

      navigation.goBack();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'adresse");
    }
  };

  // ---------- Carte web (Leaflet) : création et interactions ----------
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let mounted = true;
    (async () => {
      await ensureLeafletLoaded();
      if (!mounted || !webMapRef.current || !window.L) return;
      const L = window.L;

      // Si la carte est déjà créée, ne pas recréer
      if (!webLeafletMap.current) {
        const start = location ? [location.latitude, location.longitude] : [48.8566, 2.3522];
        const map = L.map(webMapRef.current, { zoomControl: false }).setView(start, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Interaction : clic = placer/mettre à jour le marqueur + setLocation
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setLocation({ latitude: lat, longitude: lng });
          if (webMarkerRef.current) {
            webMarkerRef.current.setLatLng(e.latlng);
          } else {
            webMarkerRef.current = L.marker([lat, lng]).addTo(map);
          }
        });

        webLeafletMap.current = map;
      }

      // Synchronise le marqueur si location existe déjà
      if (location) {
        const latlng = L.latLng(location.latitude, location.longitude);
        webLeafletMap.current.setView(latlng, 16);
        if (webMarkerRef.current) {
          webMarkerRef.current.setLatLng(latlng);
        } else {
          webMarkerRef.current = L.marker(latlng).addTo(webLeafletMap.current);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Titre */}
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Titre</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Titre de l'adresse" style={styles.input} />
      </View>

      {/* Description */}
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (facultative)"
          style={[styles.input, { height: 80 }]}
          multiline
        />
      </View>

      {/* Interrupteur Publique / Privée */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Privée</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: '#e0e0e0', true: '#a5d8ff' }}
          thumbColor={isPublic ? '#007AFF' : '#f4f3f4'}
        />
        <Text style={styles.switchLabel}>Publique</Text>
      </View>

      {/* Choisir une photo + aperçu + bouton supprimer */}
      <View style={{ marginBottom: 12 }}>
        <Button title="Choisir une photo" onPress={pickImage} />
        {!!photo && (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            <Pressable onPress={clearPhoto} style={styles.photoRemoveBtn} hitSlop={8}>
              <Text style={styles.photoRemoveText}>×</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Barre de recherche d'adresse */}
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.label}>Recherche d'adresse</Text>
        <TextInput
          value={query}
          onChangeText={searchPlaces}
          placeholder="Rechercher une adresse"
          style={styles.input}
        />
        {searchLoading && <Text style={{ marginTop: 4 }}>Recherche en cours…</Text>}
        <FlatList
          data={suggestions}
          keyExtractor={(it) => it.key}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => selectSuggestion(item)}>
              <Text style={styles.suggestion}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Carte en dessous de la barre de recherche */}
      <View style={{ marginBottom: 12, height: 220 }}>
        {Platform.OS === 'web' ? (
          <View ref={webMapRef} style={styles.webMap} />
        ) : (
          <MapView
            style={{ flex: 1, borderRadius: 10 }}
            initialRegion={{
              latitude: location?.latitude ?? 48.8566,
              longitude: location?.longitude ?? 2.3522,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            region={
              location
                ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                : undefined
            }
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setLocation({ latitude, longitude });
            }}
          >
            {location && <Marker coordinate={location} title="Emplacement choisi" />}
          </MapView>
        )}
      </View>

      {/* Utiliser ma position actuelle */}
      <View style={{ marginBottom: 16 }}>
        <Button title="Utiliser ma position actuelle" onPress={useCurrentLocation} />
      </View>

      {/* Bouton créer */}
      <Button title="Créer l'adresse" onPress={createAddress} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 4 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  // Switch
  switchRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  switchLabel: { fontSize: 14, color: '#333' },

  // Photo preview
  photoPreviewWrap: {
    marginTop: 8,
    alignSelf: 'flex-start',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoPreview: { width: 120, height: 120, borderRadius: 10 },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },

  // Suggestions
  suggestion: { paddingVertical: 6 },

  // Web map
  webMap: { height: '100%', borderRadius: 10, backgroundColor: '#eef3ff' },
});
