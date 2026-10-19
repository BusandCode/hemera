import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useProfile, Profile } from '../src/context/ProfileContext';
import { ms } from '../src/utils/responsive';

type FeatherIcon = keyof typeof Feather.glyphMap;

type Field = {
  key: 'fullName' | 'email' | 'phone' | 'gender';
  label: string;
  icon: FeatherIcon;
  editable: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  maxLength?: number;
};

const fields: Field[] = [
  { key: 'fullName', label: 'Full Name', icon: 'user', editable: false },
  { key: 'email', label: 'Email Address', icon: 'mail', editable: false },
  { key: 'phone', label: 'Phone Number', icon: 'phone', editable: true, keyboardType: 'phone-pad', maxLength: 11 },
  { key: 'gender', label: 'Gender', icon: 'users', editable: false },
];

type DialogTone = 'success' | 'danger' | 'primary';

type DialogConfig = {
  tone: DialogTone;
  icon: FeatherIcon;
  title: string;
  body: string;
  primary: { label: string; onPress?: () => void };
  secondary?: { label: string; onPress?: () => void };
  dismissable?: boolean;
};

const SUCCESS = '#22C55E';
const SUCCESS_LIGHT = 'rgba(34,197,94,0.12)';
const DANGER = '#FF3B30';
const DANGER_LIGHT = 'rgba(255,59,48,0.10)';

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?';

/** Turns save errors into messages a user can act on. Raw error is logged. */
function friendlySaveError(e: unknown): string {
  const msg = ((e as any)?.message ?? '').toString().toLowerCase();

  if (msg.includes('network request failed') || msg.includes('failed to fetch') || msg.includes('network')) {
    return 'No internet connection. Check your network and try again.';
  }
  if (msg.includes('bucket not found')) {
    return "Photo uploads aren't available right now. Please try again later.";
  }
  if (msg.includes('payload too large') || msg.includes('exceeded the maximum') || msg.includes('too large')) {
    return 'That photo is too large. Please choose one under 5 MB.';
  }
  if (msg.includes('mime type') || msg.includes('not supported')) {
    return 'That image format is not supported. Please use a JPG or PNG photo.';
  }
  if (msg.includes('row-level security') || msg.includes('permission denied') || msg.includes('unauthorized')) {
    return "You don't have permission to make this change. Please sign out and sign in again.";
  }
  return (e as any)?.message || 'Something went wrong while saving. Please try again.';
}

/* ---------- Dialog ---------- */

