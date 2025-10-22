import { StyleSheet } from 'react-native';


const createAddressStyles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 4 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  // Switch
  switchRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  switchLabel: { fontSize: 14, color: '#333' },

  // Photo preview
  photoPreviewWrap: {
    marginTop: 8,
    alignSelf: 'flex-start',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoPreview: { width: 120, height: 120, borderRadius: 10 },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },

  // Suggestions
  suggestion: { paddingVertical: 6 },

  // Web map
  webMap: { height: '100%', borderRadius: 10, backgroundColor: '#eef3ff' },
});


export default createAddressStyles;
