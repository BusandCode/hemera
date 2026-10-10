import { useEffect, useRef, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  Animated,
  Easing,
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { termsOfUse, privacyPolicy } from '../src/constants/legalContent';
import { useAuth } from '../src/context/AuthContext';
import { LegalModal } from '../src/components/auth/LegalModal';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

type Mode = 'signin' | 'signup';
type Step = 'form' | 'otp';
type Gender = 'Male' | 'Female' | '';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type AuthErr = { message?: string; code?: string; status?: number; name?: string };

function errCode(e: unknown): string {
  return ((e as AuthErr)?.code ?? '').toString().toLowerCase();
}

function errMsg(e: unknown): string {
  return ((e as AuthErr)?.message ?? '').toString();
}

function isInvalidCredentials(e: unknown): boolean {
  return (
    errCode(e) === 'invalid_credentials' ||
    errMsg(e).toLowerCase().includes('invalid login credentials')
  );
}

function isEmailNotConfirmed(e: unknown): boolean {
  return errCode(e) === 'email_not_confirmed' || errMsg(e).toLowerCase().includes('not confirmed');
}

/** Turns Supabase auth errors into clear, user-facing messages. */
function friendlyAuthError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const err = (e ?? {}) as AuthErr;
  const code = errCode(e);
  const raw = errMsg(e);
  const msg = raw.toLowerCase();

  if (
    err.name === 'AuthRetryableFetchError' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('network error')
  ) {
    return 'No internet connection. Check your network and try again.';
  }

  if (isInvalidCredentials(e)) return 'Email or password is incorrect.';

  if (isEmailNotConfirmed(e)) return 'Your email is not verified yet. Enter the code we sent you.';

  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    msg.includes('already registered') ||
    msg.includes('already exists')
  ) {
    return 'An account with this email already exists. Sign in instead.';
  }

  if (code === 'weak_password' || msg.includes('password should')) {
    return raw || 'Your password is too weak. Try a longer one.';
  }

  if (code === 'same_password' || msg.includes('should be different')) {
    return 'Your new password must be different from your old one.';
  }

  if (
    code === 'otp_expired' ||
    code === 'otp_invalid' ||
    msg.includes('token has expired') ||
    msg.includes('invalid token') ||
    msg.includes('otp')
  ) {
    return 'That code is invalid or has expired. Request a new one and try again.';
  }

  if (code === 'over_email_send_rate_limit' || msg.includes('email rate limit')) {
    return 'Too many emails sent. Please wait a few minutes before trying again.';
  }

  if (msg.includes('for security purposes')) {
    // e.g. "For security purposes, you can only request this after 42 seconds."
    return raw;
  }

  if (code === 'over_request_rate_limit' || err.status === 429 || msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (code === 'email_address_invalid' || msg.includes('invalid format') || msg.includes('invalid email')) {
    return 'Enter a valid email address.';
  }

  if (code === 'user_banned') return 'This account has been suspended. Contact support for help.';

  if (code === 'signup_disabled' || msg.includes('signups not allowed')) {
    return 'New sign-ups are currently closed.';
  }

  if (code === 'user_not_found' || msg.includes('user not found')) {
    return 'No account found with this email.';
  }

  if (typeof err.status === 'number' && err.status >= 500) {
    return 'Our server is having trouble right now. Please try again shortly.';
  }

  return raw || fallback;
}

