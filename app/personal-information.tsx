import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { Avatar } from '../src/components/profile/Avatar';
import { useProfile } from '../src/context/ProfileContext';
import { useAuth } from '../src/context/AuthContext';
import { useKeyboardAvoidance } from '../src/hooks/useKeyboardOverlap';
import {
  AccountDeletionError,
  checkAccountDeletion,
  DeletionBlocker,
  describeDeletionBlockers,
  DELETION_UNAVAILABLE_TITLE,
} from '../src/services/accountDeletion';
import { ms } from '../src/utils/responsive';

type Field = {
  key: 'fullName' | 'email' | 'phone' | 'gender';
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

type DeleteField = 'reason' | 'password';

type Dialog = { kind: 'confirm' } | { kind: 'blocked'; blockers: DeletionBlocker[] } | null;

const fields: Field[] = [
  { key: 'fullName', label: 'Full Name', icon: 'user' },
  { key: 'email', label: 'Email Address', icon: 'mail' },
  { key: 'phone', label: 'Phone Number', icon: 'phone' },
  { key: 'gender', label: 'Gender', icon: 'users' },
];

const DANGER = '#E53935';

export default function PersonalInformationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { deleteAccount } = useAuth();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false); // step 1: server pre-check
  const [submitting, setSubmitting] = useState(false); // step 2: actual deletion
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  // Synchronous guard: state updates are async, so a fast double tap can slip past `busy`.
  const inFlight = useRef(false);

  const modalRootRef = useRef<View>(null);
  const sheetScrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<DeleteField, number>>({ reason: 0, password: 0 });
  const focusedField = useRef<DeleteField | null>(null);

  const { overlap: keyboardOverlap, onLayout: remeasureKeyboard } = useKeyboardAvoidance(
    modalRootRef,
    deleteOpen,
  );
  const keyboardOpen = keyboardOverlap > 0;

  const busy = checking || submitting;
  const canSubmit = password.length > 0 && reason.trim().length > 0 && !busy;

  const scrollToField = (field: DeleteField) => {
    requestAnimationFrame(() => {
      sheetScrollRef.current?.scrollTo({
        y: Math.max(0, fieldY.current[field] - ms(8)),
        animated: true,
      });
    });
  };

  const handleFocus = (field: DeleteField) => {
    focusedField.current = field;
    scrollToField(field);
  };

  const handleBlur = (field: DeleteField) => {
    if (focusedField.current === field) focusedField.current = null;
  };

  useEffect(() => {
    if (error) sheetScrollRef.current?.scrollToEnd({ animated: true });
  }, [error]);

  const resetForm = () => {
    setPassword('');
    setReason('');
    setError('');
    setShowPassword(false);
    setDialog(null);
    focusedField.current = null;
  };

  const closeDelete = () => {
    if (busy) return;
    setDeleteOpen(false);
    resetForm();
  };

  const handleRequestClose = () => {
    // Android back: close the dialog first, then the sheet.
    if (dialog) {
      if (!submitting) setDialog(null);
      return;
    }
    closeDelete();
  };

  const handleFailure = (e: unknown) => {
    if (e instanceof AccountDeletionError && e.code === 'ACCOUNT_DELETION_BLOCKED') {
      setDialog({ kind: 'blocked', blockers: e.blockers });
      return;
    }
    setDialog(null);
    setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
  };

  // Step 1: "Delete Account" — verify password + eligibility on the server, then ask to confirm.
  const handleDeletePress = async () => {
    if (!canSubmit || inFlight.current) return;
    inFlight.current = true;
    Keyboard.dismiss();
    setChecking(true);
    setError('');
    try {
      await checkAccountDeletion(password, reason.trim());
      setDialog({ kind: 'confirm' });
    } catch (e) {
      handleFailure(e);
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  };

  // Step 2: "Yes" — the server re-checks everything under a lock before deleting.
  const handleConfirmYes = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    try {
      await deleteAccount(password, reason.trim());
      setDeleteOpen(false);
      resetForm();
      router.replace('/' as any);
      Alert.alert('Account deleted', 'Your account has been deleted and you have been signed out.');
    } catch (e) {
      handleFailure(e);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleConfirmNo = () => {
    if (submitting) return;
    setDialog(null); // back to the form with password + reason kept
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

      <Modal
        visible={deleteOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleRequestClose}
      >
        <View
          ref={modalRootRef}
          collapsable={false}
          onLayout={remeasureKeyboard}
          style={[
            styles.modalRoot,
            { paddingTop: insets.top + ms(8), paddingBottom: keyboardOverlap },
          ]}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDelete} />
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: keyboardOpen
                  ? ms(12)
                  : Math.max(ms(28), insets.bottom + ms(12)),
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <ScrollView
              ref={sheetScrollRef}
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onLayout={() => {
                if (focusedField.current) scrollToField(focusedField.current);
              }}
            >
              <View style={styles.warnIconWrap}>
                <Feather name="alert-triangle" size={ms(22)} color={DANGER} />
              </View>
              <Text style={styles.sheetTitle}>Delete your account?</Text>
              <Text style={styles.sheetNote}>
                You'll be signed out and lose access to your profile, orders and subscriptions.
                To restore the account later, you'll need to contact Support.
              </Text>

              <View
                onLayout={(e) => {
                  fieldY.current.reason = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.inputLabel}>Reason for leaving</Text>
                <TextInput
                  style={[styles.input, styles.reasonInput]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Tell us why you're deleting your account"
                  placeholderTextColor={foodColors.textMuted}
                  multiline
                  maxLength={1000}
                  editable={!busy}
                  textAlignVertical="top"
                  onFocus={() => handleFocus('reason')}
                  onBlur={() => handleBlur('reason')}
                />
              </View>

              <View
                onLayout={(e) => {
                  fieldY.current.password = e.nativeEvent.layout.y;
                }}
              >
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
                    editable={!busy}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                    <Feather
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={ms(17)}
                      color={foodColors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
                activeOpacity={0.85}
                disabled={!canSubmit}
                onPress={handleDeletePress}
              >
                {checking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Delete Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={closeDelete} disabled={busy}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>

          {dialog && (
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogCard} accessibilityViewIsModal>
                <View style={styles.warnIconWrap}>
                  <Feather
                    name={dialog.kind === 'blocked' ? 'slash' : 'alert-triangle'}
                    size={ms(22)}
                    color={DANGER}
                  />
                </View>

                {dialog.kind === 'confirm' ? (
                  <>
                    <Text style={styles.sheetTitle}>Are you sure?</Text>
                    <Text style={styles.dialogBody}>
                      Do you want to proceed with deleting your Hemera account? You'll be signed
                      out immediately.
                    </Text>
                    <View style={styles.dialogActions}>
                      <TouchableOpacity
                        style={[styles.dialogBtn, styles.dialogBtnSecondary]}
                        onPress={handleConfirmNo}
                        disabled={submitting}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.dialogBtnSecondaryText}>No</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dialogBtn, styles.dialogBtnDanger]}
                        onPress={handleConfirmYes}
                        disabled={submitting}
                        activeOpacity={0.85}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.dialogBtnDangerText}>Yes, delete</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.sheetTitle}>{DELETION_UNAVAILABLE_TITLE}</Text>
                    <Text style={styles.dialogBody}>{describeDeletionBlockers(dialog.blockers)}</Text>
                    <TouchableOpacity
                      style={[styles.dialogBtn, styles.dialogBtnSecondary, styles.dialogBtnFull]}
                      onPress={() => setDialog(null)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.dialogBtnSecondaryText}>OK</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </View>
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
    flexShrink: 1,
    maxHeight: '100%',
    backgroundColor: foodColors.background,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: '5.5%',
    paddingTop: ms(10),
  },
  sheetHandle: {
    alignSelf: 'center',
    width: ms(40),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: foodColors.border,
    marginBottom: ms(16),
  },
  sheetScroll: { flexGrow: 0, flexShrink: 1 },
  sheetScrollContent: { paddingBottom: ms(4) },
  sheetFooter: { flexShrink: 0 },
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
  reasonInput: { minHeight: ms(84), maxHeight: ms(140) },
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

  dialogOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '8%',
  },
  dialogCard: {
    width: '100%',
    maxWidth: ms(380),
    backgroundColor: foodColors.background,
    borderRadius: ms(20),
    paddingHorizontal: ms(20),
    paddingTop: ms(22),
    paddingBottom: ms(18),
  },
  dialogBody: {
    textAlign: 'center',
    fontSize: ms(13),
    lineHeight: ms(20),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(8),
    marginBottom: ms(18),
  },
  dialogActions: { flexDirection: 'row', gap: ms(10) },
  dialogBtn: {
    flex: 1,
    minHeight: ms(46),
    borderRadius: ms(23),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnFull: { flex: 0, alignSelf: 'stretch' },
  dialogBtnSecondary: { backgroundColor: foodColors.surface },
  dialogBtnSecondaryText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  dialogBtnDanger: { backgroundColor: DANGER },
  dialogBtnDangerText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },
});
