import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function PublicAddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPublicAddresses = async () => {
    setLoading(true);
    try {
      const user = getAuth().currentUser;
      const q = query(collection(db, 'addresses'), where('isPublic', '==', true));
      const snap = await getDocs(q);
      let data = snap.docs.map((docSnap) => ({ _id: docSnap.id, ...docSnap.data() }));
      if (user) data = data.filter((addr) => addr.ownerUid !== user.uid);
      setAddresses(data);
    } catch (e) {
      console.error('Error fetching public addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchPublicAddresses);
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }) => {
    const cover = item.images?.length ? item.images[0] : null;
    const rating = typeof item.averageRating === 'number' ? item.averageRating : null;
    const ratingsCount = typeof item.ratingsCount === 'number' ? item.ratingsCount : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddressDetail', { addressId: item._id })}
      >
        {/* Cover image */}
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>Aucune image</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title || 'Sans titre'}
          </Text>

          <Text numberOfLines={2} style={styles.sub}>
            par {item.ownerName || 'Anonyme'}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingWrap}>
              <Text style={styles.star}>{rating ? '★' : '☆'}</Text>
              <Text style={styles.ratingText}>
                {rating ? `${rating.toFixed(1)} / 5` : 'Pas de note'}
                {ratingsCount ? ` · ${ratingsCount}` : ''}
              </Text>
            </View>

            <View style={[styles.badge, styles.badgePublic]}>
              <Text style={styles.badgePublicText}>Publique</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune adresse publique trouvée.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FC' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cover: { width: '100%', height: 160, backgroundColor: '#eaeef7' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderText: { color: '#6b7280', fontStyle: 'italic' },

  content: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { marginTop: 2, color: '#6B7280' },

  metaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  badgePublic: { backgroundColor: '#ECFDF5' },
  badgePublicText: { color: '#059669', fontWeight: '700', fontSize: 12 },

  ratingWrap: { flexDirection: 'row', alignItems: 'center' },
  star: { fontSize: 16, color: '#F59E0B', marginRight: 4 },
  ratingText: { color: '#111827' },

  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
