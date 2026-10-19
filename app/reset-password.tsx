import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

const MIN_PASSWORD_LENGTH = 8;
/** New passwords must begin with an uppercase letter (A–Z), same rule as sign-up. */
const STARTS_WITH_CAPITAL_RE = /^[A-Z]/;
const SUCCESS_GREEN = '#22C55E';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startsCapital = STARTS_WITH_CAPITAL_RE.test(password);
  const longEnough = password.length >= MIN_PASSWORD_LENGTH;
  const matches = confirm.length > 0 && password === confirm;

  const canSubmit = startsCapital && longEnough && matches && !busy;

  const handleUpdate = async () => {
    if (busy) return;

    // Belt and braces: the button is disabled until these pass, but say why if it's ever reached.
    if (!startsCapital) {
      setError('Password must start with a capital letter (A–Z).');
      return;
    }
    if (!longEnough) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (!matches) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');

    const { error: err } = await supabase.auth.updateUser({ password });

    setBusy(false);

    if (err) {
      const msg = (err.message ?? '').toLowerCase();
      if ((err as any).code === 'same_password' || msg.includes('should be different')) {
        setError('Your new password must be different from your old one.');
      } else {
        setError(err.message || 'Could not update password. Try again.');
      }
      return;
    }

    Alert.alert(
      'Password updated',
      'You can now sign in with your new password.',
      [{ text: 'OK', onPress: () => router.replace('/auth' as any) }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <StatusBar style="dark" />

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password you haven't used before. It must start with a capital letter
          and be at least {MIN_PASSWORD_LENGTH} characters.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={ms(16)} color={foodColors.textMuted} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError('');
              }}
              placeholder="Start with a capital letter"
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

          <View style={styles.pwRules}>
            <PasswordRule ok={startsCapital} label="Starts with a capital letter (A–Z)" />
            <PasswordRule ok={longEnough} label={`At least ${MIN_PASSWORD_LENGTH} characters`} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={ms(16)} color={foodColors.textMuted} />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={(t) => {
                setConfirm(t);
                if (error) setError('');
              }}
              placeholder="Re-enter password"
              placeholderTextColor={foodColors.textMuted}
              secureTextEntry={secure}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleUpdate}
            />
          </View>

          {confirm.length > 0 && (
            <View style={styles.pwRules}>
              <PasswordRule ok={matches} label={matches ? 'Passwords match' : 'Passwords do not match'} />
            </View>
          )}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={ms(14)} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
          onPress={handleUpdate}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Update Password</Text>
              <Feather name="check" size={ms(16)} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/** One line of the password checklist: grey until met, then green with a tick. */
function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.pwRule}>
      <Feather
        name={ok ? 'check-circle' : 'circle'}
        size={ms(12)}
        color={ok ? SUCCESS_GREEN : foodColors.textMuted}
      />
      <Text style={[styles.pwRuleText, ok && styles.pwRuleTextOk]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  content: { flex: 1, paddingHorizontal: ms(24) },

  title: {
    fontSize: ms(28),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
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

  pwRules: { marginTop: ms(8), gap: ms(4) },
  pwRule: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  pwRuleText: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },
  pwRuleTextOk: { color: SUCCESS_GREEN, fontFamily: fonts.poppins.medium },

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
});