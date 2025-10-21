import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, updateProfile, signOut } from 'firebase/auth';
import { storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri); 
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

      const isLocalFile = typeof avatarUri === 'string' && /^(file|blob|data):/i.test(avatarUri);
      if (isLocalFile) {
        try {
          const filename = `avatars/${auth.currentUser.uid}_${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);

          const response = await fetch(avatarUri);
          const blob = await response.blob();

          await uploadBytes(storageRef, blob);

          newPhotoURL = await getDownloadURL(storageRef);
        } catch (err) {
          console.warn('Upload avatar échoué:', err?.message || err);
          Alert.alert('Erreur', "L’upload de l’avatar a échoué.");
        }
      }

      const profilePayload = {
        displayName: displayName || null,
        ...(isHttpUrl(newPhotoURL) && isReasonableLength(newPhotoURL)
          ? { photoURL: newPhotoURL }
          : { /* ne pas toucher photoURL si invalide */ }),
      };
      await updateProfile(auth.currentUser, profilePayload);

      await auth.currentUser.reload();

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
    <View style={styles.container}>
      <Text style={styles.title}>Mon profil</Text>

      {user ? (
        <>
          <View style={styles.avatarRow}>
            <Image
              source={{ uri: avatarUri || avatarFallback }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.changeBtn} onPress={pickAvatar}>
              <Text style={styles.changeBtnText}>Changer l’avatar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nom affiché</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Votre nom"
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput value={email} editable={false} style={[styles.input, styles.inputDisabled]} />

          <View style={{ height: 12 }} />
          <Button title={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={saveProfile} disabled={saving} />

          <View style={{ height: 20 }} />
          <Button title="Déconnexion" color="#d9534f" onPress={handleLogout} />
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.infoText}>
            Vous n’êtes pas connecté. Créez un compte pour accéder à votre profil.
          </Text>
          <Button title="S'inscrire" onPress={handleSignupRedirect} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#eee' },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  changeBtnText: { color: '#007AFF', fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  inputDisabled: { backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
});
