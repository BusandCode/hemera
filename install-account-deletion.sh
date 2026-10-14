#!/usr/bin/env bash
# Installs account deletion (Requirements 7, 8, 9) into the Hemera mobile app.
# Run from the mobile repo root:   bash install-account-deletion.sh
# Every file it replaces or edits is first copied to .account-deletion-backup/
set -euo pipefail

need() { [ -e "$1" ] || { echo "✗ Missing $1 — run this from the Hemera mobile repo root."; exit 1; }; }
need package.json
need src/context/AuthContext.tsx
need src/lib/supabase.ts
need supabase/functions

grep -q "export const supabase" src/lib/supabase.ts || \
  echo "! src/lib/supabase.ts has no 'export const supabase' — check the import in src/services/accountDeletion.ts"

SCREEN=$(grep -rl "export default function PersonalInformationScreen" app src \
  --include='*.tsx' 2>/dev/null | head -n 1 || true)
[ -n "$SCREEN" ] || { echo "✗ Couldn't find the PersonalInformationScreen file."; exit 1; }

BK=.account-deletion-backup
mkdir -p "$BK"
backup() { if [ -e "$1" ]; then mkdir -p "$BK/$(dirname "$1")"; cp "$1" "$BK/$1"; fi; }

for f in "$SCREEN" src/hooks/useKeyboardOverlap.ts src/services/accountDeletion.ts \
         src/context/AuthContext.tsx supabase/functions/delete-account/index.ts \
         supabase/functions/admin-account-lifecycle/index.ts; do
  backup "$f"
done

# Relative prefix from the screen's folder back to the repo root (e.g. app/x.tsx -> ../)
DEPTH=$(dirname "$SCREEN" | awk -F/ '{print NF}')
PREFIX=$(printf '../%.0s' $(seq 1 "$DEPTH"))

mkdir -p src/services src/hooks supabase/functions/delete-account supabase/functions/admin-account-lifecycle

cat > "$SCREEN" <<'HEMERA_SCREEN'
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
HEMERA_SCREEN

sed -i "s#'\.\./src/#'${PREFIX}src/#g" "$SCREEN"

cat > src/services/accountDeletion.ts <<'HEMERA_SERVICE'
import { FunctionsHttpError } from '@supabase/supabase-js';

// ADAPT: point this at your existing Supabase client.
import { supabase } from '../lib/supabase';

export type DeletionBlocker =
  | 'active_order'
  | 'active_eplan'
  | 'active_subscription'
  | 'pending_wallet_transaction'
  | 'wallet_balance';

export type AccountDeletionErrorCode =
  | 'INVALID_PASSWORD'
  | 'ACCOUNT_DELETION_BLOCKED'
  | 'ACCOUNT_NOT_ACTIVE'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

export class AccountDeletionError extends Error {
  constructor(
    public readonly code: AccountDeletionErrorCode,
    message: string,
    public readonly blockers: DeletionBlocker[] = [],
  ) {
    super(message);
    this.name = 'AccountDeletionError';
  }
}

/* ------------------------------------------------------------------ */
/* One message for every place in the app that reports a blocked delete */
/* ------------------------------------------------------------------ */

export const DELETION_UNAVAILABLE_TITLE = 'Account Deletion Unavailable';

const BLOCKER_PHRASES: Record<DeletionBlocker, string> = {
  active_order: 'an active order',
  active_eplan: 'an active E-Plan',
  active_subscription: 'an active subscription',
  pending_wallet_transaction: 'a pending wallet transaction',
  wallet_balance: 'a remaining E-Plan wallet balance',
};

const joinList = (items: string[], conjunction: 'and' | 'or') =>
  items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;

export function describeDeletionBlockers(blockers: DeletionBlocker[]): string {
  const specific = [...new Set(blockers)].map((b) => BLOCKER_PHRASES[b]).filter(Boolean);
  const phrase =
    specific.length > 0
      ? joinList(specific, 'and')
      : joinList(Object.values(BLOCKER_PHRASES), 'or');
  return `You cannot delete your account while you have ${phrase}. Please contact Support for assistance.`;
}

/* ------------------------------------------------------------------ */

