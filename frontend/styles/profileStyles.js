import { StyleSheet } from 'react-native';
const profileStyles = StyleSheet.create({
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
export default profileStyles;