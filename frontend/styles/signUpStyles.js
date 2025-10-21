import { StyleSheet } from 'react-native';

const signUpStyles = StyleSheet.create({
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
  hint: { color: '#6B7280', marginTop: 6, fontSize: 12 },

  btn: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

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
export default signUpStyles;