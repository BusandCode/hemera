// src/components/profile/ChangeSecretForm.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

type Props = {
  currentLabel: string;
  newLabel: string;
  confirmLabel: string;
  minLength: number;
  keyboardType?: 'default' | 'number-pad';
  hint: string;
  submitLabel: string;
  onSubmit: () => void;
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
  const [done, setDone] = useState(false);

  const matches = next.length > 0 && next === confirm;
  const longEnough = next.length >= minLength;
  const canSubmit = current.length > 0 && matches && longEnough;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setDone(true);
    setCurrent('');
    setNext('');
    setConfirm('');
    onSubmit();
  };

  return (
    <View>
      <Text style={styles.fieldLabel}>{currentLabel}</Text>
      <TextInput
        style={styles.input}
        value={current}
        onChangeText={(t) => {
          setCurrent(t);
          setDone(false);
        }}
        secureTextEntry
        keyboardType={keyboardType}
        placeholderTextColor={foodColors.textMuted}
      />

      <Text style={styles.fieldLabel}>{newLabel}</Text>
      <TextInput
        style={styles.input}
        value={next}
        onChangeText={(t) => {
          setNext(t);
          setDone(false);
        }}
        secureTextEntry
        keyboardType={keyboardType}
        placeholderTextColor={foodColors.textMuted}
      />

      <Text style={styles.fieldLabel}>{confirmLabel}</Text>
      <TextInput
        style={styles.input}
        value={confirm}
        onChangeText={(t) => {
          setConfirm(t);
          setDone(false);
        }}
        secureTextEntry
        keyboardType={keyboardType}
        placeholderTextColor={foodColors.textMuted}
      />

      {next.length > 0 && !longEnough && (
        <Text style={styles.warningText}>Must be at least {minLength} characters.</Text>
      )}
      {confirm.length > 0 && !matches && (
        <Text style={styles.warningText}>Values do not match.</Text>
      )}

      <Text style={styles.hint}>{hint}</Text>

      {done && (
        <View style={styles.doneBanner}>
          <Feather name="check-circle" size={14} color={foodColors.success} />
          <Text style={styles.doneBannerText}>Updated successfully</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.85}
      >
        <Text style={styles.submitButtonText}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 12, fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  warningText: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: '#FF3B30', marginTop: 6 },
  hint: { fontSize: 12, fontFamily: fonts.poppins.regular, lineHeight: 17, color: foodColors.textMuted, marginTop: 18 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  doneBannerText: { fontSize: 12, fontFamily: fonts.poppins.semiBold, color: foodColors.success },
  submitButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});