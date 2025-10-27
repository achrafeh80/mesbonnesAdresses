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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';
import logInStyles from '../styles/loginStyles';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const login = async () => {
    setErr('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setErr('Identifiants invalides ou compte introuvable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={logInStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={logInStyles.header}>
        <Text style={logInStyles.brand}>Mes Bonnes Adresses</Text>
      </View>

      <View style={logInStyles.card}>
        <Text style={logInStyles.title}>Connexion</Text>
        <Text style={logInStyles.subtitle}>Heureux de te revoir 👋</Text>

        <View style={logInStyles.field}>
          <Text style={logInStyles.label}>Email</Text>
          <TextInput
            placeholder="ex: jean.dupont@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={logInStyles.input}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={logInStyles.field}>
          <Text style={logInStyles.label}>Mot de passe</Text>
          <View style={logInStyles.inputRow}>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              style={[logInStyles.input, { flex: 1, marginBottom: 0 }]}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={logInStyles.eye} onPress={() => setShowPwd((s) => !s)}>
              <Text style={logInStyles.eyeText}>{showPwd ? 'Masquer' : 'Voir'}</Text>
            </Pressable>
          </View>
        </View>

        {err ? <Text style={logInStyles.error}>{err}</Text> : null}

        <Pressable style={[logInStyles.btn, loading && logInStyles.btnDisabled]} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={logInStyles.btnText}>Se connecter</Text>}
        </Pressable>

        <View style={logInStyles.divider} />

        <View style={logInStyles.rowCenter}>
          <Text style={logInStyles.muted}>Nouveau ici ? </Text>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={logInStyles.linkStrong}>Créer un compte</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}