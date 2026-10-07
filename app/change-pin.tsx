import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';
import { AppDialog } from '../src/components/AppDialog';
import { NumPad, PinDots, PIN_LENGTH, useShake } from '../src/components/PinPad';

type Step = 'current' | 'new' | 'confirm';
const LOCKED_MESSAGE = 'Too many attempts. Try again in 15 minutes.';

const STEP_ICON: Record<Step, keyof typeof Feather.glyphMap> = {
  current: 'lock',
  new: 'shield',
  confirm: 'check-circle',
};

export default function ChangePinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>('new');
  const [current, setCurrent] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doneOpen, setDoneOpen] = useState(false);

  const { anim: shakeAnim, trigger: shake } = useShake();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.rpc('has_pin');
        const exists = data === true;
        setHasPin(exists);
        setStep(exists ? 'current' : 'new');
      } catch {
        setHasPin(false);
        setStep('new');
      }
    })();
  }, []);

  const isChange = hasPin === true;

  const value = step === 'current' ? current : step === 'new' ? newPin : confirmPin;
  const setValue = step === 'current' ? setCurrent : step === 'new' ? setNewPin : setConfirmPin;

  const verifyCurrent = async (entered: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('verify_pin', { p_pin: entered });
      if (rpcError) throw new Error(rpcError.message);
      if (data === true) {
        setStep('new');
        return;
      }
      shake();
      setCurrent('');
      setError('Incorrect PIN. Please try again.');
    } catch (e: any) {
      shake();
      setCurrent('');
      setError(
        String(e?.message ?? '').includes('pin_locked')
          ? LOCKED_MESSAGE
          : 'Could not verify PIN. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const acceptNew = (entered: string) => {
    if (isChange && entered === current) {
      shake();
      setNewPin('');
      setError('New PIN must be different from your current PIN.');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const save = async (entered: string) => {
    if (entered !== newPin) {
      shake();
      setConfirmPin('');
      setError('PINs do not match. Try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('set_pin', {
        p_new_pin: newPin,
        p_current_pin: isChange ? current : null,
      });
      if (rpcError) throw new Error(rpcError.message);

      if (data === 'ok') {
        setDoneOpen(true);
        return;
      }

      shake();
      setConfirmPin('');
      setNewPin('');
      setCurrent('');

      if (data === 'current_pin_required') {
        setHasPin(true);
        setStep('current');
        setError('Enter your current PIN to continue.');
      } else if (data === 'wrong_current_pin') {
        setStep('current');
        setError('Current PIN is incorrect.');
      } else if (data === 'pin_locked') {
        setStep(isChange ? 'current' : 'new');
        setError(LOCKED_MESSAGE);
      } else {
        setStep('new');
        setError('PIN must be exactly 4 digits.');
      }
    } catch {
      shake();
      setConfirmPin('');
      setError('Could not save PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (key: string) => {
    if (loading) return;
    if (key === '⌫') {
      setValue((v) => v.slice(0, -1));
      setError('');
      return;
    }
    if (!/^\d$/.test(key) || value.length >= PIN_LENGTH) return;

    setError('');
    const next = value + key;
    setValue(next);
    if (next.length < PIN_LENGTH) return;

    if (step === 'current') setTimeout(() => verifyCurrent(next), 150);
    else if (step === 'new') setTimeout(() => acceptNew(next), 200);
    else setTimeout(() => save(next), 150);
  };

  const title =
    step === 'current'
      ? 'Enter current PIN'
      : step === 'new'
        ? isChange
          ? 'Create new PIN'
          : 'Create your PIN'
        : isChange
          ? 'Confirm new PIN'
          : 'Confirm your PIN';

  const subtitle =
    step === 'current'
      ? 'Enter your current 4-digit PIN to continue'
      : step === 'new'
        ? isChange
          ? 'Choose a new 4-digit PIN'
          : 'Choose a 4-digit PIN to confirm payments and unlock the app'
        : 'Re-enter your PIN to confirm';

  const totalSteps = isChange ? 3 : 2;
  const stepIndex =
    step === 'current' ? 0 : step === 'new' ? (isChange ? 1 : 0) : isChange ? 2 : 1;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + ms(12), paddingBottom: insets.bottom + ms(16) },
        ]}
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={ms(20)} color={foodColors.textPrimary} />
          </TouchableOpacity>

          {hasPin !== null && (
            <View style={styles.stepBars}>
              {Array.from({ length: totalSteps }, (_, i) => (
                <View key={i} style={[styles.stepBar, i <= stepIndex && styles.stepBarOn]} />
              ))}
            </View>
          )}
        </View>

        {hasPin === null ? (
          <View style={styles.loader}>
            <ActivityIndicator color={foodColors.primary} />
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.top}>
              <View style={styles.iconCircle}>
                <Feather name={STEP_ICON[step]} size={ms(26)} color={foodColors.primary} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>

              <View style={styles.dotsArea}>
                <PinDots filled={value.length} shakeAnim={shakeAnim} error={!!error} />
                <View style={styles.statusSlot}>
                  {loading ? (
                    <ActivityIndicator size="small" color={foodColors.primary} />
                  ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.bottom}>
              <NumPad onKey={handleKey} disabled={loading} />

              <View style={styles.linkSlot}>
                {step === 'current' && (
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => router.push('/reset-pin' as any)}
                  >
                    <Text style={styles.linkText}>Forgot PIN?</Text>
                  </TouchableOpacity>
                )}
                {step === 'confirm' && (
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() => {
                      setStep('new');
                      setNewPin('');
                      setConfirmPin('');
                      setError('');
                    }}
                  >
                    <Feather name="arrow-left" size={ms(13)} color={foodColors.textMuted} />
                    <Text style={styles.linkTextMuted}>
                      {isChange ? 'Change new PIN' : 'Change PIN'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {doneOpen && (
        <AppDialog
          visible
          tone="success"
          title={isChange ? 'PIN updated' : 'PIN set'}
          message={
            isChange
              ? 'Your new PIN is active. Use it to confirm payments and unlock the app.'
              : 'Your PIN is ready. Use it to confirm payments and unlock the app.'
          }
          primaryLabel="Done"
          onPrimary={() => {
            setDoneOpen(false);
            router.back();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  inner: { flex: 1, paddingHorizontal: ms(24) },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: foodColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBars: { flexDirection: 'row', gap: ms(6) },
  stepBar: {
    width: ms(26),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: foodColors.border,
  },
  stepBarOn: { backgroundColor: foodColors.primary },

  body: { flex: 1, justifyContent: 'space-between' },
  top: { alignItems: 'center', paddingTop: ms(20) },
  iconCircle: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(16),
  },
  title: {
    fontSize: ms(21),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(4),
    paddingHorizontal: ms(16),
  },

  dotsArea: { alignItems: 'center', marginTop: ms(28), gap: ms(14) },
  statusSlot: { minHeight: ms(20), justifyContent: 'center' },
  errorText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: '#FF3B30',
    textAlign: 'center',
  },

  bottom: { alignItems: 'center' },
  linkSlot: { minHeight: ms(36), justifyContent: 'center', marginTop: ms(10) },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    justifyContent: 'center',
    paddingVertical: ms(6),
    paddingHorizontal: ms(12),
  },
  linkText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  linkTextMuted: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textMuted,
  },
});