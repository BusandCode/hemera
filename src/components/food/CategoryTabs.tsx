import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { FoodCategory, categories } from '../../constants/foodData';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

export function CategoryTabs({ active, onSelect, onPressThrud }: { active: FoodCategory; onSelect: (c: FoodCategory) => void; onPressThrud?: () => void }) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>CATEGORIES</Text>
        <View style={styles.headerLine} />
        {onPressThrud && (
          <TouchableOpacity onPress={onPressThrud} style={styles.thrudLink} activeOpacity={0.6} hitSlop={8}>
            <Text style={styles.thrudText} maxFontSizeMultiplier={MAX_FONT_SCALE}>View Thrud</Text>
            <Feather name="arrow-right" size={ms(14)} color={foodColors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((c) => {
          const isActive = c === active;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onSelect(c)}
              style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
            >
              <Text
                style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10), marginBottom: ms(8) },
  headerLabel: { fontSize: ms(11), fontFamily: fonts.poppins.bold, letterSpacing: 0.8, color: foodColors.textMuted },
  headerLine: { flex: 1, height: 1, backgroundColor: foodColors.border },
  thrudLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  thrudText: { color: foodColors.primary, fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold },
  row: { gap: ms(6), paddingRight: 16 },
  pill: { paddingHorizontal: ms(13), paddingVertical: ms(7), borderRadius: ms(16), borderWidth: 1 },
  pillActive: { backgroundColor: foodColors.primaryDark, borderColor: foodColors.primaryDark },
  pillInactive: { backgroundColor: foodColors.surface, borderColor: foodColors.border },
  pillText: { fontSize: ms(11.5), fontFamily: fonts.poppins.semiBold },
  pillTextActive: { color: '#fff' },
  pillTextInactive: { color: foodColors.textSecondary },
});