import { ReactNode, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { foodColors } from '../constants/foodColors';
import { fonts } from '../constants/typography';
import { ms } from '../utils/responsive';

export const PIN_LENGTH = 4;

export function useShake() {
  const anim = useRef(new Animated.Value(0)).current;
  const trigger = () => {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 7, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };
  return { anim, trigger };
}

function PinDot({ filled, active, error }: { filled: boolean; active: boolean; error: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (filled) {
      scale.setValue(0.6);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [filled, scale]);

  return (
    <Animated.View
      style={[
        styles.dot,
        active && styles.dotActive,
        filled && styles.dotFilled,
        error && styles.dotError,
        { transform: [{ scale }] },
      ]}
    />
  );
}

export function PinDots({
  filled,
  shakeAnim,
  error = false,
  length = PIN_LENGTH,
}: {
  filled: number;
  shakeAnim: Animated.Value;
  error?: boolean;
  length?: number;
}) {
  return (
    <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
      {Array.from({ length }, (_, i) => (
        <PinDot key={i} filled={filled > i} active={filled === i} error={error} />
      ))}
    </Animated.View>
  );
}

function NumKey({
  onPress,
  disabled,
  plain,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  plain?: boolean;
  children: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      friction: 6,
      tension: 220,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(0.9)}
      onPressOut={() => to(1)}
      disabled={disabled}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.key,
            plain && styles.keyPlain,
            pressed && (plain ? styles.keyPlainPressed : styles.keyPressed),
            { transform: [{ scale }] },
          ]}
        >
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
}

export function NumPad({
  onKey,
  disabled,
}: {
  onKey: (key: string) => void;
  disabled?: boolean;
}) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.pad}>
      {rows.map((row) => (
        <View key={row[0]} style={styles.padRow}>
          {row.map((k) => (
            <NumKey key={k} onPress={() => onKey(k)} disabled={disabled}>
              <Text style={styles.keyText}>{k}</Text>
            </NumKey>
          ))}
        </View>
      ))}
      <View style={styles.padRow}>
        <View style={styles.keyGhost} />
        <NumKey onPress={() => onKey('0')} disabled={disabled}>
          <Text style={styles.keyText}>0</Text>
        </NumKey>
        <NumKey plain onPress={() => onKey('⌫')} disabled={disabled}>
          <Feather name="delete" size={ms(22)} color={foodColors.textPrimary} />
        </NumKey>
      </View>
    </View>
  );
}

const KEY_SIZE = ms(68);

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row', gap: ms(18) },
  dot: {
    width: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    borderWidth: 1.5,
    borderColor: foodColors.border,
    backgroundColor: 'transparent',
  },
  dotActive: { borderColor: foodColors.primary },
  dotFilled: { backgroundColor: foodColors.primary, borderColor: foodColors.primary },
  dotError: { borderColor: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.9)' },

  pad: {
    width: '100%',
    maxWidth: ms(300),
    alignSelf: 'center',
    gap: ms(12),
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  keyPressed: { backgroundColor: foodColors.primaryLight },
  keyPlain: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keyPlainPressed: { backgroundColor: 'rgba(0,0,0,0.05)' },
  keyGhost: { width: KEY_SIZE, height: KEY_SIZE },
  keyText: {
    fontSize: ms(26),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },
});