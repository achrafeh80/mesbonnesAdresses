import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import signUpStyles from '../styles/signUpStyles';

export default function SignupScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const signup = async () => {
    setErr('');
    setLoading(true);
    try {
      const auth = getAuth();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      // navigation handled par listener, sinon: navigation.replace('Home')
    } catch (e) {
      setErr("Impossible de créer le compte. Vérifie l'email et le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={signUpStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={signUpStyles.header}>
        <Text style={signUpStyles.brand}>Mes Bonnes Adresses</Text>
      </View>

      <View style={signUpStyles.card}>
        <Text style={signUpStyles.title}>Créer un compte</Text>
        <Text style={signUpStyles.subtitle}>Bienvenue parmi nous ✨</Text>

        <View style={signUpStyles.field}>
          <Text style={signUpStyles.label}>Nom d’utilisateur</Text>
          <TextInput
            placeholder="ex: Jean Dupont"
            value={displayName}
            onChangeText={setDisplayName}
            style={signUpStyles.input}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={signUpStyles.field}>
          <Text style={signUpStyles.label}>Email</Text>
          <TextInput
            placeholder="ex: jean.dupont@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={signUpStyles.input}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={signUpStyles.field}>
          <Text style={signUpStyles.label}>Mot de passe</Text>
          <View style={signUpStyles.inputRow}>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              style={[signUpStyles.input, { flex: 1, marginBottom: 0 }]}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={signUpStyles.eye} onPress={() => setShowPwd((s) => !s)}>
              <Text style={signUpStyles.eyeText}>{showPwd ? 'Masquer' : 'Voir'}</Text>
            </Pressable>
          </View>
          <Text style={signUpStyles.hint}>Minimum 6 caractères.</Text>
        </View>

        {err ? <Text style={signUpStyles.error}>{err}</Text> : null}

        <Pressable style={[signUpStyles.btn, loading && signUpStyles.btnDisabled]} onPress={signup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={signUpStyles.btnText}>S’inscrire</Text>}
        </Pressable>

        <View style={signUpStyles.divider} />

        <View style={signUpStyles.rowCenter}>
          <Text style={signUpStyles.muted}>Déjà un compte ? </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={signUpStyles.linkStrong}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

