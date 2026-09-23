import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { foodColors } from '../../constants/foodColors';
import { FoodCategory, categories } from '../../constants/foodData';
import { fonts } from '../../constants/typography';

export function CategoryTabs({ active, onSelect }: { active: FoodCategory; onSelect: (c: FoodCategory) => void }) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>CATEGORIES</Text>
        <View style={styles.headerLine} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {categories.map((c) => {
          const isActive = c === active;
          return (
            <TouchableOpacity key={c} onPress={() => onSelect(c)} style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}>
              <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5,marginTop:-4 },
  headerLabel: { fontSize: 11, fontFamily: fonts.poppins.bold, letterSpacing: 0.8, color: foodColors.textMuted },
  headerLine: { flex: 1, height: 1, backgroundColor: foodColors.border },
  row: { gap: 8, paddingRight: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  pillActive: { backgroundColor: foodColors.primaryDark, borderColor: foodColors.primaryDark },
  pillInactive: { backgroundColor: foodColors.surface, borderColor: foodColors.border },
  pillText: { fontSize: 12.5, fontFamily: fonts.poppins.semiBold },
  pillTextActive: { color: '#fff' },
  pillTextInactive: { color: foodColors.textSecondary },
});