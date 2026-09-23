import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

export function FoodHeader({ location, cartCount, onPressLocation, onPressEPlan, onPressCart }: {
  location: string; cartCount: number;
  onPressLocation?: () => void; onPressEPlan?: () => void; onPressCart?: () => void;
}) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.locationBlock} onPress={onPressLocation}>
        <Text style={styles.label}>DELIVERING TO</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>{location}</Text>
          <Feather name="chevron-down" size={14} color={foodColors.textPrimary} />
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.ePlanBtn} onPress={onPressEPlan} activeOpacity={0.85}>
          <Text style={styles.ePlanText}>E Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onPressCart}>
          <Feather name="shopping-cart" size={18} color={foodColors.textPrimary} />
          {cartCount > 0 && <View style={[styles.badge, { backgroundColor: foodColors.primary }]}><Text style={styles.badgeText}>{cartCount}</Text></View>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationBlock: {},
  label: { fontSize: 10, fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 15, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ePlanBtn: {
    width: 80,
    height: 32,
    borderRadius: 12,
    backgroundColor:"white",
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  ePlanText: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#ff0000' },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: foodColors.background },
  badgeText: { fontSize: 9, fontFamily: fonts.poppins.bold, color: '#fff' },
});