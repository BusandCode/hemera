import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';
import { AppDialog } from '../src/components/AppDialog';

type Step = 'password' | 'new_pin' | 'confirm_pin';
const PIN_LENGTH = 4;

function useShake() {
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

function PinDots({ filled, shakeAnim }: { filled: number; shakeAnim: Animated.Value }) {
  return (
    <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            filled > i && styles.dotFilled,
            filled === i && styles.dotActive,
          ]}
        />
      ))}
    </Animated.View>
  );
}

function NumPad({ onKey, disabled }: { onKey: (key: string) => void; disabled?: boolean }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <View style={styles.numPad}>
      {keys.map((k) => (
        <TouchableOpacity
          key={k}
          style={styles.numKey}
          onPress={() => onKey(k)}
          disabled={disabled}
          activeOpacity={0.6}
        >
          <Text style={styles.numKeyText}>{k}</Text>
        </TouchableOpacity>
      ))}
      <View style={[styles.numKey, styles.numKeyGhost]} />
      <TouchableOpacity
        style={styles.numKey}
        onPress={() => onKey('0')}
        disabled={disabled}
        activeOpacity={0.6}
      >
        <Text style={styles.numKeyText}>0</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.numKey}
        onPress={() => onKey('⌫')}
        disabled={disabled}
        activeOpacity={0.6}
      >
        <Feather name="delete" size={ms(22)} color={foodColors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

export default function ResetPinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doneOpen, setDoneOpen] = useState(false);

  const { anim: shakeAnim, trigger: shake } = useShake();

  const email = session?.user.email ?? '';

  const submitPassword = async () => {
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      Keyboard.dismiss();
      setStep('new_pin');
    } catch {
      shake();
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPinKey = (key: string) => {
    if (loading) return;
    if (key === '⌫') {
      setNewPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (newPin.length >= PIN_LENGTH) return;
    const next = newPin + key;
    setNewPin(next);
    if (next.length === PIN_LENGTH) setTimeout(() => setStep('confirm_pin'), 200);
  };

  const handleConfirmPinKey = (key: string) => {
    if (loading) return;
    if (key === '⌫') {
      setConfirmPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (confirmPin.length >= PIN_LENGTH) return;
    const next = confirmPin + key;
    setConfirmPin(next);
    if (next.length === PIN_LENGTH) setTimeout(() => finishReset(next), 150);
  };

  const finishReset = async (entered: string) => {
    if (entered !== newPin) {
      shake();
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc('reset_pin', { p_new_pin: newPin });
      if (rpcError) throw new Error(rpcError.message);
      setDoneOpen(true);
    } catch (e: any) {
      shake();
      setConfirmPin('');
      setNewPin('');
      setStep('new_pin');
      setError(e?.message ?? 'Could not reset PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    step === 'password'
      ? 'Verify identity'
      : step === 'new_pin'
        ? 'Create new PIN'
        : 'Confirm new PIN';

  const subtitle =
    step === 'password'
      ? 'Enter your account password to continue'
      : step === 'new_pin'
        ? 'Choose a new 4-digit PIN'
        : 'Re-enter your new PIN to confirm';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <View style={[styles.inner, { paddingTop: insets.top + ms(12) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={ms(20)} color={foodColors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {step === 'password' && (
          <View style={styles.passArea}>
            <View style={styles.passWrap}>
              <TextInput
                style={styles.passInput}
                placeholder="Enter your password"
                placeholderTextColor={foodColors.textMuted}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                autoFocus
                onSubmitEditing={submitPassword}
                returnKeyType="go"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPass((v) => !v)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather
                  name={showPass ? 'eye-off' : 'eye'}
                  size={ms(18)}
                  color={foodColors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              style={[styles.ctaBtn, loading && styles.ctaBtnOff]}
              onPress={submitPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.ctaRow}>
                  <Text style={styles.ctaText}>Continue</Text>
                  <Feather name="arrow-right" size={ms(15)} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'new_pin' && (
          <View style={styles.pinArea}>
            <PinDots filled={newPin.length} shakeAnim={shakeAnim} />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <NumPad onKey={handleNewPinKey} disabled={loading} />
          </View>
        )}

        {step === 'confirm_pin' && (
          <View style={styles.pinArea}>
            <PinDots filled={confirmPin.length} shakeAnim={shakeAnim} />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {loading && <ActivityIndicator color={foodColors.primary} style={{ marginTop: 6 }} />}
            <NumPad onKey={handleConfirmPinKey} disabled={loading} />
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => {
                setStep('new_pin');
                setConfirmPin('');
                setError('');
              }}
            >
              <Feather name="arrow-left" size={ms(13)} color={foodColors.textMuted} />
              <Text style={styles.backLinkText}>Change new PIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {doneOpen && (
        <AppDialog
          visible
          tone="success"
          title="PIN updated"
          message="Your new PIN is active. Use it to unlock the app next time."
          primaryLabel="Done"
          onPrimary={() => {
            setDoneOpen(false);
            router.replace('/(tabs)' as any);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  inner: { flex: 1, paddingHorizontal: ms(24) },

  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: foodColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(18),
  },

  header: { marginBottom: ms(24) },
  title: { fontSize: ms(22), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  subtitle: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(4),
  },

  passArea: { gap: ms(12) },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(16),
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  passInput: {
    flex: 1,
    fontSize: ms(15),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    paddingVertical: ms(15),
    letterSpacing: 0.5,
  },
  ctaBtn: {
    backgroundColor: foodColors.primary,
    borderRadius: ms(14),
    paddingVertical: ms(15),
    alignItems: 'center',
    marginTop: ms(4),
  },
  ctaBtnOff: { opacity: 0.5 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  ctaText: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    letterSpacing: 0.2,
  },

  pinArea: { alignItems: 'center', gap: ms(18) },
  dotsRow: { flexDirection: 'row', gap: ms(20), marginBottom: ms(4) },
  dot: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    borderWidth: 1.5,
    borderColor: foodColors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: foodColors.primary, borderColor: foodColors.primary },
  dotActive: { borderColor: foodColors.primary },
  errorText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: '#FF3B30',
    textAlign: 'center',
  },

  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: ms(4),
    maxWidth: ms(320),
  },
  numKey: {
    width: '30%',
    aspectRatio: 1.6,
    borderRadius: ms(20),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: foodColors.border,
    marginVertical: ms(5),
  },
  numKeyGhost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  numKeyText: {
    fontSize: ms(24),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
    letterSpacing: 0.5,
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    justifyContent: 'center',
    marginTop: ms(6),
    paddingVertical: ms(4),
  },
  backLinkText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textMuted,
  },
});