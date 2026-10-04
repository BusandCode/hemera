import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

export function ViewOrderBar({ itemCount, total, onPress }: { itemCount: number; total: number; onPress?: () => void }) {
  if (itemCount === 0) return null;
  const totalFmt = `₦${total.toLocaleString('en-US')}`;
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.bar} onPress={onPress}>
        <View style={styles.countBadge}>
          <Text style={styles.countText} maxFontSizeMultiplier={1}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          View Order
        </Text>
        <Text style={styles.total} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {totalFmt}
        </Text>
        <Feather name="chevron-right" size={ms(16)} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: ms(16) },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.primaryDark,
    borderRadius: ms(16),
    paddingVertical: ms(12),
    paddingHorizontal: ms(16),
    // Full width on phones, but don't stretch edge-to-edge on tablets.
    width: '100%',
    maxWidth: 520,
  },
  countBadge: {
    minWidth: ms(22), height: ms(22), borderRadius: ms(11), paddingHorizontal: 4,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  countText: { fontSize: ms(11), fontFamily: fonts.poppins.bold, color: foodColors.primaryDark },
  label: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: '#fff', flexShrink: 1 },
  total: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: '#fff', marginLeft: 'auto' },
});