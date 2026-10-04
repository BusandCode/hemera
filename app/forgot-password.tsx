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
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().length > 3 && !busy;

  const handleSend = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');

    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'hemera://reset-password' }
    );

    setBusy(false);

    if (err) {
      setError(err.message ?? 'Could not send reset email. Try again.');
      return;
    }

    // Always show success even if the email doesn't exist, so we don't
    // leak which accounts are registered.
    setSent(true);
  };

  if (sent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <StatusBar style="dark" />

        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Feather name="mail" size={ms(34)} color={foodColors.primary} />
          </View>

          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successBody}>
            If an account exists for{' '}
            <Text style={styles.successEmail}>{email.trim()}</Text>, we've sent a
            link to reset your password. The link expires in 1 hour.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.replace('/auth' as any)}
          >
            <Feather name="arrow-left" size={ms(16)} color="#fff" />
            <Text style={styles.primaryBtnText}>Back to Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            activeOpacity={0.7}
            onPress={() => {
              setSent(false);
              setEmail('');
            }}
          >
            <Text style={styles.linkText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={ms(20)} color={foodColors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <View style={styles.logoDot} />
          <Text style={styles.brand}>HEMERA</Text>
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter the email you signed up with and we'll send you a link to reset
          your password.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Feather name="mail" size={ms(16)} color={foodColors.textMuted} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError('');
              }}
              placeholder="you@example.com"
              placeholderTextColor={foodColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              editable={!busy}
              returnKeyType="send"
              onSubmitEditing={handleSend}
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
          style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
          onPress={handleSend}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              <Feather name="arrow-right" size={ms(16)} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>Remembered it? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(24) },

  backBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(24),
  },

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
    lineHeight: ms(20),
    marginBottom: ms(26),
  },

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

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: foodColors.primary,
    paddingVertical: ms(16),
    borderRadius: ms(26),
    marginTop: ms(4),
    minHeight: ms(52),
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  linkBtn: {
    alignItems: 'center',
    paddingVertical: ms(16),
    marginTop: ms(4),
  },
  linkText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },

  successWrap: {
    flex: 1,
    paddingHorizontal: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(20),
  },
  successTitle: {
    fontSize: ms(22),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(10),
    textAlign: 'center',
  },
  successBody: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: ms(20),
    textAlign: 'center',
    marginBottom: ms(30),
    maxWidth: 320,
  },
  successEmail: {
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
});