const FALLBACK_MESSAGES: Record<AccountDeletionErrorCode, string> = {
  INVALID_PASSWORD: 'The password you entered is incorrect.',
  ACCOUNT_DELETION_BLOCKED: describeDeletionBlockers([]),
  ACCOUNT_NOT_ACTIVE: 'This account cannot be deleted right now. Please contact Support.',
  RATE_LIMITED: 'Too many attempts. Wait a few minutes and try again.',
  BAD_REQUEST: 'Enter your password and a reason, then try again.',
  UNAUTHENTICATED: 'Your session has expired. Sign in again and retry.',
  SERVER_ERROR: 'We could not delete your account. Please try again.',
  NETWORK_ERROR: 'Check your internet connection and try again.',
};

async function callDeleteAccount(mode: 'check' | 'delete', password: string, reason: string) {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { mode, password, reason },
  });

  if (!error) return data as { status: string };

  let payload: { code?: AccountDeletionErrorCode; message?: string; blockers?: DeletionBlocker[] } | null =
    null;
  if (error instanceof FunctionsHttpError) {
    try {
      payload = await error.context.json();
    } catch {
      payload = null;
    }
  }

  const code: AccountDeletionErrorCode =
    payload?.code && payload.code in FALLBACK_MESSAGES
      ? payload.code
      : error instanceof FunctionsHttpError
        ? 'SERVER_ERROR'
        : 'NETWORK_ERROR';

  const blockers = payload?.blockers ?? [];
  const message =
    code === 'ACCOUNT_DELETION_BLOCKED'
      ? describeDeletionBlockers(blockers)
      : payload?.message || FALLBACK_MESSAGES[code];

  throw new AccountDeletionError(code, message, blockers);
}

/** Verifies the password and eligibility without deleting anything. Throws AccountDeletionError. */
export async function checkAccountDeletion(password: string, reason: string): Promise<void> {
  await callDeleteAccount('check', password, reason);
}

/**
 * Deletes the account. The server re-runs every eligibility check under a row lock,
 * so a "check" that passed earlier can still come back ACCOUNT_DELETION_BLOCKED here.
 */
export async function requestAccountDeletion(password: string, reason: string): Promise<void> {
  await callDeleteAccount('delete', password, reason);
}
HEMERA_SERVICE

cat > src/hooks/useKeyboardOverlap.ts <<'HEMERA_HOOK'
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform, View } from 'react-native';

/**
 * Returns how many px of `ref` the keyboard covers, plus an onLayout handler.
 *
 * Attach `onLayout` to the same view as `ref`. On Android some devices resize the
 * window for the keyboard (adjustResize) and some don't (edge-to-edge). keyboardDidShow
 * can fire before that resize has landed, so the first measurement may count the
 * keyboard twice. Re-measuring when the root's frame changes corrects this on every
 * device: if the window shrank, the overlap drops to 0; if it didn't, it stays put.
 * Padding applied to the root doesn't change its frame, so this can't loop.
 */
export function useKeyboardAvoidance(ref: RefObject<View | null>, enabled = true) {
  const [overlap, setOverlap] = useState(0);
  const keyboardTop = useRef<number | null>(null);

  const measure = useCallback(() => {
    const top = keyboardTop.current;
    const node = ref.current;
    if (top == null || !node) return;
    node.measureInWindow((_x, y, _width, height) => {
      setOverlap(Math.max(0, Math.round(y + height - top)));
    });
  }, [ref]);

  useEffect(() => {
    if (!enabled) {
      keyboardTop.current = null;
      setOverlap(0);
      return;
    }

    const ios = Platform.OS === 'ios';

    const onShow = (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      if (!ref.current) {
        setOverlap(event.endCoordinates.height);
        return;
      }
      measure();
    };

    const onHide = () => {
      keyboardTop.current = null;
      setOverlap(0);
    };

    const subscriptions = [
      Keyboard.addListener(ios ? 'keyboardWillChangeFrame' : 'keyboardDidShow', onShow),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', onHide),
    ];

    return () => subscriptions.forEach((s) => s.remove());
  }, [ref, enabled, measure]);

  return { overlap, onLayout: measure };
}

/** Unchanged signature for screens already using it. */
export function useKeyboardOverlap(ref: RefObject<View | null>, enabled = true) {
  return useKeyboardAvoidance(ref, enabled).overlap;
}
HEMERA_HOOK

