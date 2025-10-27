import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Platform, StyleSheet, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import { auth, db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';


let MapView, Marker;
let MapContainer, TileLayer, RLMarker, Popup, L, icons;

if (Platform.OS !== 'web') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default || RNMaps;
  Marker = RNMaps.Marker;
}

export default function MapScreen() {
  const currentUser = auth.currentUser;

  const [location, setLocation] = useState(null);
  const [myAddresses, setMyAddresses] = useState([]);
  const [othersPublic, setOthersPublic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webMapReady, setWebMapReady] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let mounted = true;

    const loadWebMap = async () => {
      try {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const RL = require('react-leaflet');
        const leaflet = require('leaflet');

        MapContainer = RL.MapContainer;
        TileLayer = RL.TileLayer;
        RLMarker = RL.Marker;
        Popup = RL.Popup;
        L = leaflet.default || leaflet;

        const createIcon = (url) => new L.Icon({
          iconUrl: url,
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        icons = {
          red: createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'),
          green: createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'),
          blue: createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'),
        };

        if (mounted) {
          setWebMapReady(true);
        }
      } catch (e) {
        console.error('Erreur chargement carte web:', e);
        if (mounted) {
          setError('Erreur chargement carte web');
        }
      }
    };

    loadWebMap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (mounted) {
            setError('Permission de localisation refusée. Activez-la dans les paramètres de l\'app.');
            setLoading(false);
          }
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});

        if (mounted) {
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        console.error('Erreur localisation:', e);
        if (mounted) {
          setError(`Erreur de localisation: ${e.message}`);
        }
      }

      try {
        console.log('Chargement adresses Firestore...');
        if (currentUser) {
          const mineSnap = await getDocs(query(collection(db, 'addresses'), where('ownerUid', '==', currentUser.uid)));
          if (mounted) {
            setMyAddresses(mineSnap.docs.map((d) => ({ _id: d.id, ...d.data() })));
          }
          console.log('Mes adresses chargées:', mineSnap.docs.length);
        } else {
          if (mounted) setMyAddresses([]);
        }

        const publicSnap = await getDocs(query(collection(db, 'addresses'), where('isPublic', '==', true)));
        const allPublic = publicSnap.docs.map((d) => ({ _id: d.id, ...d.data() }));
        if (mounted) {
          setOthersPublic(
            allPublic.filter((a) => !currentUser || a.ownerUid !== currentUser.uid)
          );
        }
        console.log('Adresses publiques chargées:', allPublic.length);
      } catch (e) {
        console.error('Erreur Firestore:', e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    const created = route.params?.createdAddress;
    if (!created) return;

    if (currentUser && created.ownerUid === currentUser.uid) {
      setMyAddresses((prev) => {
        if (prev.some((p) => p._id === created._id)) return prev;
        return [created, ...prev];
      });
    } else if (created.isPublic) {
      setOthersPublic((prev) => {
        if (prev.some((p) => p._id === created._id)) return prev;
        return [created, ...prev];
      });
    }

    const lat = created.location?.latitude;
    const lon = created.location?.longitude;
    if (lat != null && lon != null) {
      if (Platform.OS === 'web' && mapInstance && typeof mapInstance.setView === 'function') {
        try {
          mapInstance.setView([lat, lon], 16);
        } catch (e) {
          console.warn('Erreur setView leaflet:', e);
        }
      } else if (Platform.OS !== 'web' && mapRef.current && typeof mapRef.current.animateToRegion === 'function') {
        try {
          mapRef.current.animateToRegion(
            { latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 },
            500
          );
        } catch (e) {
          console.warn('Erreur animateToRegion:', e);
        }
      }
    }

    try {
      navigation.setParams({ createdAddress: undefined });
    } catch (e) {}
  }, [route.params?.createdAddress, mapInstance, currentUser, navigation]);

  const topOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 8) : 12;

  const LegendItem = ({ color, label, count }) => (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}{typeof count === 'number' ? ` · ${count}` : ''}</Text>
    </View>
  );

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'red' }}>Erreur</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>{error}</Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>
          Allez dans Paramètres → Apps → Mes Bonnes Adresses → Autorisations → Localisation
        </Text>
      </View>
    );
  }

  if (loading || !location || (Platform.OS === 'web' && !webMapReady)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Chargement de la carte…</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    const center = location || { latitude: 48.8566, longitude: 2.3522 };

    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.header, { top: topOffset }]}>
          <Text style={styles.brand}>Mes Bonnes Adresses</Text>
          <View style={styles.legend}>
            <LegendItem color="red" label="Vous" count={location ? 1 : 0} />
            <LegendItem color="green" label="Mes adresses" count={myAddresses.length} />
            <LegendItem color="blue" label="Publiques" count={othersPublic.length} />
          </View>
        </View>

        <MapContainer
          center={[center.latitude, center.longitude]}
          zoom={14}
          style={{ flex: 1, height: '100%' }}
          scrollWheelZoom
          whenCreated={(m) => setMapInstance(m)}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {location && (
            <RLMarker
              position={[location.latitude, location.longitude]}
              icon={icons.red}
            >
              <Popup>Vous</Popup>
            </RLMarker>
          )}

          {myAddresses.map((a) => (
            <RLMarker
              key={`mine-${a._id}`}
              position={[a.location.latitude, a.location.longitude]}
              icon={icons.green}
            >
              <Popup>{a.title || 'Mon adresse'}</Popup>
            </RLMarker>
          ))}

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
      </View>
    );
  }

  console.log('Affichage MapView Native avec location:', location);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { top: topOffset }]}>
        <View style={styles.legend}>
          <LegendItem color="red" label="Vous" count={location ? 1 : 0} />
          <LegendItem color="green" label="Mes adresses" count={myAddresses.length} />
          <LegendItem color="blue" label="Publiques" count={othersPublic.length} />
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
      >
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="Vous"
          pinColor="red"
        />

        {myAddresses.map((a) => (
          <Marker
            key={`mine-${a._id}`}
            coordinate={{ latitude: a.location.latitude, longitude: a.location.longitude }}
            title={a.title || 'Mon adresse'}
            pinColor="green"
          />
        ))}

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