function AppDialog({ config, onClose }: { config: DialogConfig | null; onClose: () => void }) {
  const [shown, setShown] = useState<DialogConfig | null>(config);
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!config) return;
    setShown(config);
    scale.setValue(0.92);
    Animated.timing(scale, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
  }, [config, scale]);

  const tone = shown?.tone ?? 'primary';
  const accent = tone === 'success' ? SUCCESS : tone === 'danger' ? DANGER : foodColors.primary;
  const accentLight =
    tone === 'success' ? SUCCESS_LIGHT : tone === 'danger' ? DANGER_LIGHT : foodColors.primaryLight;

  const press = (action?: { onPress?: () => void }) => {
    onClose();
    action?.onPress?.();
  };

  const dismiss = () => {
    if (shown?.dismissable === false) return press(shown.primary);
    onClose();
  };

  return (
    <Modal visible={!!config} transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={dismiss} />
        <Animated.View style={[styles.modalCard, { transform: [{ scale }] }]}>
          <View style={[styles.badgeRing, { backgroundColor: accentLight }]}>
            <View style={[styles.badgeCore, { backgroundColor: accent }]}>
              <Feather name={shown?.icon ?? 'info'} size={ms(28)} color="#fff" />
            </View>
          </View>

          <Text style={styles.modalTitle}>{shown?.title}</Text>
          <Text style={styles.modalMessage}>{shown?.body}</Text>

          <TouchableOpacity
            style={[styles.modalButton, tone === 'danger' && { backgroundColor: DANGER }]}
            onPress={() => press(shown?.primary)}
            activeOpacity={0.85}
          >
            <Text style={styles.modalButtonText}>{shown?.primary.label}</Text>
          </TouchableOpacity>

          {shown?.secondary ? (
            <TouchableOpacity
              style={styles.modalSecondary}
              onPress={() => press(shown.secondary)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSecondaryText}>{shown.secondary.label}</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------- Photo source sheet ---------- */

function PhotoSheet({
  visible,
  hasPhoto,
  onClose,
  onCamera,
  onLibrary,
  onRemove,
}: {
  visible: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onRemove: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translate = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (!visible) return;
    translate.setValue(300);
    Animated.timing(translate, {
      toValue: 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, translate]);

  const choose = (fn: () => void) => {
    onClose();
    // Let the sheet close before the system picker opens.
    setTimeout(fn, 250);
  };

  const Option = ({
    icon,
    label,
    onPress,
    danger,
  }: {
    icon: FeatherIcon;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.sheetOption} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.sheetIcon, danger && { backgroundColor: DANGER_LIGHT }]}>
        <Feather name={icon} size={ms(18)} color={danger ? DANGER : foodColors.primary} />
      </View>
      <Text style={[styles.sheetLabel, danger && { color: DANGER }]}>{label}</Text>
      <Feather name="chevron-right" size={ms(18)} color={foodColors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + ms(16), transform: [{ translateY: translate }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Change Profile Photo</Text>
          <Text style={styles.sheetSubtitle}>Choose where to get your new photo from.</Text>

          <View style={styles.sheetGroup}>
            <Option icon="camera" label="Take Photo" onPress={() => choose(onCamera)} />
            <Option icon="image" label="Choose from Library" onPress={() => choose(onLibrary)} />
            {hasPhoto ? (
              <Option icon="trash-2" label="Remove Photo" onPress={() => choose(onRemove)} danger />
            ) : null}
          </View>

          <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------- Screen ---------- */

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, loading, updateProfile } = useProfile();

  const [draft, setDraft] = useState<Profile>(profile);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  // Keep the form in sync with the profile until the user starts editing.
  useEffect(() => {
    if (!dirty) setDraft(profile);
  }, [profile, dirty]);

  useEffect(() => {
    setImageFailed(false);
  }, [draft.photoUri]);

  const update = (key: keyof Profile, value: string) => {
    setDirty(true);
    setDraft((prev) => ({
      ...prev,
      [key]: key === 'phone' ? value.replace(/\D/g, '').slice(0, 11) : value,
    }));
  };

  const setPhoto = (uri: string | null) => {
    setDirty(true);
    setDraft((prev) => ({ ...prev, photoUri: uri }));
  };

  const showPermissionDialog = (what: 'photos' | 'camera') => {
    setDialog({
      tone: 'primary',
      icon: what === 'camera' ? 'camera' : 'image',
      title: 'Permission needed',
      body:
        what === 'camera'
          ? 'Allow camera access in your phone settings to take a profile picture.'
          : 'Allow photo access in your phone settings to choose a profile picture.',
      primary: { label: 'OK' },
    });
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return showPermissionDialog('photos');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return showPermissionDialog('camera');

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) setPhoto(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (saving) return;

    const changes: Partial<Profile> = {};
    if (draft.phone !== profile.phone) changes.phone = draft.phone.trim();
    if (draft.photoUri !== profile.photoUri) changes.photoUri = draft.photoUri;

    if (Object.keys(changes).length === 0) {
      router.back();
      return;
    }

    if (changes.phone !== undefined && changes.phone.length !== 11) {
      setDialog({
        tone: 'danger',
        icon: 'phone',
        title: 'Check your phone number',
        body: 'Your phone number must be exactly 11 digits, e.g. 08031234567.',
        primary: { label: 'OK' },
      });
      return;
    }

    setSaving(true);
    try {
      await updateProfile(changes);
      setDirty(false);
      setDialog({
        tone: 'success',
        icon: 'check',
        title: 'Profile Updated',
        body: 'Your changes have been saved successfully.',
        primary: { label: 'Done', onPress: () => router.back() },
        dismissable: false,
      });
    } catch (e) {
      console.warn('[EditProfile] save failed:', e);
      setDialog({
        tone: 'danger',
        icon: 'alert-triangle',
        title: "Couldn't save changes",
        body: friendlySaveError(e),
        primary: { label: 'Try again', onPress: () => handleSave() },
        secondary: { label: 'Close' },
      });
    } finally {
      setSaving(false);
    }
  };

  const showImage = !!draft.photoUri && !imageFailed;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Edit Profile" />

      {loading && !dirty ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={foodColors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => setSheetOpen(true)}
              activeOpacity={0.85}
              disabled={saving}
            >
              {showImage ? (
                <Image
                  source={{ uri: draft.photoUri! }}
                  style={styles.avatar}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{getInitials(draft.fullName)}</Text>
                </View>
              )}

              {saving && draft.photoUri !== profile.photoUri ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}

              <View style={styles.cameraBadge}>
                <Feather name="camera" size={ms(14)} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <View style={styles.form}>
            {fields.map((field) => (
              <View key={field.key} style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={[styles.fieldInputWrap, !field.editable && styles.fieldInputLocked]}>
                  <Feather name={field.icon} size={ms(16)} color={foodColors.textMuted} />
                  <TextInput
                    style={[styles.fieldInput, !field.editable && styles.fieldInputTextLocked]}
                    value={draft[field.key]}
                    onChangeText={(text) => update(field.key, text)}
                    keyboardType={field.keyboardType ?? 'default'}
                    maxLength={field.maxLength}
                    placeholderTextColor={foodColors.textMuted}
                    editable={field.editable && !saving}
                    selectTextOnFocus={field.editable}
                  />
                  {!field.editable && <Feather name="lock" size={ms(14)} color={foodColors.textMuted} />}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      <PhotoSheet
        visible={sheetOpen}
        hasPhoto={!!draft.photoUri}
        onClose={() => setSheetOpen(false)}
        onCamera={takePhoto}
        onLibrary={pickPhoto}
        onRemove={() => setPhoto(null)}
      />

      <AppDialog config={dialog} onClose={() => setDialog(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  avatarSection: { alignItems: 'center', marginBottom: ms(26) },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: ms(108),
    height: ms(108),
    borderRadius: ms(54),
    backgroundColor: foodColors.border,
  },
  avatarFallback: {
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: ms(38),
    fontFamily: fonts.poppins.semiBold,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: ms(54),
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: ms(2),
    bottom: ms(2),
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: foodColors.primary,
    borderWidth: 3,
    borderColor: foodColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    marginTop: ms(10),
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textMuted,
  },

  form: { gap: ms(16) },
  fieldBlock: {},
  fieldLabel: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: ms(6),
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(13) : ms(4),
  },
  fieldInputLocked: { opacity: 0.7 },
  fieldInput: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },
  fieldInputTextLocked: { color: foodColors.textSecondary },

  bottomSpacer: { height: ms(90) },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: ms(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  saveButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.7 },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  saveButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  // Dialog
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(28),
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20,20,30,0.5)',
  },
  modalCard: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderRadius: ms(26),
    paddingHorizontal: ms(24),
    paddingTop: ms(30),
    paddingBottom: ms(18),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: ms(8) },
    elevation: 10,
  },
  badgeRing: {
    width: ms(88),
    height: ms(88),
    borderRadius: ms(44),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(18),
  },
  badgeCore: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: ms(13.5),
    lineHeight: ms(20),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(6),
    marginBottom: ms(22),
  },
  modalButton: {
    alignSelf: 'stretch',
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: ms(14.5),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  modalSecondary: {
    alignSelf: 'stretch',
    paddingVertical: ms(13),
    marginTop: ms(4),
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },

  // Photo sheet
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: foodColors.background,
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
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
  sheetTitle: {
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
    marginBottom: ms(16),
  },
  sheetGroup: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    overflow: 'hidden',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  sheetIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetLabel: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  sheetCancel: {
    marginTop: ms(12),
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
    backgroundColor: foodColors.surface,
  },
  sheetCancelText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textSecondary,
  },
});