import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

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
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // navigation handled by auth listener si présent ailleurs
    } catch (e) {
      setErr('Identifiants invalides ou compte introuvable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.brand}>Mes Bonnes Adresses</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Heureux de te revoir 👋</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="ex: jean.dupont@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={styles.eye} onPress={() => setShowPwd((s) => !s)}>
              <Text style={styles.eyeText}>{showPwd ? 'Masquer' : 'Voir'}</Text>
            </Pressable>
          </View>
        </View>

        {err ? <Text style={styles.error}>{err}</Text> : null}

        <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Se connecter</Text>}
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.rowCenter}>
          <Text style={styles.muted}>Nouveau ici ? </Text>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.linkStrong}>Créer un compte</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  header: { alignItems: 'center', marginTop: 12, marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: '800', color: '#0EA5E9' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4, color: '#111827' },
  subtitle: { color: '#6B7280', marginBottom: 16 },

  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingRight: 6,
  },
  eye: { paddingHorizontal: 10, paddingVertical: 8 },
  eyeText: { color: '#0EA5E9', fontWeight: '700' },

  btn: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  linkWrap: { alignItems: 'center', marginTop: 12 },
  link: { color: '#0EA5E9', fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  rowCenter: { flexDirection: 'row', justifyContent: 'center' },
  linkStrong: { color: '#0EA5E9', fontWeight: '800' },
  muted: { color: '#6B7280' },

  error: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
});
