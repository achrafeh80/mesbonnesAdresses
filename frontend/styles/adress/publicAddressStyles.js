import { StyleSheet } from 'react-native';

const publicAddressStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FC' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cover: { width: '100%', height: 160, backgroundColor: '#eaeef7' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderText: { color: '#6b7280', fontStyle: 'italic' },

  content: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { marginTop: 2, color: '#6B7280' },

  metaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  badgePublic: { backgroundColor: '#ECFDF5' },
  badgePublicText: { color: '#059669', fontWeight: '700', fontSize: 12 },

  ratingWrap: { flexDirection: 'row', alignItems: 'center' },
  star: { fontSize: 16, color: '#F59E0B', marginRight: 4 },
  ratingText: { color: '#111827' },

  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
export default publicAddressStyles;