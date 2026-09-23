// src/components/profile/ScreenHeader.tsx
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

type Props = {
  title: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  rightLabel?: string;
  onPressRight?: () => void;
};

export function ScreenHeader({ title, rightIcon, rightLabel, onPressRight }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.sideButton}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={22} color={foodColors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightIcon && onPressRight ? (
        <TouchableOpacity style={[styles.sideButton, styles.rightButton]} onPress={onPressRight}>
          <Feather name={rightIcon} size={15} color={foodColors.primary} />
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
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
    paddingBottom: 14,
  },
  sideButton: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  rightLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
});