cat > supabase/functions/delete-account/index.ts <<'HEMERA_FN_DELETE'
// supabase functions deploy delete-account
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ~100 years. Supabase has no permanent ban; reactivation sets ban_duration 'none'.
const PERMANENT_BAN = '876000h';
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

/** Blocks sign-in and token refresh, and revokes every existing refresh token. */
async function revokeAccess(admin: SupabaseClient, userId: string, jwt: string) {
  const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: PERMANENT_BAN,
  });
  if (banErr) throw banErr;
  // Best effort: the ban already stops refreshes; this kills sessions on other devices sooner.
  await admin.auth.admin.signOut(jwt, 'global').catch(() => undefined);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { code: 'BAD_REQUEST', message: 'Method not allowed.' });

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { code: 'UNAUTHENTICATED', message: 'Sign in again and retry.' });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, NO_SESSION);

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userErr || !user?.email) {
    return json(401, { code: 'UNAUTHENTICATED', message: 'Sign in again and retry.' });
  }

  let body: { mode?: unknown; password?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { code: 'BAD_REQUEST', message: 'Invalid request.' });
  }

  const mode = body.mode === 'check' || body.mode === 'delete' ? body.mode : null;
  const password = typeof body.password === 'string' ? body.password : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  if (!mode || !password || !reason) {
    return json(400, { code: 'BAD_REQUEST', message: 'Enter your password and a reason, then try again.' });
  }

  try {
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('account_status')
      .eq('id', user.id)
      .single();
    if (profileErr) throw profileErr;

    // Idempotent retry: DB already says deleted (e.g. the ban call failed last time).
    if (profile.account_status === 'deleted') {
      if (mode === 'delete') await revokeAccess(admin, user.id, jwt);
      return json(200, { status: 'deleted' });
    }
    if (profile.account_status !== 'active') {
      return json(403, {
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'This account cannot be deleted right now. Please contact Support.',
      });
    }

    // Verify the password on a throwaway client so the caller's session is untouched.
    const verifier = createClient(SUPABASE_URL, ANON_KEY, NO_SESSION);
    const { data: signIn, error: pwErr } = await verifier.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (pwErr?.status === 429) {
      return json(429, { code: 'RATE_LIMITED', message: 'Too many attempts. Wait a few minutes and try again.' });
    }
    if (pwErr || signIn.user?.id !== user.id) {
      return json(401, { code: 'INVALID_PASSWORD', message: 'The password you entered is incorrect.' });
    }
    await verifier.auth.signOut({ scope: 'local' }).catch(() => undefined);

    if (mode === 'check') {
      const { data: blockers, error } = await admin.rpc('account_deletion_blockers', {
        p_user_id: user.id,
      });
      if (error) throw error;
      if (Array.isArray(blockers) && blockers.length > 0) {
        return json(409, { code: 'ACCOUNT_DELETION_BLOCKED', blockers });
      }
      return json(200, { status: 'eligible' });
    }

    // Authoritative path: re-checks everything under row locks in one transaction.
    const { data: result, error } = await admin.rpc('request_account_deletion', {
      p_user_id: user.id,
      p_reason: reason,
    });
    if (error) throw error;

    switch (result?.status) {
      case 'blocked':
        return json(409, { code: 'ACCOUNT_DELETION_BLOCKED', blockers: result.blockers ?? [] });
      case 'not_active':
        return json(403, {
          code: 'ACCOUNT_NOT_ACTIVE',
          message: 'This account cannot be deleted right now. Please contact Support.',
        });
      case 'deleted':
      case 'already_deleted':
        await revokeAccess(admin, user.id, jwt);
        return json(200, { status: 'deleted' });
      default:
        throw new Error(`Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.error('delete-account failed', user.id, e);
    return json(500, { code: 'SERVER_ERROR', message: 'We could not delete your account. Please try again.' });
  }
});
HEMERA_FN_DELETE

cat > supabase/functions/admin-account-lifecycle/index.ts <<'HEMERA_FN_ADMIN'
// supabase functions deploy admin-account-lifecycle
//
// POST { action: 'reactivate' | 'purge', userId: string, note?: string }
//   reactivate → active superadmin or support_admin
//   purge      → active superadmin only (only works on user-deleted accounts)
//
// Optional secret RESERVED_EMAIL_RETENTION_DAYS (set from your retention policy):
//   unset → email stays reserved indefinitely after a purge (safe default)
//   0     → released immediately;  N → released N days after the purge
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RETENTION_RAW = Deno.env.get('RESERVED_EMAIL_RETENTION_DAYS');
const RETENTION_DAYS =
  RETENTION_RAW && /^\d+$/.test(RETENTION_RAW) ? Number(RETENTION_RAW) : null;

const cors = {
  'Access-Control-Allow-Origin': '*', // tighten to your admin panel's origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KNOWN_DB_ERRORS: Record<string, number> = {
  ACCOUNT_NOT_FOUND: 404,
  NOT_A_DELETED_ACCOUNT: 409,
  ONLY_DELETED_ACCOUNTS_CAN_BE_PURGED: 409,
  WALLET_BALANCE_REMAINING: 409,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { code: 'BAD_REQUEST' });

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { code: 'UNAUTHENTICATED' });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerErr } = await admin.auth.getUser(jwt);
  const caller = callerData?.user;
  if (callerErr || !caller) return json(401, { code: 'UNAUTHENTICATED' });

  let body: { action?: unknown; userId?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { code: 'BAD_REQUEST' });
  }

  const action = body.action === 'reactivate' || body.action === 'purge' ? body.action : null;
  const userId = typeof body.userId === 'string' && UUID.test(body.userId) ? body.userId : null;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : null;
  if (!action || !userId) return json(400, { code: 'BAD_REQUEST' });
  if (userId === caller.id) return json(400, { code: 'CANNOT_TARGET_SELF' });

  const { data: allowed, error: roleErr } = await admin.rpc('is_account_admin', {
    p_user_id: caller.id,
    p_superadmin_only: action === 'purge',
  });
  if (roleErr || allowed !== true) return json(403, { code: 'FORBIDDEN' });

  // Best effort: a logging failure must not undo or block the action itself.
  const audit = async (meta: Record<string, unknown>) => {
    const { error } = await admin.from('admin_audit_log').insert({
      admin_id: caller.id, // if your panel logs admins.id instead, look it up and use that
      admin_email: caller.email ?? null,
      action: `account.${action}`,
      target_type: 'user',
      target_id: userId,
      meta: { note, ...meta },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      user_agent: req.headers.get('user-agent'),
    });
    if (error) console.error('admin_audit_log insert failed', error);
  };

  try {
    if (action === 'reactivate') {
      const { data: status, error } = await admin.rpc('admin_reactivate_deleted_account', {
        p_user_id: userId,
      });
      if (error) throw error;

      // DB first, then lift the ban. A failed unban is safe to retry ('already_active').
      const { error: unbanErr } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
      if (unbanErr) throw unbanErr;

      await audit({ result: status });
      return json(200, { status });
    }

    // purge
    const { data: email, error: prepErr } = await admin.rpc('admin_prepare_purge', {
      p_user_id: userId,
      p_retain_days: RETENTION_DAYS,
    });
    if (prepErr) throw prepErr;

    // Fails with "Database error deleting user" if any table references the user
    // with ON DELETE RESTRICT / NO ACTION. See the FK query in the setup notes.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    await audit({ email, email_retention_days: RETENTION_DAYS });
    return json(200, { status: 'purged', emailRetentionDays: RETENTION_DAYS });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
    const known = Object.keys(KNOWN_DB_ERRORS).find((k) => message.includes(k));
    if (known) return json(KNOWN_DB_ERRORS[known], { code: known });
    console.error('admin-account-lifecycle failed', action, userId, e);
    return json(500, { code: 'SERVER_ERROR', message });
  }
});
HEMERA_FN_ADMIN

if [ -d supabase/migrations ]; then
cat > supabase/migrations/20261013000000_account_lifecycle.sql <<'HEMERA_SQL'
-- =====================================================================
-- Hemera: account lifecycle (Requirements 8 + 9)
-- Matched to the live schema. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lifecycle state on the profile (existing rows become 'active')
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'deleted')),
  add column if not exists status_changed_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists profiles_account_status_idx
  on public.profiles (account_status) where account_status <> 'active';

-- ---------------------------------------------------------------------
-- 2. Reserved emails. release_at NULL = held indefinitely.
-- ---------------------------------------------------------------------
create table if not exists public.reserved_emails (
  email        text primary key check (email = lower(email)),
  user_id      uuid not null,
  reserved_at  timestamptz not null default now(),
  release_at   timestamptz
);
create index if not exists reserved_emails_user_idx on public.reserved_emails (user_id);
alter table public.reserved_emails enable row level security;  -- no policies: definer functions only

-- ---------------------------------------------------------------------
-- 3. Who may manage deleted accounts
--    View / reactivate: active superadmin, or an active admin with the 'admin' scope
--    Permanently delete: active superadmin only
-- ---------------------------------------------------------------------
create or replace function public.is_account_admin(p_user_id uuid, p_superadmin_only boolean default false)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = p_user_id
      and a.status = 'active'
      and (a.role = 'superadmin' or (not p_superadmin_only and 'admin' = any(a.scopes)))
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Eligibility: the single definition of what blocks deletion
-- ---------------------------------------------------------------------
create or replace function public.account_deletion_blockers(p_user_id uuid)
returns text[]
language plpgsql stable security definer set search_path = public
as $$
declare
  b text[] := '{}';
  -- orders.status has no check constraint, so this is deny-by-default:
  -- any status NOT in this list counts as an active order.
  v_finished text[] := array['delivered', 'completed', 'cancelled', 'canceled', 'refunded', 'failed', 'rejected'];
begin
  -- E-Chop / E-Wash orders
  if exists (
    select 1 from public.orders
    where user_id = p_user_id
      and order_type in ('echop', 'ewash')
      and coalesce(status, '') <> all (v_finished)
  ) then b := array_append(b, 'active_order'); end if;

  -- E-Plan: active plan, unfinished E-Plan order, or a delivery on the road
  if exists (select 1 from public.eplan_plans where user_id = p_user_id and status = 'active')
     or exists (
       select 1 from public.orders
       where user_id = p_user_id and order_type = 'eplan'
         and coalesce(status, '') <> all (v_finished)
     )
     or exists (
       select 1 from public.eplan_deliveries d
       join public.eplan_plans pl on pl.id = d.plan_id
       where pl.user_id = p_user_id and d.status = 'in_transit'
     )
  then b := array_append(b, 'active_eplan'); end if;

  -- E-Wash subscription plans
  if exists (select 1 from public.wash_plans where user_id = p_user_id and status = 'active')
  then b := array_append(b, 'active_subscription'); end if;

  -- Money in flight: open funding/payment attempts, withdrawals, unresolved payment reviews
  if exists (
       select 1 from public.wallet_transactions
       where user_id = p_user_id and status in ('pending', 'processing')
     )
     or exists (
       select 1 from public.withdrawal_requests
       where user_id = p_user_id and status in ('pending', 'processing', 'review')
     )
     or exists (
       select 1 from public.payment_reconciliation r
       join public.wallet_transactions wt on wt.tx_ref = r.tx_ref
       where wt.user_id = p_user_id and r.resolved_at is null
     )
  then b := array_append(b, 'pending_wallet_transaction'); end if;

  -- Wallet balance (E-Plan top-ups and plain funding share this wallet)
  if exists (select 1 from public.wallets where user_id = p_user_id and balance_kobo > 0)
  then b := array_append(b, 'wallet_balance'); end if;

  return b;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Race protection
--    Deletion takes FOR UPDATE on the profile row; every new order, plan,
--    wallet transaction or withdrawal takes FOR SHARE on it and requires
--    'active'. Whichever commits first, the other one sees it.
--
--    A deliberate admin action on a deleted account (e.g. refunding its
--    wallet) can opt out inside its own transaction with:
--      set local hemera.allow_inactive_account = 'on';
-- ---------------------------------------------------------------------
create or replace function public.assert_account_active()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
begin
  if new.user_id is null
     or current_setting('hemera.allow_inactive_account', true) = 'on' then
    return new;
  end if;

  select account_status into v_status
  from public.profiles where id = new.user_id
  for share;

  if found and v_status <> 'active' then
    raise exception 'ACCOUNT_NOT_ACTIVE' using hint = 'This account is suspended or deleted';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_require_active_account on public.orders;
create trigger orders_require_active_account
  before insert on public.orders
  for each row execute function public.assert_account_active();

drop trigger if exists eplan_plans_require_active_account on public.eplan_plans;
create trigger eplan_plans_require_active_account
  before insert on public.eplan_plans
  for each row execute function public.assert_account_active();

drop trigger if exists wash_plans_require_active_account on public.wash_plans;
create trigger wash_plans_require_active_account
  before insert on public.wash_plans
  for each row execute function public.assert_account_active();

drop trigger if exists wallet_tx_require_active_account on public.wallet_transactions;
create trigger wallet_tx_require_active_account
  before insert on public.wallet_transactions
  for each row execute function public.assert_account_active();

drop trigger if exists withdrawals_require_active_account on public.withdrawal_requests;
create trigger withdrawals_require_active_account
  before insert on public.withdrawal_requests
  for each row execute function public.assert_account_active();

-- ---------------------------------------------------------------------
-- 6. The deletion itself (called only by the delete-account edge function)
-- ---------------------------------------------------------------------
create or replace function public.request_account_deletion(p_user_id uuid, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_status   text;
  v_email    text;
  v_blockers text[];
begin
  select account_status into v_status
  from public.profiles where id = p_user_id
  for update;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;
  if v_status = 'deleted' then
    return jsonb_build_object('status', 'already_deleted');
  end if;
  if v_status <> 'active' then
    return jsonb_build_object('status', 'not_active');
  end if;

  v_blockers := public.account_deletion_blockers(p_user_id);
  if cardinality(v_blockers) > 0 then
    -- Nothing changed: no partial deactivation.
    return jsonb_build_object('status', 'blocked', 'blockers', to_jsonb(v_blockers));
  end if;

  select email into v_email from auth.users where id = p_user_id;

  update public.profiles
     set account_status    = 'deleted',
         status_changed_at = now(),
         deleted_at        = now()
   where id = p_user_id;

  if v_email is not null then
    insert into public.reserved_emails (email, user_id)
    values (lower(v_email), p_user_id)
    on conflict (email) do update
      set user_id = excluded.user_id, reserved_at = now(), release_at = null;
  end if;

  -- Your existing deletion record
  insert into public.account_deletions (id, user_id, email, reason, created_at)
  values (gen_random_uuid(), p_user_id, v_email, left(p_reason, 1000), now())
  on conflict do nothing;

  return jsonb_build_object('status', 'deleted');
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Signup enforcement
-- ---------------------------------------------------------------------
-- Until a purge, the auth user still exists, so Supabase already refuses the
-- duplicate email. This hook keeps it reserved AFTER a purge, per release_at.
-- Enable: Dashboard → Authentication → Hooks → "Before User Created".
create or replace function public.hook_block_reserved_emails(event jsonb)
returns jsonb
language plpgsql stable
as $$
declare
  v_email text := lower(event -> 'user' ->> 'email');
begin
  if v_email is not null and exists (
    select 1 from public.reserved_emails
    where email = v_email and (release_at is null or release_at > now())
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 409,
      'message', 'This email is linked to a deleted Hemera account. Please contact Support to restore it.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on public.reserved_emails to supabase_auth_admin;
grant execute on function public.hook_block_reserved_emails(jsonb) to supabase_auth_admin;

-- For the signup screen. Reveals only whether an email belongs to a DELETED account.
create or replace function public.email_registration_status(p_email text)
returns text
language sql stable security definer set search_path = public
as $$
  select case when exists (
    select 1 from public.reserved_emails
    where email = lower(trim(p_email)) and (release_at is null or release_at > now())
  ) then 'reserved' else 'not_reserved' end;
$$;

-- ---------------------------------------------------------------------
-- 8. Admin: Suspended Accounts listing
--    Shows user-deleted accounts plus anyone currently banned in Supabase Auth,
--    with the wallet balance so admins can see money left on a deleted account.
-- ---------------------------------------------------------------------
create or replace function public.admin_list_restricted_accounts()
returns table (
  user_id             uuid,
  email               text,
  full_name           text,
  phone               text,
  kind                text,         -- 'user_deleted' | 'suspended'
  deleted_at          timestamptz,
  deletion_reason     text,
  banned_until        timestamptz,
  wallet_balance_kobo bigint
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_account_admin(auth.uid()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
    select p.id,
           u.email::text,
           p.full_name,
           p.phone,
           case when p.account_status = 'deleted' then 'user_deleted' else 'suspended' end,
           p.deleted_at,
           (select ad.reason from public.account_deletions ad
             where ad.user_id = p.id order by ad.created_at desc limit 1),
           u.banned_until,
           coalesce(w.balance_kobo, 0)::bigint
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.wallets w on w.user_id = p.id
     where p.account_status in ('deleted', 'suspended')
        or u.banned_until > now()
     order by coalesce(p.status_changed_at, p.deleted_at) desc nulls last;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Admin: reactivate / prepare purge (called by admin-account-lifecycle
--    with the service role, after it has checked the admin's role)
-- ---------------------------------------------------------------------
create or replace function public.admin_reactivate_deleted_account(p_user_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
begin
  select account_status into v_status from public.profiles where id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_status = 'active' then return 'already_active'; end if;            -- idempotent retry
  if v_status <> 'deleted' then raise exception 'NOT_A_DELETED_ACCOUNT'; end if;

  update public.profiles
     set account_status = 'active', status_changed_at = now(), deleted_at = null
   where id = p_user_id;

  delete from public.reserved_emails where user_id = p_user_id;
  return 'reactivated';
end;
$$;

-- p_retain_days: NULL = keep the email reserved indefinitely, 0 = release now, N = after N days.
create or replace function public.admin_prepare_purge(p_user_id uuid, p_retain_days int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
  v_email  text;
begin
  select account_status into v_status from public.profiles where id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_status <> 'deleted' then raise exception 'ONLY_DELETED_ACCOUNTS_CAN_BE_PURGED'; end if;

  select email into v_email from auth.users where id = p_user_id;

  if p_retain_days = 0 then
    delete from public.reserved_emails where user_id = p_user_id;
  else
    update public.reserved_emails
       set release_at = case when p_retain_days is null then null
                             else now() + make_interval(days => p_retain_days) end
     where user_id = p_user_id;
  end if;

  return v_email;
end;
$$;

-- ---------------------------------------------------------------------
-- 10. Privileges (Supabase grants EXECUTE to anon/authenticated by default)
-- ---------------------------------------------------------------------
revoke all on function public.account_deletion_blockers(uuid)            from public, anon, authenticated;
revoke all on function public.request_account_deletion(uuid, text)       from public, anon, authenticated;
revoke all on function public.admin_reactivate_deleted_account(uuid)     from public, anon, authenticated;
revoke all on function public.admin_prepare_purge(uuid, int)             from public, anon, authenticated;
revoke all on function public.hook_block_reserved_emails(jsonb)          from public, anon, authenticated;
revoke all on function public.is_account_admin(uuid, boolean)            from public, anon, authenticated;
revoke all on function public.admin_list_restricted_accounts()           from public, anon;

grant execute on function public.account_deletion_blockers(uuid)         to service_role;
grant execute on function public.request_account_deletion(uuid, text)    to service_role;
grant execute on function public.admin_reactivate_deleted_account(uuid)  to service_role;
grant execute on function public.admin_prepare_purge(uuid, int)          to service_role;
grant execute on function public.is_account_admin(uuid, boolean)         to service_role;
grant execute on function public.admin_list_restricted_accounts()        to authenticated;
grant execute on function public.email_registration_status(text)         to anon, authenticated;
HEMERA_SQL

cat > supabase/migrations/20261014000000_admin_accounts_ui.sql <<'HEMERA_SQL'
-- Hemera: admin Suspended Accounts page support. Run after 20261013000000_account_lifecycle.sql.

-- Lets the admin panel know whether to show "Permanently delete" (superadmins only).
-- The edge function enforces the same rule server-side regardless.
create or replace function public.current_admin_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.admins where user_id = auth.uid() and status = 'active';
$$;

revoke all on function public.current_admin_role() from public, anon;
grant execute on function public.current_admin_role() to authenticated;

-- Same as before, plus: refuse to purge while money is still in the wallet
-- (a late transfer can land after deletion). Refund it first.
create or replace function public.admin_prepare_purge(p_user_id uuid, p_retain_days int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
  v_email  text;
begin
  select account_status into v_status from public.profiles where id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_status <> 'deleted' then raise exception 'ONLY_DELETED_ACCOUNTS_CAN_BE_PURGED'; end if;

  if exists (select 1 from public.wallets where user_id = p_user_id and balance_kobo > 0) then
    raise exception 'WALLET_BALANCE_REMAINING';
  end if;

  select email into v_email from auth.users where id = p_user_id;

  if p_retain_days = 0 then
    delete from public.reserved_emails where user_id = p_user_id;
  else
    update public.reserved_emails
       set release_at = case when p_retain_days is null then null
                             else now() + make_interval(days => p_retain_days) end
     where user_id = p_user_id;
  end if;

  return v_email;
end;
$$;

revoke all on function public.admin_prepare_purge(uuid, int) from public, anon, authenticated;
grant execute on function public.admin_prepare_purge(uuid, int) to service_role;
HEMERA_SQL

cat > supabase/migrations/20261014000100_retire_delete_my_account.sql <<'HEMERA_SQL'
-- The old client-callable deletion path skipped every eligibility check.
-- Revoke it (all overloads) instead of dropping, so it can be inspected or restored.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.proname = 'delete_my_account'
      and p.pronamespace = 'public'::regnamespace
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;
HEMERA_SQL

fi

# ---- AuthContext: new deleteAccount, import, and treat banned users as signed out
AUTH=src/context/AuthContext.tsx
cat > "$BK/deleteAccount.block" <<'HEMERA_BLOCK'
  const deleteAccount = async (password: string, reason: string) => {
    const userId = session?.user?.id;
    if (!userId) throw new Error('No active session');

    // The server verifies the password, re-checks every deletion restriction under a
    // lock, marks the account deleted, and revokes all sessions. Throws AccountDeletionError.
    await requestAccountDeletion(password, reason.trim());

    try {
      await removeDevicePushToken(userId);
    } catch {
      // best effort: the account is already deleted and its sessions revoked
    }

    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
  };
HEMERA_BLOCK

if ! grep -q "requestAccountDeletion(password" "$AUTH"; then
  awk -v blockfile="$BK/deleteAccount.block" '
    BEGIN { while ((getline l < blockfile) > 0) blk = blk l "\n" }
    /^  const deleteAccount = async/ { printf "%s", blk; skip = 1; next }
    skip && /^  };[[:space:]]*$/ { skip = 0; next }
    !skip { print }
  ' "$AUTH" > "$AUTH.tmp" && mv "$AUTH.tmp" "$AUTH"
fi

grep -q "from '../services/accountDeletion'" "$AUTH" || \
  sed -i "1i import { requestAccountDeletion } from '../services/accountDeletion';" "$AUTH"

grep -q "user_banned" "$AUTH" || \
  sed -i "s#^\([[:space:]]*\)code === 'user_not_found' ||#&\n\1code === 'user_banned' ||#" "$AUTH"

rm -f "$BK/deleteAccount.block"

# ---- Verify
ok=1
grep -q "requestAccountDeletion(password" "$AUTH" || { echo "✗ deleteAccount was not replaced"; ok=0; }
grep -q "delete_my_account" "$AUTH" && { echo "✗ AuthContext still calls delete_my_account"; ok=0; }
grep -q "user_banned" "$AUTH" || echo "! Couldn't add user_banned to isDeadSessionError (optional)"

echo
echo "✓ Screen:     $SCREEN"
echo "✓ Service:    src/services/accountDeletion.ts"
echo "✓ Hook:       src/hooks/useKeyboardOverlap.ts"
echo "✓ Functions:  supabase/functions/delete-account, admin-account-lifecycle"
[ -d supabase/migrations ] && echo "✓ Migrations: copied into supabase/migrations (already applied; kept for history)"
[ "$ok" = 1 ] && echo "✓ AuthContext updated" || echo "  Restore from $BK/ if needed."
echo
echo "Backups: $BK/   (add it to .gitignore, or delete it once you're happy)"
echo "Review:  git diff"
