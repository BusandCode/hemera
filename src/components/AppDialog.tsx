// src/components/AppDialog.tsx
// The app's own pop-up, used instead of the system Alert.
// Fades in over a dimmed background, with an icon, title, message and up to two buttons.
import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { foodColors } from '../constants/foodColors';
import { fonts } from '../constants/typography';

export type DialogTone = 'danger' | 'success' | 'error' | 'info';

type Props = {
  visible: boolean;
  tone?: DialogTone;
  title: string;
  message?: string;
  /** Main button. Omit to show only the secondary one. */
  primaryLabel?: string;
  onPrimary?: () => void;
  /** Second, quieter button (e.g. "Keep pickup"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Shows a spinner on the main button and blocks closing. */
  loading?: boolean;
  /** Tapping the dimmed background or Android back. Defaults to onSecondary. */
  onDismiss?: () => void;
};

const TONES: Record<DialogTone, { icon: keyof typeof Feather.glyphMap; fg: string; bg: string; button: string }> = {
  danger: { icon: 'x-circle', fg: foodColors.primary, bg: 'rgba(226,58,46,0.1)', button: foodColors.primary },
  error: { icon: 'alert-circle', fg: '#FF3B30', bg: 'rgba(255,59,48,0.1)', button: '#1E3A9F' },
  success: { icon: 'check', fg: '#fff', bg: '#1F9D55', button: '#1E3A9F' },
  info: { icon: 'info', fg: '#1E3A9F', bg: '#DBEAFE', button: '#1E3A9F' },
};

export function AppDialog({
  visible,
  tone = 'info',
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  loading = false,
  onDismiss,
}: Props) {
  const t = TONES[tone];
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [visible, tone, scale, opacity]);

  const dismiss = () => {
    if (loading) return;
    (onDismiss ?? onSecondary ?? onPrimary)?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />

        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.iconOuter, { backgroundColor: tone === 'success' ? 'rgba(31,157,85,0.12)' : 'transparent' }]}>
            <View style={[styles.iconInner, { backgroundColor: t.bg }]}>
              <Feather name={t.icon} size={26} color={t.fg} />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttons}>
            {!!primaryLabel && (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: t.button }]}
                activeOpacity={0.85}
                onPress={onPrimary}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>{primaryLabel}</Text>
                )}
              </TouchableOpacity>
            )}

            {!!secondaryLabel && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.7}
                onPress={onSecondary}
                disabled={loading}
              >
                <Text style={[styles.secondaryText, loading && { opacity: 0.4 }]}>{secondaryLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,16,32,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  buttons: { alignSelf: 'stretch', marginTop: 22, gap: 6 },
  primaryBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
  secondaryBtn: { height: 44, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { fontSize: 13.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
});