/** Returns true/false, or null if the check itself failed. Needs the email_exists SQL function. */
async function emailExists(email: string): Promise<boolean | null> {
  try {
    const { data, error } = await supabase.rpc('email_exists', { p_email: email });
    if (error) {
      console.warn('[Auth] email_exists failed:', error);
      return null;
    }
    return data === true;
  } catch (e) {
    console.warn('[Auth] email_exists threw:', e);
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Confirms the backend finished creating the account (profile row exists).
 * Retries briefly in case the signup trigger is still finishing.
 */
async function confirmAccountReady(userId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (data) return true;
    if (error) console.warn('[Auth] profile check failed:', error);
    await sleep(700);
  }
  return false;
}

const SUCCESS_GREEN = '#22C55E';
const SUCCESS_GREEN_LIGHT = 'rgba(34,197,94,0.12)';

function AccountCreatedModal({
  visible,
  firstName,
  onContinue,
}: {
  visible: boolean;
  firstName: string;
  onContinue: () => void;
}) {
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    cardScale.setValue(0.9);
    checkScale.setValue(0);
    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, cardScale, checkScale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onContinue}
    >
      <View style={styles.successBackdrop}>
        <Animated.View style={[styles.successCard, { transform: [{ scale: cardScale }] }]}>
          <View style={styles.successBadgeOuter}>
            <Animated.View
              style={[styles.successBadgeInner, { transform: [{ scale: checkScale }] }]}
            >
              <Feather name="check" size={ms(34)} color="#fff" />
            </Animated.View>
          </View>

          <Text style={styles.successTitle}>Account Created Successfully!</Text>
          <Text style={styles.successBody}>
            {firstName ? `Welcome to Hemera, ${firstName}! ` : 'Welcome to Hemera! '}
            Your email has been verified and your account is ready to use. You can now order
            food and schedule laundry pickups.
          </Text>

          <TouchableOpacity style={styles.successBtn} onPress={onContinue} activeOpacity={0.85}>
            <Text style={styles.successBtnText}>Continue</Text>
            <Feather name="arrow-right" size={ms(16)} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, verifyOtp, resendOtp, session } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [phone, setPhone] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // Keeps the user on this screen while OTP verification finishes and the success modal shows.
  const [holdRedirect, setHoldRedirect] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const isSignUp = mode === 'signup';

  const firstName = (
    name ||
    ((session?.user?.user_metadata?.full_name as string | undefined) ?? '')
  )
    .trim()
    .split(/\s+/)[0];

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validate = (): string => {
    if (isSignUp) {
      const missing =
        !name.trim() || !gender || !phone.trim() || !email.trim() || !password.trim();
      if (missing) return 'Please complete all fields to continue.';
      if (name.trim().length < 2) return 'Please enter your full name.';
      if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
      if (phone.length !== 11) return 'Phone number must be 11 digits.';
      if (password.trim().length < 4) return 'Password must be at least 4 characters.';
      if (!agreed) return 'Please agree to the Terms of Use and Privacy Policy to continue.';
      return '';
    }
    if (!email.trim() || !password.trim()) return 'Please enter your email and password to continue.';
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    return '';
  };

  const openOtpStep = () => {
    setOtp('');
    setError('');
    setCooldown(RESEND_SECONDS);
    setStep('otp');
  };

  const handleSubmit = async () => {
    if (busy) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (isSignUp) {
        const exists = await emailExists(email.trim());
        if (exists === true) {
          setError('An account with this email already exists. Sign in instead.');
          return;
        }

        const signedIn = await signUp({
          fullName: name.trim(),
          gender,
          phone,
          referredBy: referredBy.trim(),
          email: email.trim(),
          password,
        });
        if (!signedIn) {
          openOtpStep();
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      console.warn('[Auth] submit failed:', e);

      if (!isSignUp && isEmailNotConfirmed(e)) {
        try {
          await resendOtp(email.trim());
          openOtpStep();
        } catch (re: any) {
          setError(friendlyAuthError(re, 'Could not send a code. Please try again.'));
        }
      } else if (!isSignUp && isInvalidCredentials(e)) {
        const exists = await emailExists(email.trim());
        if (exists === false) {
          setError('No account found with this email. Check the spelling or create an account.');
        } else if (exists === true) {
          setError('Incorrect password. Try again or tap "Forgot password?" to reset it.');
        } else {
          setError('Email or password is incorrect.');
        }
      } else {
        setError(friendlyAuthError(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (busy) return;

    // If a previous attempt already verified the code (session exists) but the
    // account check failed, skip straight to re-checking the account.
    const alreadyVerified = !!session && holdRedirect;

    if (!alreadyVerified && otp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code sent to your email.`);
      return;
    }

    setBusy(true);
    setError('');
    setHoldRedirect(true);

    let verified = alreadyVerified;
    try {
      if (!alreadyVerified) {
        await verifyOtp(email.trim(), otp);
        verified = true;
      }

      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) {
        throw new Error('We could not confirm your session. Please sign in to continue.');
      }

      const ready = await confirmAccountReady(userId);
      if (!ready) {
        throw new Error(
          "Your email is verified, but we couldn't finish setting up your account. Tap Verify & Continue to try again."
        );
      }

      setSuccessOpen(true);
    } catch (e: any) {
      console.warn('[Auth] verify failed:', e);
      setError(
        verified
          ? e?.message ?? 'Something went wrong. Please try again.'
          : friendlyAuthError(e, 'Invalid or expired code. Please try again.')
      );
      // Code itself failed: release the hold so normal behaviour resumes.
      if (!verified) setHoldRedirect(false);
    } finally {
      setBusy(false);
    }
  };

  const handleSuccessContinue = () => {
    setSuccessOpen(false);
    setHoldRedirect(false);
    router.replace('/(tabs)' as any);
  };

  const handleResend = async () => {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setError('');
    try {
      await resendOtp(email.trim());
      setCooldown(RESEND_SECONDS);
    } catch (e: any) {
      setError(friendlyAuthError(e, 'Could not resend the code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const backToForm = () => {
    setStep('form');
    setOtp('');
    setError('');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  const handleCheckboxPress = () => {
    if (!termsRead) {
      setTermsOpen(true);
      return;
    }
    setAgreed((a) => !a);
    setError('');
  };

  const handleTermsAgree = () => {
    setTermsRead(true);
    setAgreed(true);
    setTermsOpen(false);
    setError('');
  };

  if (session && !holdRedirect && !successOpen) return <Redirect href={'/(tabs)' as any} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.brandRow}>
          <View style={styles.logoDot} />
          <Text style={styles.brand}>HEMERA</Text>
        </View>

        {step === 'otp' ? (
          <>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We sent a {OTP_LENGTH}-digit code to {email.trim()}. Enter it below to finish
              creating your account.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Verification Code</Text>
              <View style={styles.inputWrap}>
                <Feather name="shield" size={ms(16)} color={foodColors.textMuted} />
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={(t) => {
                    setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH));
                    if (error) setError('');
                  }}
                  placeholder="------"
                  placeholderTextColor={foodColors.textMuted}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={ms(14)} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submit, busy && styles.submitDisabled]}
              onPress={handleVerify}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>{busy ? 'Please wait...' : 'Verify & Continue'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchLink}
              onPress={handleResend}
              disabled={cooldown > 0 || busy}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchText, cooldown > 0 && styles.resendDisabled]}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={backToForm} activeOpacity={0.7}>
              <Text style={styles.backText}>Change email or details</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Sign up to order food and schedule laundry pickups.'
                : 'Sign in to continue where you left off.'}
            </Text>

            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'signin' && styles.tabBtnActive]}
                onPress={() => switchMode('signin')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]}
                onPress={() => switchMode('signup')}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrap}>
                  <Feather name="user" size={ms(16)} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Suleiman Abubakar"
                    placeholderTextColor={foodColors.textMuted}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                  {(['Male', 'Female'] as Gender[]).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderPill, gender === g && styles.genderPillActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.genderPillText,
                          gender === g && styles.genderPillTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrap}>
                  <Feather name="phone" size={ms(16)} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 11))}
                    placeholder="08031234567"
                    placeholderTextColor={foodColors.textMuted}
                    keyboardType="number-pad"
                    maxLength={11}
                  />
                </View>
              </View>
            )}

            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.label}>Referral Code (optional)</Text>
                <View style={styles.inputWrap}>
                  <Feather name="gift" size={ms(16)} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={referredBy}
                    onChangeText={setReferredBy}
                    placeholder="e.g. ABCD1234"
                    placeholderTextColor={foodColors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={ms(16)} color={foodColors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={foodColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Feather name="lock" size={ms(16)} color={foodColors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 4 characters"
                  placeholderTextColor={foodColors.textMuted}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setSecure((s) => !s)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={secure ? 'eye-off' : 'eye'}
                    size={ms(16)}
                    color={foodColors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {!isSignUp && (
                <TouchableOpacity
                  style={styles.forgotRow}
                  onPress={() => router.push('/forgot-password' as any)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>

            {isSignUp && (
              <View style={styles.agreeBlock}>
                <View style={styles.agreeRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, agreed && styles.checkboxChecked]}
                    onPress={handleCheckboxPress}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {agreed && <Feather name="check" size={ms(13)} color="#fff" />}
                  </TouchableOpacity>
                  <Text style={styles.agreeText}>
                    I agree to Hemera's{' '}
                    <Text style={styles.agreeLink} onPress={() => setTermsOpen(true)}>
                      Terms of Use
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.agreeLink} onPress={() => setPrivacyOpen(true)}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
                {!termsRead && (
                  <Text style={styles.agreeHint}>
                    Read the Terms of Use to the end before agreeing.
                  </Text>
                )}
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={ms(14)} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submit, busy && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>
                {busy ? 'Please wait...' : isSignUp ? 'Send Code' : 'Sign In'}
              </Text>
              {/* {!busy && (
                <Feather
                  name={isSignUp ? 'send' : 'arrow-right'}
                  size={ms(16)}
                  color="#fff"
                />
              )} */}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchLink}
              onPress={() => switchMode(isSignUp ? 'signin' : 'signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Create one"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <LegalModal
        visible={termsOpen}
        doc={termsOfUse}
        requireRead
        alreadyRead={termsRead}
        onClose={() => setTermsOpen(false)}
        onAgree={handleTermsAgree}
      />

      <LegalModal
        visible={privacyOpen}
        doc={privacyPolicy}
        onClose={() => setPrivacyOpen(false)}
      />

      <AccountCreatedModal
        visible={successOpen}
        firstName={firstName}
        onContinue={handleSuccessContinue}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(24) },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(28),
  },
  logoDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: foodColors.primary,
  },
  brand: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 2,
    color: foodColors.primary,
  },

  title: {
    fontSize: ms(28),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    lineHeight: ms(34),
    marginBottom: ms(8),
  },
  subtitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: ms(19),
    marginBottom: ms(26),
  },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    padding: ms(4),
    marginBottom: ms(22),
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(11),
    borderRadius: ms(10),
  },
  tabBtnActive: { backgroundColor: foodColors.primaryDark },
  tabText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  tabTextActive: { color: '#fff' },

  field: { marginBottom: ms(16) },
  label: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: ms(6),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(13) : ms(6),
  },
  input: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },
  otpInput: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.semiBold,
    letterSpacing: 8,
  },

  forgotRow: {
    alignItems: 'flex-end',
    marginTop: ms(8),
  },
  forgotLink: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },

  genderRow: {
    flexDirection: 'row',
    gap: ms(10),
  },
  genderPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(13),
    borderRadius: ms(12),
    backgroundColor: foodColors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderPillActive: {
    backgroundColor: foodColors.primaryDark,
    borderColor: foodColors.primaryDark,
  },
  genderPillText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  genderPillTextActive: { color: '#fff' },

  agreeBlock: { marginBottom: ms(16) },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(10),
  },
  checkbox: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(6),
    borderWidth: 1.5,
    borderColor: foodColors.textMuted,
    backgroundColor: foodColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(1),
  },
  checkboxChecked: {
    backgroundColor: foodColors.primary,
    borderColor: foodColors.primary,
  },
  agreeText: {
    flex: 1,
    fontSize: ms(12.5),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  agreeLink: {
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
    textDecorationLine: 'underline',
  },
  agreeHint: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: ms(6),
    marginLeft: ms(30),
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: ms(10),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    marginBottom: ms(12),
  },
  errorText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: '#FF3B30',
    flexShrink: 1,
  },

  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: foodColors.primary,
    paddingVertical: ms(16),
    borderRadius: ms(26),
    marginTop: ms(4),
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  switchLink: {
    alignItems: 'center',
    paddingVertical: ms(16),
    marginTop: ms(4),
  },
  switchText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  resendDisabled: { color: foodColors.textMuted },

  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,16,32,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(28),
  },
  successCard: {
    width: '100%',
    maxWidth: ms(360),
    backgroundColor: foodColors.background,
    borderRadius: ms(24),
    paddingHorizontal: ms(22),
    paddingTop: ms(30),
    paddingBottom: ms(22),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  successBadgeOuter: {
    width: ms(96),
    height: ms(96),
    borderRadius: ms(48),
    backgroundColor: SUCCESS_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(18),
  },
  successBadgeInner: {
    width: ms(66),
    height: ms(66),
    borderRadius: ms(33),
    backgroundColor: SUCCESS_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: ms(19),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    marginBottom: ms(8),
  },
  successBody: {
    fontSize: ms(13),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: ms(24),
  },
  successBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
  },
  successBtnText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  backLink: { alignItems: 'center', paddingVertical: ms(6) },
  backText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textSecondary,
  },
});