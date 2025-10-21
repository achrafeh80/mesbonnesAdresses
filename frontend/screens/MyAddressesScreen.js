import React, { useEffect, useState, useMemo } from 'react';
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

export default function MyAddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    setLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'addresses'), where('ownerUid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const myAddresses = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
      }));
      setAddresses(myAddresses);
    } catch (e) {
      console.error('Failed to fetch addresses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchAddresses);
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }) => {
    const cover = item.images?.length ? item.images[0] : null;
    const isPublic = !!item.isPublic;
    const rating = typeof item.averageRating === 'number' ? item.averageRating : null;
    const ratingsCount = typeof item.ratingsCount === 'number' ? item.ratingsCount : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
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
          <View style={styles.rowBetween}>
            <Text numberOfLines={1} style={styles.title}>{item.title || 'Sans titre'}</Text>
            <View style={[styles.badge, isPublic ? styles.badgePublic : styles.badgePrivate]}>
              <Text style={isPublic ? styles.badgePublicText : styles.badgePrivateText}>
                {isPublic ? 'Publique' : 'Privée'}
              </Text>
            </View>
          </View>

          {!!item.description && (
            <Text numberOfLines={2} style={styles.desc}>
              {item.description}
            </Text>
          )}

          <View style={styles.metaRow}>
            {/* Rating */}
            <View style={styles.ratingWrap}>
              <Text style={styles.star}>{rating ? '★' : '☆'}</Text>
              <Text style={styles.ratingText}>
                {rating ? `${rating.toFixed(1)} / 5` : 'Pas de note'}
                {ratingsCount ? ` · ${ratingsCount}` : ''}
              </Text>
            </View>
            {/* Owner tag (moi) */}
            <Text style={styles.ownerTag}>Moi</Text>
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
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('CreateAddress')}
        activeOpacity={0.9}
      >
        <Text style={styles.createBtnText}>+ Créer une adresse</Text>
      </TouchableOpacity>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune adresse pour le moment.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FC' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  createBtn: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  createBtnText: { color: '#fff', fontWeight: '700' },

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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  desc: { color: '#6B7280', marginTop: 4 },

  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  badgePublic: { backgroundColor: '#ECFDF5' },
  badgePrivate: { backgroundColor: '#FEF3C7' },
  badgePublicText: { color: '#059669', fontWeight: '700', fontSize: 12 },
  badgePrivateText: { color: '#B45309', fontWeight: '700', fontSize: 12 },

  metaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingWrap: { flexDirection: 'row', alignItems: 'center' },
  star: { fontSize: 16, color: '#F59E0B', marginRight: 4 },
  ratingText: { color: '#111827' },
  ownerTag: { color: '#6B7280', fontStyle: 'italic' },

  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
