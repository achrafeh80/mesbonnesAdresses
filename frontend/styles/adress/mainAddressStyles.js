import { StyleSheet } from 'react-native';

const mainAddressStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FC' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  createBtn: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  createBtnText: { color: '#fff', fontWeight: '700' },

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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  desc: { color: '#6B7280', marginTop: 4 },

  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  badgePublic: { backgroundColor: '#ECFDF5' },
  badgePrivate: { backgroundColor: '#FEF3C7' },
  badgePublicText: { color: '#059669', fontWeight: '700', fontSize: 12 },
  badgePrivateText: { color: '#B45309', fontWeight: '700', fontSize: 12 },

  metaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingWrap: { flexDirection: 'row', alignItems: 'center' },
  star: { fontSize: 16, color: '#F59E0B', marginRight: 4 },
  ratingText: { color: '#111827' },
  ownerTag: { color: '#6B7280', fontStyle: 'italic' },

  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
export default mainAddressStyles;