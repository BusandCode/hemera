// src/components/profile/FilterTabs.tsx
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

type Props = {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
};

export function FilterTabs({ tabs, active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: foodColors.surface,
  },
  pillActive: {
    backgroundColor: foodColors.primary,
  },
  pillText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textSecondary,
  },
  pillTextActive: {
    color: '#fff',
  },
});