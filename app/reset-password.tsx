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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    password.length >= 8 && password === confirm && !busy;

  const handleUpdate = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');

    const { error: err } = await supabase.auth.updateUser({ password });

    setBusy(false);

    if (err) {
      setError(err.message ?? 'Could not update password. Try again.');
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password you haven't used before. At least 8 characters.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={ms(16)} color={foodColors.textMuted} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={foodColors.textMuted}
              secureTextEntry={secure}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setSecure((s) => !s)}>
              <Feather
                name={secure ? 'eye-off' : 'eye'}
                size={ms(16)}
                color={foodColors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={ms(16)} color={foodColors.textMuted} />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              placeholderTextColor={foodColors.textMuted}
              secureTextEntry={secure}
              autoCapitalize="none"
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