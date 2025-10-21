import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Button,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, updateProfile, signOut } from 'firebase/auth';
import { storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import profileStyles from '../styles/profileStyle';

export default function ProfileScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
  const isReasonableLength = (u) => typeof u === 'string' && u.length <= 2000;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setEmail(user.email ?? '');
      setAvatarUri(user.photoURL ?? null);
    }
  }, [user]);

  const pickAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', "L'accès aux photos est nécessaire pour changer l’avatar.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri); // URI locale -> on déclenchera l’upload au save
      }
    } catch (e) {
      console.warn('pickAvatar error:', e?.message || e);
      Alert.alert('Erreur', "Impossible d'ouvrir la galerie.");
    }
  };

  const saveProfile = async () => {
    if (!auth.currentUser) return;

    setSaving(true);
    try {
      let newPhotoURL = auth.currentUser.photoURL || null;

      // 🔁 N’upload que si une image locale a été choisie
      const isLocalFile = typeof avatarUri === 'string' && /^(file|blob|data):/i.test(avatarUri);
      if (isLocalFile) {
        try {
          // Nom unique pour éviter le cache CDN
          const filename = `avatars/${auth.currentUser.uid}_${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);

          const response = await fetch(avatarUri);
          const blob = await response.blob();

          // Upload
          await uploadBytes(storageRef, blob);

          // URL publique
          newPhotoURL = await getDownloadURL(storageRef);
        } catch (err) {
          console.warn('Upload avatar échoué:', err?.message || err);
          Alert.alert('Erreur', "L’upload de l’avatar a échoué.");
          // On garde l’ancien photoURL si existant
        }
      }

      // ✅ Met à jour le profil Auth (displayName + photoURL)
      const profilePayload = {
        displayName: displayName || null,
        ...(isHttpUrl(newPhotoURL) && isReasonableLength(newPhotoURL)
          ? { photoURL: newPhotoURL }
          : { /* ne pas toucher photoURL si invalide */ }),
      };
      await updateProfile(auth.currentUser, profilePayload);

      // ✅ Force un reload pour rafraîchir user.photoURL côté client
      await auth.currentUser.reload();

      // ✅ Met à jour l’UI immédiatement
      setAvatarUri(auth.currentUser.photoURL || newPhotoURL || avatarUri);

      Alert.alert('Profil', 'Profil mis à jour avec succès.');
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', "La mise à jour du profil a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (e) {
      Alert.alert('Erreur', 'La déconnexion a échoué.');
    }
  };

  const handleSignupRedirect = () => {
    navigation.navigate('Signup');
  };

  const avatarFallback = 'https://avatars.githubusercontent.com/u/0?v=4';

  return (
    <View style={profileStyles.container}>
      <Text style={profileStyles.title}>Mon profil</Text>

      {user ? (
        <>
          <View style={profileStyles.avatarRow}>
            <Image
              source={{ uri: avatarUri || avatarFallback }}
              style={profileStyles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity style={profileStyles.changeBtn} onPress={pickAvatar}>
              <Text style={profileStyles.changeBtnText}>Changer l’avatar</Text>
            </TouchableOpacity>
          </View>

          <Text style={profileStyles.label}>Nom affiché</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Votre nom"
            style={profileStyles.input}
          />

          <Text style={profileStyles.label}>Email</Text>
          <TextInput value={email} editable={false} style={[profileStyles.input, profileStyles.inputDisabled]} />

          <View style={{ height: 12 }} />
          <Button title={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={saveProfile} disabled={saving} />

          <View style={{ height: 20 }} />
          <Button title="Déconnexion" color="#d9534f" onPress={handleLogout} />
        </>
      ) : (
        <View style={profileStyles.center}>
          <Text style={profileStyles.infoText}>
            Vous n’êtes pas connecté. Créez un compte pour accéder à votre profil.
          </Text>
          <Button title="S'inscrire" onPress={handleSignupRedirect} />
        </View>
      )}
    </View>
  );
}

