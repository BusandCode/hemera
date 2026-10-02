import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

export function SearchBar({ value, onChangeText }: { value?: string; onChangeText?: (text: string) => void }) {
  return (
    <View style={styles.wrapper}>
      <Feather name="search" size={15} color={foodColors.textMuted} />
      <TextInput style={styles.input} placeholder="Search meals, restaurants, bukas..." placeholderTextColor={foodColors.textMuted} value={value} onChangeText={onChangeText} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: foodColors.surface, borderRadius: 12, paddingHorizontal: 12, height: 38, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  input: { flex: 1, fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, paddingVertical: 0 },
});