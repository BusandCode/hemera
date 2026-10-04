import { useState } from 'react';
import { Redirect } from 'expo-router';
import {
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
import { ms } from '../src/utils/responsive';

type Mode = 'signin' | 'signup';
type Gender = 'Male' | 'Female' | '';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, session } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [phone, setPhone] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const isSignUp = mode === 'signup';

  const canSubmit =
    email.trim().length > 3 &&
    password.trim().length >= 4 &&
    (!isSignUp ||
      (name.trim().length > 1 &&
        gender.length > 0 &&
        phone.trim().length > 6 &&
        agreed));

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError('');
    try {
      if (isSignUp) {
        const signedIn = await signUp({
          fullName: name.trim(),
          gender,
          phone: phone.trim(),
          referredBy: referredBy.trim(),
          email: email.trim(),
          password,
        });
        if (!signedIn) {
          // Supabase "Confirm email" is on: no session until they verify.
          setMode('signin');
          setError('Account created. Check your email to confirm it, then sign in.');
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
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
  };

  const handleTermsAgree = () => {
    setTermsRead(true);
    setAgreed(true);
    setTermsOpen(false);
  };

  // Already signed in → never show the auth screen.
  if (session) return <Redirect href={'/(tabs)' as any} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <View style={styles.logoDot} />
          <Text style={styles.brand}>HEMERA</Text>
        </View>

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
            <Text
              style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}
            >
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]}
            onPress={() => switchMode('signup')}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}
            >
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
                onChangeText={setPhone}
                placeholder="+234 803 123 4567"
                placeholderTextColor={foodColors.textMuted}
                keyboardType="phone-pad"
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

          {/* Forgot password — right under password, aligned right */}
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
          style={[styles.submit, (!canSubmit || busy) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || busy}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>
            {busy ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
          {!busy && (
            <Feather
              name={isSignUp ? 'user-plus' : 'arrow-right'}
              size={ms(16)}
              color="#fff"
            />
          )}
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
});