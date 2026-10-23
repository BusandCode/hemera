import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { MenuItem } from '../../constants/foodData';
import { fonts } from '../../constants/typography';
import { useCart } from '../../context/CartContext';
import { ms, clamp, MAX_FONT_SCALE } from '../../utils/responsive';

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { width } = useWindowDimensions();
  const { addItem, setQty, quantityOf } = useCart();
  const qty = quantityOf(item.id) || 1;
  const priceFmt = `₦${item.price.toLocaleString('en-US')}`;

  // The plate image used to be a fixed 140px, which left almost no room for the
  // text on small phones. Now it's ~30% of the screen, between 96 and 150px.
  const imageSize = clamp(Math.round(width * 0.3), 96, 150);
  const actionsWidth = clamp(Math.round(width * 0.19), 64, 84);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.partnerName} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {item.partnerName}
        </Text>
        {item.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText} maxFontSizeMultiplier={MAX_FONT_SCALE}>🔥 POPULAR</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {item.name}
        </Text>
        <Text style={styles.description} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {item.description}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {priceFmt}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="star" size={ms(10)} color={foodColors.primary} />
            <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {item.rating} • {item.etaMinutes} min
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          width: imageSize,
          height: imageSize,
          // Overlap with the action column scales with the image, as in the original design.
          marginRight: -Math.round(imageSize * 0.15),
        }}
      >
        <Image source={{ uri: item.image }} style={[styles.image, { borderRadius: imageSize / 2 }]} />
        <View style={styles.addDot}>
          <Feather name="plus" size={ms(14)} color="#fff" />
        </View>
      </View>

      <View style={[styles.actions, { width: actionsWidth, marginTop: Math.round(imageSize * 0.28) }]}>
        <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item, qty)} activeOpacity={0.85}>
          <Text style={styles.addBtnText} maxFontSizeMultiplier={1.1}>ADD TO{'\n'}ORDER</Text>
          <Feather name="arrow-right" size={ms(12)} color="#fff" style={styles.addBtnIcon} />
        </TouchableOpacity>

        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => setQty(item.id, Math.max(1, qty - 1))}
            style={styles.stepBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Feather name="minus" size={ms(16)} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stepValue} maxFontSizeMultiplier={1.1}>{qty}</Text>
          <TouchableOpacity
            onPress={() => setQty(item.id, qty + 1)}
            style={styles.stepBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Feather name="plus" size={ms(16)} color={foodColors.textPrimary} />
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
    borderRadius: ms(16),
    padding: ms(10),
    gap: ms(10),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  info: { flex: 1, minWidth: 0 },
  partnerName: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: foodColors.primary, letterSpacing: 0.3 },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: foodColors.popularBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: ms(4),
  },
  popularText: { fontSize: ms(9), fontFamily: fonts.poppins.bold, color: foodColors.popularText },
  name: { fontSize: ms(14), lineHeight: ms(19), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: ms(5) },
  // Was 8.5px — unreadable on most phones.
  description: { fontSize: ms(10.5), lineHeight: ms(14), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 3 },
  bottomRow: { marginTop: ms(8), gap: 3 },
  price: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { fontSize: ms(10), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },

  image: { width: '100%', height: '100%' },
  addDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: foodColors.surface,
  },

  actions: { alignItems: 'center', gap: ms(8) },
  addBtn: {
    alignSelf: 'stretch',
    marginLeft: ms(10),
    paddingVertical: ms(6),
    borderRadius: ms(14),
    backgroundColor: foodColors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { fontSize: ms(9), lineHeight: ms(11), fontFamily: fonts.poppins.bold, color: '#fff', textAlign: 'center' },
  addBtnIcon: { marginTop: 2 },

  // Small pill, but with larger − and + icons inside it.
  stepper: {
    alignSelf: 'stretch',
    // width:,
    marginLeft: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: ms(3),
    height: ms(24),
  },
  stepBtn: { width: ms(20), height: ms(20), justifyContent: 'center', alignItems: 'center' },
  stepValue: { fontSize: ms(11.5), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
});