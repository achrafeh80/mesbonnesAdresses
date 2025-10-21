import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, Platform, StyleSheet, StatusBar } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const useLeaflet = () => {
  const [RL, setRL] = useState(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(null);

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
        const [{ MapContainer, TileLayer, Marker: RLMarker, Popup }, leaflet] = await Promise.all([
          import('react-leaflet'),
          import('leaflet'),
        ]);
        const L = leaflet.default || leaflet;

        const mk = (url) =>
          new L.Icon({
            iconUrl: url,
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
        const red = mk('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png');
        const green = mk('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png');
        const blue = mk('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png');

        if (mounted) {
          setRL({ MapContainer, TileLayer, RLMarker, Popup, L, icons: { red, green, blue } });
          setReady(true);
        }
      } catch (e) {
        if (mounted) {
          setErr(e?.message || String(e));
          setReady(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { RL, ready, err };
};

export default function MapScreen() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [location, setLocation] = useState(null);
  const [myAddresses, setMyAddresses] = useState([]);
  const [othersPublic, setOthersPublic] = useState([]);
  const [loading, setLoading] = useState(true);

  const { RL, ready: leafletReady, err: leafletErr } = useLeaflet();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', "L'accès à la localisation est requis.");
        } else {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        console.warn('Erreur localisation:', e?.message || e);
      }

      try {
        if (currentUser) {
          const mineSnap = await getDocs(query(collection(db, 'addresses'), where('ownerUid', '==', currentUser.uid)));
          setMyAddresses(mineSnap.docs.map((d) => ({ _id: d.id, ...d.data() })));
        } else {
          setMyAddresses([]);
        }
        const publicSnap = await getDocs(query(collection(db, 'addresses'), where('isPublic', '==', true)));
        const allPublic = publicSnap.docs.map((d) => ({ _id: d.id, ...d.data() }));
        setOthersPublic(
          allPublic.filter((a) => !currentUser || a.ownerUid !== currentUser.uid)
        );
      } catch (e) {
        console.warn('Erreur Firestore:', e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 8) : 12;

  const LegendItem = ({ color, label, count }) => (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}{typeof count === 'number' ? ` · ${count}` : ''}</Text>
    </View>
  );

  if (Platform.OS === 'web') {
    if (loading || (!location && !leafletErr)) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Chargement de la carte…</Text>
        </View>
      );
    }

    const { MapContainer, TileLayer, RLMarker, Popup, icons } = RL || {};
    const center = location || { latitude: 48.8566, longitude: 2.3522 };

    return (
      <View style={{ flex: 1 }}>
        {/* Header / Ping bar */}
        <View style={[styles.header, { top: topOffset }]}>
          <Text style={styles.brand}>Mes Bonnes Adresses</Text>
          <View style={styles.legend}>
            <LegendItem color="red" label="Vous" count={location ? 1 : 0} />
            <LegendItem color="green" label="Mes adresses" count={myAddresses.length} />
            <LegendItem color="blue" label="Publiques" count={othersPublic.length} />
          </View>
        </View>

        {leafletErr ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Text>Carte web indisponible: {leafletErr}</Text>
          </View>
        ) : leafletReady && RL ? (
          <MapContainer
            center={[center.latitude, center.longitude]}
            zoom={14}
            style={{ flex: 1, height: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {/* Marqueur position utilisateur (rouge) */}
            {location && (
              <RLMarker
                position={[location.latitude, location.longitude]}
                icon={icons.red}
              >
                <Popup>Vous</Popup>
              </RLMarker>
            )}

            {/* Mes adresses (vert) */}
            {myAddresses.map((a) => (
              <RLMarker
                key={`mine-${a._id}`}
                position={[a.location.latitude, a.location.longitude]}
                icon={icons.green}
              >
                <Popup>{a.title || 'Mon adresse'}</Popup>
              </RLMarker>
            ))}

            {/* Publiques des autres (bleu) */}
            {othersPublic.map((a) => (
              <RLMarker
                key={`other-${a._id}`}
                position={[a.location.latitude, a.location.longitude]}
                icon={icons.blue}
              >
                <Popup>{a.title || 'Adresse publique'}</Popup>
              </RLMarker>
            ))}
          </MapContainer>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        )}
      </View>
    );
  }

  if (loading || !location) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement de la carte…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header / Ping bar (mobile) */}
      <View style={[styles.header, { top: topOffset }]}>
        <View style={styles.legend}>
          <LegendItem color="red" label="Vous" count={location ? 1 : 0} />
          <LegendItem color="green" label="Mes adresses" count={myAddresses.length} />
          <LegendItem color="blue" label="Publiques" count={othersPublic.length} />
        </View>
      </View>

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
      >
        {/* Position utilisateur (rouge) */}
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="Vous"
          pinColor="red"
        />

        {/* Mes adresses (vert) */}
        {myAddresses.map((a) => (
          <Marker
            key={`mine-${a._id}`}
            coordinate={{ latitude: a.location.latitude, longitude: a.location.longitude }}
            title={a.title || 'Mon adresse'}
            pinColor="green"
          />
        ))}

        {/* Publiques des autres (bleu) */}
        {othersPublic.map((a) => (
          <Marker
            key={`other-${a._id}`}
            coordinate={{ latitude: a.location.latitude, longitude: a.location.longitude }}
            title={a.title || 'Adresse publique'}
            pinColor="blue"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, 
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  legendText: {
    fontSize: 13,
    color: '#333',
  },
});
