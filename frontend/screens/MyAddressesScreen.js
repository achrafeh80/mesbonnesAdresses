import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import mainAddressStyles from '../styles/adress/mainAddressStyles';

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
        style={mainAddressStyles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddressDetail', { addressId: item._id })}
      >
        {/* Cover image */}
        {cover ? (
          <Image source={{ uri: cover }} style={mainAddressStyles.cover} />
        ) : (
          <View style={[mainAddressStyles.cover, mainAddressStyles.coverPlaceholder]}>
            <Text style={mainAddressStyles.coverPlaceholderText}>Aucune image</Text>
          </View>
        )}

        {/* Content */}
        <View style={mainAddressStyles.content}>
          <View style={mainAddressStyles.rowBetween}>
            <Text numberOfLines={1} style={mainAddressStyles.title}>{item.title || 'Sans titre'}</Text>
            <View style={[mainAddressStyles.badge, isPublic ? mainAddressStyles.badgePublic : mainAddressStyles.badgePrivate]}>
              <Text style={isPublic ? mainAddressStyles.badgePublicText : mainAddressStyles.badgePrivateText}>
                {isPublic ? 'Publique' : 'Privée'}
              </Text>
            </View>
          </View>

          {!!item.description && (
            <Text numberOfLines={2} style={mainAddressStyles.desc}>
              {item.description}
            </Text>
          )}

          <View style={mainAddressStyles.metaRow}>
            {/* Rating */}
            <View style={mainAddressStyles.ratingWrap}>
              <Text style={mainAddressStyles.star}>{rating ? '★' : '☆'}</Text>
              <Text style={mainAddressStyles.ratingText}>
                {rating ? `${rating.toFixed(1)} / 5` : 'Pas de note'}
                {ratingsCount ? ` · ${ratingsCount}` : ''}
              </Text>
            </View>
            {/* Owner tag (moi) */}
            <Text style={mainAddressStyles.ownerTag}>Moi</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={mainAddressStyles.loader}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={mainAddressStyles.screen}>
      <TouchableOpacity
        style={mainAddressStyles.createBtn}
        onPress={() => navigation.navigate('CreateAddress')}
        activeOpacity={0.9}
      >
        <Text style={mainAddressStyles.createBtnText}>+ Créer une adresse</Text>
      </TouchableOpacity>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={mainAddressStyles.emptyBox}>
            <Text style={mainAddressStyles.emptyText}>Aucune adresse pour le moment.</Text>
          </View>
        }
      />
    </View>
  );
}
