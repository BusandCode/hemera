// src/components/profile/ScreenHeader.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

type Props = {
  title: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  rightLabel?: string;
  onPressRight?: () => void;
};

export function ScreenHeader({ title, rightIcon, rightLabel, onPressRight }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
      <TouchableOpacity
        style={styles.sideButton}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={ms(22)} color={foodColors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {title}
      </Text>

      {rightIcon && onPressRight ? (
        <TouchableOpacity style={[styles.sideButton, styles.rightButton]} onPress={onPressRight}>
          <Feather name={rightIcon} size={ms(15)} color={foodColors.primary} />
          {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5.5%',
    paddingBottom: ms(14),
  },
  sideButton: {
    minWidth: ms(40),
    height: ms(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: ms(8),
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    justifyContent: 'flex-end',
  },
  rightLabel: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
});