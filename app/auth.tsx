// app/auth.tsx
import { useState } from 'react';
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
import { useAuth } from '../src/context/AuthContext';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isSignUp = mode === 'signup';

  const canSubmit =
    email.trim().length > 3 &&
    password.trim().length >= 4 &&
    (!isSignUp || name.trim().length > 1);

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError('');
    try {
      if (isSignUp) {
        await signUp(name.trim(), email.trim(), password);
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
          <Text style={styles.brand}>E-CHOP · E-WASH</Text>
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
              <Feather name="user" size={16} color={foodColors.textMuted} />
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

        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Feather name="mail" size={16} color={foodColors.textMuted} />
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
            <Feather name="lock" size={16} color={foodColors.textMuted} />
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
                size={16}
                color={foodColors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color="#FF3B30" />
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
            {busy
              ? 'Please wait...'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </Text>
          {!busy && (
            <Feather
              name={isSignUp ? 'user-plus' : 'arrow-right'}
              size={16}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24 },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: foodColors.primary,
  },
  brand: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 2,
    color: foodColors.primary,
  },

  title: {
    fontSize: 28,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 19,
    marginBottom: 26,
  },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: foodColors.primaryDark },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  tabTextActive: { color: '#fff' },

  field: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.poppins.medium,
    color: '#FF3B30',
    flexShrink: 1,
  },

  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 16,
    borderRadius: 26,
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  switchLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  switchText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
});