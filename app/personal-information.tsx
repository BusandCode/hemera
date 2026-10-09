import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { Avatar } from '../src/components/profile/Avatar';
import { useProfile } from '../src/context/ProfileContext';
import { useAuth } from '../src/context/AuthContext';
import { ms } from '../src/utils/responsive';

type Field = {
  key: 'fullName' | 'email' | 'phone' | 'gender';
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const fields: Field[] = [
  { key: 'fullName', label: 'Full Name', icon: 'user' },
  { key: 'email', label: 'Email Address', icon: 'mail' },
  { key: 'phone', label: 'Phone Number', icon: 'phone' },
  { key: 'gender', label: 'Gender', icon: 'users' },
];

const DANGER = '#E53935';

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { deleteAccount } = useAuth();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = password.length > 0 && reason.trim().length > 0 && !submitting;

  const closeDelete = () => {
    if (submitting) return;
    setDeleteOpen(false);
    setPassword('');
    setReason('');
    setError('');
    setShowPassword(false);
  };

  const handleDelete = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await deleteAccount(password, reason);
      setDeleteOpen(false);
      router.replace('/' as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Personal Information" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Avatar uri={profile.photoUri} name={profile.fullName} size={ms(92)} />
          <Text style={styles.avatarHint}>Your profile photo</Text>
        </View>

        <View style={styles.form}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <View style={styles.fieldValueWrap}>
                <Feather name={field.icon} size={ms(16)} color={foodColors.textMuted} />
                <Text style={styles.fieldValue}>{profile[field.key]}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.editCta}
          activeOpacity={0.85}
          onPress={() => router.push('/edit-profile' as any)}
        >
          <Feather name="edit-2" size={ms(15)} color={foodColors.primary} />
          <Text style={styles.editCtaText}>Edit in profile settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteCta}
          activeOpacity={0.85}
          onPress={() => setDeleteOpen(true)}
        >
          <Feather name="trash-2" size={ms(15)} color={DANGER} />
          <Text style={styles.deleteCtaText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={deleteOpen} transparent animationType="slide" onRequestClose={closeDelete}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDelete} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.warnIconWrap}>
              <Feather name="alert-triangle" size={ms(22)} color={DANGER} />
            </View>
            <Text style={styles.sheetTitle}>Delete your account?</Text>
            <Text style={styles.sheetNote}>
              Your account and all data linked to it, including your profile, orders and
              subscriptions, will be permanently deleted. This can't be undone.
            </Text>

            <Text style={styles.inputLabel}>Reason for leaving</Text>
            <TextInput
              style={[styles.input, styles.reasonInput]}
              value={reason}
              onChangeText={setReason}
              placeholder="Tell us why you're deleting your account"
              placeholderTextColor={foodColors.textMuted}
              multiline
              editable={!submitting}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Confirm your password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError('');
                }}
                placeholder="Enter your account password"
                placeholderTextColor={foodColors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={ms(17)}
                  color={foodColors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
              activeOpacity={0.85}
              disabled={!canSubmit}
              onPress={handleDelete}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Permanently delete account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeDelete} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  avatarSection: { alignItems: 'center', marginBottom: ms(26) },
  avatarHint: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(10),
  },

  form: { gap: ms(16) },
  fieldBlock: {},
  fieldLabel: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: ms(6),
  },
  fieldValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(14),
  },
  fieldValue: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },

  editCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    marginTop: ms(24),
    paddingVertical: ms(12),
    borderRadius: ms(22),
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  editCtaText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },

  deleteCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    marginTop: ms(12),
    paddingVertical: ms(12),
    borderRadius: ms(22),
    backgroundColor: 'rgba(229,57,53,0.08)',
  },
  deleteCtaText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: DANGER,
  },

  bottomSpacer: { height: ms(20) },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: foodColors.background,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: '5.5%',
    paddingTop: ms(10),
    paddingBottom: ms(28),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: ms(40),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: foodColors.border,
    marginBottom: ms(16),
  },
  warnIconWrap: {
    alignSelf: 'center',
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.1)',
    marginBottom: ms(12),
  },
  sheetTitle: {
    textAlign: 'center',
    fontSize: ms(17),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  sheetNote: {
    textAlign: 'center',
    fontSize: ms(12.5),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(8),
    marginBottom: ms(18),
  },
  inputLabel: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: ms(6),
  },
  input: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    marginBottom: ms(14),
  },
  reasonInput: { minHeight: ms(84) },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: ms(12),
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  errorText: {
    marginTop: ms(8),
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: DANGER,
  },
  confirmBtn: {
    marginTop: ms(18),
    paddingVertical: ms(14),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DANGER,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },
  cancelBtn: { marginTop: ms(10), paddingVertical: ms(10), alignItems: 'center' },
  cancelBtnText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
});