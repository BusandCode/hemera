import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

export function SearchBar({ value, onChangeText }: { value?: string; onChangeText?: (text: string) => void }) {
  return (
    <View style={styles.wrapper}>
      <Feather name="search" size={ms(15)} color={foodColors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder="Search meals, restaurants, bukas..."
        placeholderTextColor={foodColors.textMuted}
        value={value}
        onChangeText={onChangeText}
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: foodColors.surface,
    borderRadius: ms(12),
    paddingHorizontal: ms(12),
    height: ms(42),
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    paddingVertical: 0,
  },
});