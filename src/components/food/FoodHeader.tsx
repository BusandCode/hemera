import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

export function FoodHeader({ location, cartCount, onPressLocation, onPressEPlan, onPressCart }: {
  location: string; cartCount: number;
  onPressLocation?: () => void; onPressEPlan?: () => void; onPressCart?: () => void;
}) {
  return (
    <View style={styles.row}>
      {/* flex: 1 + numberOfLines so a long "LGA, State" never pushes the buttons off screen */}
      <TouchableOpacity style={styles.locationBlock} onPress={onPressLocation}>
        <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_SCALE}>DELIVERING TO</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationText} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {location}
          </Text>
          <Feather name="chevron-down" size={ms(14)} color={foodColors.textPrimary} />
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.ePlanBtn} onPress={onPressEPlan} activeOpacity={0.85}>
          <Text style={styles.ePlanText} maxFontSizeMultiplier={MAX_FONT_SCALE}>E Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onPressCart}>
          <Feather name="shopping-cart" size={ms(18)} color={foodColors.textPrimary} />
          {cartCount > 0 && (
            <View style={[styles.badge, { backgroundColor: foodColors.primary }]}>
              <Text style={styles.badgeText} maxFontSizeMultiplier={1}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: ms(10) },
  locationBlock: { flex: 1, minWidth: 0 },
  label: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { flexShrink: 1, fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  ePlanBtn: {
    paddingHorizontal: ms(14),
    height: ms(36),
    borderRadius: ms(12),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  ePlanText: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.primary },
  iconBtn: {
    width: ms(38), height: ms(38), borderRadius: ms(12),
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: ms(17), height: ms(17), borderRadius: ms(9),
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: foodColors.background,
  },
  badgeText: { fontSize: ms(9), fontFamily: fonts.poppins.bold, color: '#fff' },
});