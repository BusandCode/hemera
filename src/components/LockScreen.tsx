import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  Image,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../constants/foodColors';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';
import { ms } from '../utils/responsive';

type Mode = 'pin' | 'password';
const PIN_LENGTH = 4;

type Props = {
  onUnlock: () => void;
  onForgotPin: () => void;
  onSwitchAccount: () => void;
  /** Does this user have a PIN set? If false, we skip straight to password. */
  hasPin: boolean;
};

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
        <TouchableOpacity key={k} style={styles.numKey} onPress={() => onKey(k)} disabled={disabled} activeOpacity={0.6}>
          <Text style={styles.numKeyText}>{k}</Text>
        </TouchableOpacity>
      ))}

      {/* Empty spacer keeps 0 centred */}
      <View style={[styles.numKey, styles.numKeyGhost]} />

      <TouchableOpacity style={styles.numKey} onPress={() => onKey('0')} disabled={disabled} activeOpacity={0.6}>
        <Text style={styles.numKeyText}>0</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.numKey} onPress={() => onKey('⌫')} disabled={disabled} activeOpacity={0.6}>
        <Feather name="delete" size={ms(22)} color={foodColors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

export function LockScreen({ onUnlock, onForgotPin, onSwitchAccount, hasPin }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();

  const [mode, setMode] = useState<Mode>(hasPin ? 'pin' : 'password');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const { anim: shakeAnim, trigger: shake } = useShake();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const fullName = profile?.fullName?.trim() || 'there';
  const firstName = fullName.split(' ')[0];
  const initials = useMemo(() => {
    const parts = fullName.split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || 'U';
  }, [fullName]);

  const email = session?.user.email ?? '';

  const handlePinKey = (key: string) => {
    if (loading) return;
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) setTimeout(() => submitPin(next), 150);
  };

  const submitPin = async (entered: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('verify_pin', { p_pin: entered });
      if (rpcError) throw new Error(rpcError.message);
      if (data === true) {
        onUnlock();
        return;
      }
      throw new Error('wrong_pin');
    } catch {
      shake();
      setPin('');
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setError('Too many attempts. Use your password.');
        setMode('password');
        setAttempts(0);
      } else {
        setError(`Wrong PIN. ${5 - next} attempt${5 - next === 1 ? '' : 's'} left.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      Keyboard.dismiss();
      onUnlock();
    } catch {
      shake();
      setPassword('');
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + ms(24),
            paddingBottom: insets.bottom + ms(20),
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>

        {mode === 'pin' ? (
          <View style={styles.pinArea}>
            <Text style={styles.prompt}>Enter PIN</Text>
            <PinDots filled={pin.length} shakeAnim={shakeAnim} />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {loading && (
              <ActivityIndicator color={foodColors.primary} style={{ marginTop: 6 }} />
            )}
          </View>
        ) : (
          <View style={styles.passArea}>
            <Text style={styles.prompt}>Enter password</Text>
            <View style={styles.passWrap}>
              <TextInput
                style={styles.passInput}
                placeholder="••••••••"
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
              style={[styles.unlockBtn, loading && styles.unlockBtnOff]}
              onPress={submitPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.unlockBtnText}>Unlock</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'pin' ? (
        <NumPad onKey={handlePinKey} disabled={loading} />
        ) : null}

        <View style={styles.footer}>
          <View style={styles.altRow}>
            {hasPin && mode === 'pin' && (
              <TouchableOpacity
                style={styles.pill}
                onPress={() => {
                  setMode('password');
                  setPin('');
                  setError('');
                }}
                activeOpacity={0.7}
              >
                <Feather name="lock" size={ms(13)} color={foodColors.primary} />
                <Text style={styles.pillText}>Use password</Text>
              </TouchableOpacity>
            )}
            {hasPin && mode === 'password' && (
              <TouchableOpacity
                style={styles.pill}
                onPress={() => {
                  setMode('pin');
                  setPassword('');
                  setError('');
                }}
                activeOpacity={0.7}
              >
                <Feather name="grid" size={ms(13)} color={foodColors.primary} />
                <Text style={styles.pillText}>Use PIN</Text>
              </TouchableOpacity>
            )}
            {hasPin && mode === 'pin' && (
              <TouchableOpacity style={styles.pill} onPress={onForgotPin} activeOpacity={0.7}>
                <Feather name="help-circle" size={ms(13)} color={foodColors.primary} />
                <Text style={styles.pillText}>Forgot PIN?</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.switchRow}
            onPress={onSwitchAccount}
            activeOpacity={0.6}
          >
            <Feather name="repeat" size={ms(12)} color={foodColors.textMuted} />
            <Text style={styles.switchText}>Switch account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  inner: {
    flex: 1,
    paddingHorizontal: ms(28),
    justifyContent: 'space-between',
  },

  header: { alignItems: 'center' },
  avatarWrap: { marginBottom: ms(14) },
  avatarImg: {
    width: ms(78),
    height: ms(78),
    borderRadius: ms(39),
    borderWidth: 1.5,
    borderColor: foodColors.border,
  },
  avatarFallback: {
    width: ms(78),
    height: ms(78),
    borderRadius: ms(39),
    backgroundColor: foodColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: foodColors.border,
  },
  avatarText: {
    fontSize: ms(26),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: ms(24),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: ms(2),
  },

  pinArea: { alignItems: 'center', gap: ms(16), width: '100%' },
  prompt: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textSecondary,
    letterSpacing: 0.4,
  },
  dotsRow: { flexDirection: 'row', gap: ms(20) },
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

  passArea: { width: '100%', gap: ms(12), alignItems: 'center' },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(16),
    borderWidth: 1,
    borderColor: foodColors.border,
    width: '100%',
  },
  passInput: {
    flex: 1,
    fontSize: ms(15),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    paddingVertical: ms(15),
    letterSpacing: 1,
  },
  unlockBtn: {
    backgroundColor: foodColors.primary,
    borderRadius: ms(14),
    paddingVertical: ms(15),
    width: '100%',
    alignItems: 'center',
    marginTop: ms(4),
  },
  unlockBtnOff: { opacity: 0.5 },
  unlockBtnText: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },

  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: ms(4),
    maxWidth: ms(320),
    alignSelf: 'center',
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
  // numKeyExtra: {
  //   fontSize: ms(12.5),
  //   fontFamily: fonts.poppins.semiBold,
  //   color: foodColors.primary,
  //   letterSpacing: 0.3,
  // },

  footer: { alignItems: 'center', gap: ms(10), width: '100%' },
  altRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: ms(8),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: foodColors.surface,
    paddingHorizontal: ms(14),
    paddingVertical: ms(9),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  pillText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
    letterSpacing: 0.2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    marginTop: ms(4),
  },
  switchText: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    letterSpacing: 0.2,
  },
});