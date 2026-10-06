import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

type Props = {
  currentLabel: string;
  newLabel: string;
  confirmLabel: string;
  minLength: number;
  keyboardType?: 'default' | 'number-pad';
  hint: string;
  submitLabel: string;
  /** Return nothing / resolve = success. Throw = error shown inline. */
  onSubmit: (current: string, next: string) => Promise<void>;
};

export function ChangeSecretForm({
  currentLabel,
  newLabel,
  confirmLabel,
  minLength,
  keyboardType = 'default',
  hint,
  submitLabel,
  onSubmit,
}: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const matches = next.length > 0 && next === confirm;
  const longEnough = next.length >= minLength;
  const canSubmit = current.length > 0 && matches && longEnough && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    setDone(false);
    try {
      await onSubmit(current, next);
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>{currentLabel}</Text>
      <TextInput
        style={styles.input}
        value={current}
        onChangeText={(t) => {
          setCurrent(t);
          setError('');
          setDone(false);
        }}
        secureTextEntry
        keyboardType={keyboardType}
        placeholderTextColor={foodColors.textMuted}
        editable={!busy}
      />

      <Text style={styles.fieldLabel}>{newLabel}</Text>
      <TextInput
        style={styles.input}
        value={next}
        onChangeText={(t) => {
          setNext(t);
          setError('');
          setDone(false);
        }}
        secureTextEntry
        keyboardType={keyboardType}
        placeholderTextColor={foodColors.textMuted}
        editable={!busy}
      />

      <Text style={styles.fieldLabel}>{confirmLabel}</Text>
      <TextInput
        style={styles.input}
        value={confirm}
        onChangeText={(t) => {
          setConfirm(t);
          setError('');
          setDone(false);
        }}
        secureTextEntry
        keyboardType={keyboardType}
        placeholderTextColor={foodColors.textMuted}
        editable={!busy}
      />

      {next.length > 0 && !longEnough && (
        <Text style={styles.warningText}>Must be at least {minLength} characters.</Text>
      )}
      {confirm.length > 0 && !matches && (
        <Text style={styles.warningText}>Values do not match.</Text>
      )}

      <Text style={styles.hint}>{hint}</Text>

      {!!error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={ms(13)} color="#FF3B30" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {done && (
        <View style={styles.doneBanner}>
          <Feather name="check-circle" size={ms(14)} color={foodColors.success} />
          <Text style={styles.doneBannerText}>Updated successfully</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary, marginBottom: ms(8), marginTop: ms(16) },
  input: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  warningText: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: '#FF3B30', marginTop: ms(6) },
  hint: { fontSize: ms(12), fontFamily: fonts.poppins.regular, lineHeight: ms(17), color: foodColors.textMuted, marginTop: ms(18) },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginTop: ms(14),
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: ms(10),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
  },
  errorBannerText: { flex: 1, fontSize: ms(12), fontFamily: fonts.poppins.medium, color: '#FF3B30' },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginTop: ms(14),
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: ms(10),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
  },
  doneBannerText: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.success },
  submitButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
    marginTop: ms(24),
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});