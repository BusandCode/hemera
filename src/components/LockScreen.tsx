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
  Modal,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../constants/foodColors';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';
import { ms } from '../utils/responsive';

type Mode = 'pin' | 'password';
type BiometricKind = 'face' | 'fingerprint' | null;
const PIN_LENGTH = 4;

const KEY_SIZE = ms(76);
const KEY_GAP_X = ms(28);
const KEY_GAP_Y = ms(16);
const KEY_LETTERS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

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

/** Face ID glyph — the same icon used in the lock screen design. */
function FaceIdIcon({ size, color, strokeWidth = 1.7 }: { size: number; color: string; strokeWidth?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <Path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <Path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <Path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <Path d="M9 9.5v1" />
      <Path d="M15 9.5v1" />
      <Path d="M12 9.5v3.5h-1" />
      <Path d="M9.5 15.5c1.4 1 3.6 1 5 0" />
    </Svg>
  );
}

type BioStatus = 'scanning' | 'failed' | 'idle';

/** Bottom sheet shown while biometric unlock runs. */
function BiometricSheet({
  visible,
  kind,
  status,
  bottomInset,
  onRetry,
  onUsePin,
}: {
  visible: boolean;
  kind: Exclude<BiometricKind, null>;
  status: BioStatus;
  bottomInset: number;
  onRetry: () => void;
  onUsePin: () => void;
}) {
  const { height: screenHeight } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = shown
  const scan = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  // Slide the sheet up from the bottom edge (and back down on close),
  // fading the blurred/darkened backdrop in step with it.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible]);

  const sheetTranslateY = progress.interpolate({ inputRange: [0, 1], outputRange: [screenHeight, 0] });

  useEffect(() => {
    if (!visible || status !== 'scanning') {
      scan.stopAnimation();
      scan.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    scan.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [visible, status]);

  const isFace = kind === 'face';
  const title = isFace ? 'Unlock with Face ID' : 'Unlock with fingerprint';
  const subtitle =
    status === 'failed'
      ? "We couldn't verify you. Try again or use your PIN."
      : isFace
        ? 'Look at your phone to confirm it’s you.'
        : 'Touch the sensor to confirm it’s you.';

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onUsePin}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]} pointerEvents="none">
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={25}
          tint="dark"
          blurMethod="dimezisBlurView"
        />
        <View style={styles.sheetBackdrop} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: bottomInset + ms(24), transform: [{ translateY: sheetTranslateY }] },
        ]}
        accessibilityViewIsModal
        accessibilityLabel={title}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.scanTile}>
          {isFace ? (
            <FaceIdIcon size={ms(60)} color={foodColors.primary} strokeWidth={1.3} />
          ) : (
            <MaterialCommunityIcons name="fingerprint" size={ms(60)} color={foodColors.primary} />
          )}
          {status !== 'failed' && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  opacity: scan.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 1, 0.25] }),
                  transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [-ms(22), ms(22)] }) }],
                },
              ]}
            />
          )}
        </View>

        <Text style={styles.sheetTitle} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[styles.sheetSubtitle, status === 'failed' && styles.sheetSubtitleError]}>{subtitle}</Text>

        <TouchableOpacity
          style={styles.sheetPrimaryBtn}
          onPress={onRetry}
          activeOpacity={0.85}
          disabled={status === 'scanning'}
          accessibilityRole="button"
        >
          {status === 'scanning' ? (
            <ActivityIndicator color={foodColors.background} />
          ) : (
            <Text style={styles.sheetPrimaryText}>Try again</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sheetSecondaryBtn}
          onPress={onUsePin}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.sheetSecondaryText}>Use PIN instead</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

function PinDots({
  filled,
  shakeAnim,
  hasError,
}: {
  filled: number;
  shakeAnim: Animated.Value;
  hasError: boolean;
}) {
  return (
    <Animated.View
      style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
      accessibilityRole="text"
      accessibilityLabel={`${filled} of ${PIN_LENGTH} digits entered`}
    >
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            hasError && styles.dotError,
            filled === i && !hasError && styles.dotActive,
            filled > i && styles.dotFilled,
          ]}
        />
      ))}
    </Animated.View>
  );
}

