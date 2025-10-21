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
import publicAddressStyles from '../styles/adress/publicAddressStyles';

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
        style={publicAddressStyles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddressDetail', { addressId: item._id })}
      >
        {/* Cover image */}
        {cover ? (
          <Image source={{ uri: cover }} style={publicAddressStyles.cover} />
        ) : (
          <View style={[publicAddressStyles.cover, publicAddressStyles.coverPlaceholder]}>
            <Text style={publicAddressStyles.coverPlaceholderText}>Aucune image</Text>
          </View>
        )}

        {/* Content */}
        <View style={publicAddressStyles.content}>
          <Text numberOfLines={1} style={publicAddressStyles.title}>
            {item.title || 'Sans titre'}
          </Text>

          <Text numberOfLines={2} style={publicAddressStyles.sub}>
            par {item.ownerName || 'Anonyme'}
          </Text>

          <View style={publicAddressStyles.metaRow}>
            <View style={publicAddressStyles.ratingWrap}>
              <Text style={publicAddressStyles.star}>{rating ? '★' : '☆'}</Text>
              <Text style={publicAddressStyles.ratingText}>
                {rating ? `${rating.toFixed(1)} / 5` : 'Pas de note'}
                {ratingsCount ? ` · ${ratingsCount}` : ''}
              </Text>
            </View>

            <View style={[publicAddressStyles.badge, publicAddressStyles.badgePublic]}>
              <Text style={publicAddressStyles.badgePublicText}>Publique</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={publicAddressStyles.loader}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={publicAddressStyles.screen}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={publicAddressStyles.emptyBox}>
            <Text style={publicAddressStyles.emptyText}>Aucune adresse publique trouvée.</Text>
          </View>
        }
      />
    </View>
  );
}

