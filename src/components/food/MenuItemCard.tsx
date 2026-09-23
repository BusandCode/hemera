import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { MenuItem } from '../../constants/foodData';
import { useCart } from '../../context/CartContext';

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem, setQty, quantityOf } = useCart();
  const qty = quantityOf(item.id) || 1;
  const priceFmt = `₦${item.price.toLocaleString('en-US')}`;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.partnerName}>{item.partnerName}</Text>
        {item.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>🔥 POPULAR</Text>
          </View>
        )}
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{priceFmt}</Text>
          <View style={styles.metaRow}>
            <Feather name="star" size={10} color={foodColors.primary} />
            <Text style={styles.meta}>{item.rating} • {item.etaMinutes} min</Text>
          </View>
        </View>
      </View>

      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.addDot}>
          <Feather name="plus" size={16} color="#fff" />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item, qty)} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>ADD TO{'\n'}ORDER</Text>
          <Feather name="arrow-right" size={12} color="#fff" style={styles.addBtnIcon} />
        </TouchableOpacity>

        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setQty(item.id, Math.max(1, qty - 1))} style={styles.stepBtn}>
            <Feather name="minus" size={12} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stepValue}>{qty}</Text>
          <TouchableOpacity onPress={() => setQty(item.id, qty + 1)} style={styles.stepBtn}>
            <Feather name="plus" size={12} color={foodColors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  info: { flex: 1, minWidth: 0 },
  partnerName: { fontSize: 10, fontWeight: '700', color: foodColors.primary, letterSpacing: 0.3 },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: foodColors.popularBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  popularText: { fontSize: 9, fontWeight: '700', color: foodColors.popularText },
  name: { fontSize: 15, fontWeight: '700', color: foodColors.textPrimary, marginTop: 6 },
  description: { fontSize: 8.5, color: foodColors.textSecondary, marginTop: 3 },
  bottomRow: { marginTop: 10, gap: 4 },
  price: { fontSize: 15, fontWeight: '700', color: foodColors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { fontSize: 10, color: foodColors.textSecondary },

  imageWrap: { width: 140, height: 140, marginRight: -21 },
  image: { width: '100%', height: '100%', borderRadius: 70 },
  addDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: foodColors.surface,
  },

  actions: { alignItems: 'center', gap: 8, width: 78 },
  addBtn: {
    width: 58,
    marginTop: 40,
    height: 44,
    marginRight: -20,
    marginBottom: -5,
    borderRadius: 14,
    backgroundColor: foodColors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { fontSize: 9, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 11 },
  addBtnIcon: { marginTop: 3 },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginTop:2,
    marginRight: -16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 6,
    height: 30,
    width: 68,
  },
  stepBtn: { width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  stepValue: { fontSize: 12, fontWeight: '700', color: foodColors.textPrimary },
});