function NumPad({
  onKey,
  disabled,
  biometric,
  onBiometric,
}: {
  onKey: (key: string) => void;
  disabled?: boolean;
  biometric: BiometricKind;
  onBiometric: () => void;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  // Shorter (common on Android) screens get slightly smaller keys so the footer stays visible.
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const size = compact ? ms(62) : KEY_SIZE;
  const keyBox = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.numPad, { width: size * 3 + KEY_GAP_X * 2, rowGap: compact ? ms(10) : KEY_GAP_Y }]}>
      {keys.map((k) => (
        <TouchableOpacity
          key={k}
          style={[styles.numKey, keyBox]}
          onPress={() => onKey(k)}
          disabled={disabled}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={k}
        >
          <Text style={styles.numKeyText}>{k}</Text>
          {!!KEY_LETTERS[k] && <Text style={styles.numKeySub}>{KEY_LETTERS[k]}</Text>}
        </TouchableOpacity>
      ))}

      {/* Biometric key — or an empty spacer to keep 0 centred */}
      {biometric ? (
        <TouchableOpacity
          style={[styles.numKey, keyBox, styles.numKeyGhost]}
          onPress={onBiometric}
          disabled={disabled}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={biometric === 'face' ? 'Unlock with Face ID' : 'Unlock with fingerprint'}
        >
          {biometric === 'face' ? (
            <FaceIdIcon size={ms(30)} color={foodColors.primary} />
          ) : (
            <MaterialCommunityIcons name="fingerprint" size={ms(30)} color={foodColors.primary} />
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.numKey, keyBox, styles.numKeyGhost]} />
      )}

      <TouchableOpacity
        style={[styles.numKey, keyBox]}
        onPress={() => onKey('0')}
        disabled={disabled}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel="0"
      >
        <Text style={styles.numKeyText}>0</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.numKey, keyBox, styles.numKeyGhost]}
        onPress={() => onKey('⌫')}
        disabled={disabled}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel="Delete last digit"
      >
        <Feather name="delete" size={ms(26)} color={foodColors.textSecondary} />
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
  const [biometric, setBiometric] = useState<BiometricKind>(null);

  const { anim: shakeAnim, trigger: shake } = useShake();

  // Show the Face ID / fingerprint key only if the device supports it and it's enrolled.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [hasHardware, enrolled, types] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
          LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);
        if (cancelled || !hasHardware || !enrolled) return;
        const AT = LocalAuthentication.AuthenticationType;
        if (types.includes(AT.FACIAL_RECOGNITION)) setBiometric('face');
        else if (types.includes(AT.FINGERPRINT)) setBiometric('fingerprint');
      } catch {
        // No biometrics available — the key simply stays hidden.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [bioStatus, setBioStatus] = useState<BioStatus>('idle');

  const runBiometric = async () => {
    setBioStatus('scanning');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometric === 'face' ? 'Unlock with Face ID' : 'Unlock with fingerprint',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        setSheetOpen(false);
        setBioStatus('idle');
        onUnlock();
        return;
      }
      // User/system cancel isn't a failure — just let them choose again.
      const cancelled = result.error === 'user_cancel' || result.error === 'system_cancel' || result.error === 'app_cancel';
      setBioStatus(cancelled ? 'idle' : 'failed');
    } catch {
      setBioStatus('failed');
    }
  };

  // Tapping the key opens the sheet, then starts the scan once it's on screen.
  const handleBiometric = () => {
    if (loading || !biometric) return;
    setError('');
    setSheetOpen(true);
    setTimeout(runBiometric, 350);
  };

  const closeSheet = () => {
    // Android-only: dismiss the system prompt if it's still up.
    if (Platform.OS === 'android') {
      LocalAuthentication.cancelAuthenticate().catch(() => {});
    }
    setSheetOpen(false);
    setBioStatus('idle');
  };
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

  const switchToPassword = () => {
    setMode('password');
    setPin('');
    setError('');
  };

  const switchToPin = () => {
    setMode('pin');
    setPassword('');
    setError('');
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
            paddingTop: insets.top + ms(40),
            paddingBottom: insets.bottom + ms(16),
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.top}>
          {/* Avatar with accent ring + lock badge */}
          <View style={styles.avatarRing}>
            {profile.photoUri ? (
              <Image
                source={{ uri: profile.photoUri }}
                style={styles.avatarImg}
                accessibilityLabel={`${fullName}'s profile picture`}
              />
            ) : (
              <View style={styles.avatarFallback} accessibilityLabel={`${fullName}'s profile picture`}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.lockBadge}>
              <Feather name="lock" size={ms(13)} color={foodColors.primary} />
            </View>
          </View>

          <Text style={styles.title} accessibilityRole="header">
            Welcome back, {firstName}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'pin'
              ? `Enter your ${PIN_LENGTH}-digit PIN to unlock`
              : 'Enter your password to unlock'}
          </Text>

          {mode === 'pin' ? (
            <View style={styles.pinArea}>
              <PinDots filled={pin.length} shakeAnim={shakeAnim} hasError={!!error} />
              <View style={styles.messageSlot}>
                {loading ? (
                  <ActivityIndicator color={foodColors.primary} />
                ) : !!error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
              </View>
              <NumPad
                onKey={handlePinKey}
                disabled={loading}
                biometric={biometric}
                onBiometric={handleBiometric}
              />
            </View>
          ) : (
            <Animated.View style={[styles.passArea, { transform: [{ translateX: shakeAnim }] }]}>
              <View style={[styles.passWrap, !!error && styles.passWrapError]}>
                <Feather name="lock" size={ms(16)} color={foodColors.textMuted} />
                <TextInput
                  style={styles.passInput}
                  placeholder="Password"
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
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPass ? 'Hide password' : 'Show password'}
                >
                  <Feather
                    name={showPass ? 'eye-off' : 'eye'}
                    size={ms(18)}
                    color={foodColors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.messageSlot}>
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.unlockBtn, loading && styles.unlockBtnOff]}
                onPress={submitPassword}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Unlock"
              >
                {loading ? (
                  <ActivityIndicator color={foodColors.background} />
                ) : (
                  <Text style={styles.unlockBtnText}>Unlock</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View style={styles.footer}>
          {hasPin && mode === 'pin' && (
            <TouchableOpacity
              style={styles.centerLink}
              onPress={switchToPassword}
              activeOpacity={0.6}
              accessibilityRole="button"
            >
              <Text style={styles.centerLinkText}>Use password instead</Text>
            </TouchableOpacity>
          )}

          <View style={styles.footerRow}>
            {hasPin && mode === 'pin' ? (
              <TouchableOpacity
                onPress={onForgotPin}
                activeOpacity={0.6}
                style={styles.footerLink}
                accessibilityRole="button"
              >
                <Text style={styles.linkAccent}>Forgot PIN?</Text>
              </TouchableOpacity>
            ) : hasPin && mode === 'password' ? (
              <TouchableOpacity
                onPress={switchToPin}
                activeOpacity={0.6}
                style={styles.footerLink}
                accessibilityRole="button"
              >
                <Text style={styles.linkAccent}>Use PIN</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            <TouchableOpacity
              onPress={onSwitchAccount}
              activeOpacity={0.6}
              style={styles.footerLink}
              accessibilityRole="button"
            >
              <Text style={styles.linkMuted}>Switch account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {biometric && (
        <BiometricSheet
          visible={sheetOpen}
          kind={biometric}
          status={bioStatus}
          bottomInset={insets.bottom}
          onRetry={runBiometric}
          onUsePin={closeSheet}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  inner: {
    flex: 1,
    paddingHorizontal: ms(32),
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', width: '100%' },

  // Avatar
  avatarRing: {
    width: ms(92),
    height: ms(92),
    borderRadius: ms(46),
    borderWidth: 2,
    borderColor: foodColors.primary,
    padding: ms(3),
    marginBottom: ms(20),
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: ms(43),
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: ms(43),
    backgroundColor: foodColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: ms(30),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    letterSpacing: 0.5,
  },
  lockBadge: {
    position: 'absolute',
    right: -ms(2),
    bottom: -ms(2),
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: foodColors.surface,
    borderWidth: 3,
    borderColor: foodColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: ms(24),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: ms(6),
    textAlign: 'center',
  },

  // PIN
  pinArea: { alignItems: 'center', width: '100%', marginTop: ms(36) },
  dotsRow: { flexDirection: 'row', gap: ms(20) },
  dot: {
    width: ms(14),
    height: ms(14),
    borderRadius: ms(7),
    borderWidth: 2,
    borderColor: foodColors.border,
    backgroundColor: 'transparent',
  },
  dotActive: { borderColor: foodColors.primary },
  dotFilled: {
    backgroundColor: foodColors.primary,
    borderColor: foodColors.primary,
    transform: [{ scale: 1.1 }],
  },
  dotError: { borderColor: foodColors.error },
  messageSlot: {
    minHeight: ms(22),
    marginTop: ms(16),
    marginBottom: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.medium,
    color: foodColors.error,
    textAlign: 'center',
  },

  // Keypad
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: KEY_SIZE * 3 + KEY_GAP_X * 2,
    columnGap: KEY_GAP_X,
    rowGap: KEY_GAP_Y,
    alignSelf: 'center',
  },
  numKey: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numKeyGhost: { backgroundColor: 'transparent' },
  numKeyText: {
    fontSize: ms(28),
    lineHeight: ms(34),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },
  numKeySub: {
    fontSize: ms(9),
    lineHeight: ms(11),
    height: ms(11),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
    letterSpacing: 1.3,
  },

  // Password
  passArea: { width: '100%', alignItems: 'center', marginTop: ms(36) },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(27),
    paddingHorizontal: ms(20),
    borderWidth: 1,
    borderColor: foodColors.border,
    width: '100%',
    height: ms(54),
  },
  passWrapError: { borderColor: foodColors.error },
  passInput: {
    flex: 1,
    fontSize: ms(15),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    paddingVertical: 0,
  },
  unlockBtn: {
    backgroundColor: foodColors.primary,
    borderRadius: ms(27),
    height: ms(54),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnOff: { opacity: 0.5 },
  unlockBtnText: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.bold,
    color: foodColors.background,
    letterSpacing: 0.2,
  },

  // Biometric sheet
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: foodColors.textPrimary,
    opacity: 0.5,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: ms(32),
    borderTopRightRadius: ms(32),
    backgroundColor: foodColors.surface,
    borderTopWidth: 1,
    borderColor: foodColors.border,
    paddingTop: ms(14),
    paddingHorizontal: ms(24),
    alignItems: 'center',
  },
  sheetHandle: {
    width: ms(40),
    height: 5,
    borderRadius: 3,
    backgroundColor: foodColors.border,
  },
  scanTile: {
    marginTop: ms(28),
    width: ms(112),
    height: ms(112),
    borderRadius: ms(32),
    backgroundColor: foodColors.background,
    borderWidth: 1,
    borderColor: foodColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: ms(18),
    right: ms(18),
    top: ms(55),
    height: 2,
    borderRadius: 1,
    backgroundColor: foodColors.primary,
  },
  sheetTitle: {
    marginTop: ms(24),
    fontSize: ms(22),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  sheetSubtitle: {
    marginTop: ms(8),
    fontSize: ms(15),
    lineHeight: ms(22),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    textAlign: 'center',
    maxWidth: ms(280),
  },
  sheetSubtitleError: { color: foodColors.error },
  sheetPrimaryBtn: {
    marginTop: ms(28),
    width: '100%',
    height: ms(54),
    borderRadius: ms(27),
    backgroundColor: foodColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryText: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.bold,
    color: foodColors.background,
  },
  sheetSecondaryBtn: {
    marginTop: ms(10),
    width: '100%',
    height: ms(54),
    borderRadius: ms(27),
    borderWidth: 1,
    borderColor: foodColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryText: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },

  // Footer
  footer: { width: '100%', alignItems: 'center', gap: ms(4) },
  centerLink: { paddingVertical: ms(10), paddingHorizontal: ms(12) },
  centerLinkText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLink: { paddingVertical: ms(12), paddingHorizontal: ms(4) },
  linkAccent: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  linkMuted: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
});