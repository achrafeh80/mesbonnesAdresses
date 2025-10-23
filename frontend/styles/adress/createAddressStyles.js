import { StyleSheet } from 'react-native';


const createAddressStyles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 32, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  switchRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  switchLabel: { fontSize: 14, color: '#333' },

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

  suggestionsWrap: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  suggestionText: { color: '#222' },

  webMap: { height: '100%', borderRadius: 10, backgroundColor: '#eef3ff' },
});

export default createAddressStyles;
