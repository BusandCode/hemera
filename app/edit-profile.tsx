import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useProfile } from '../src/context/ProfileContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

type Field = {
  key: 'fullName' | 'email' | 'phone' | 'gender';
  label: string;
  icon: keyof typeof Feather.glyphMap;
  editable: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
};

const fields: Field[] = [
  { key: 'fullName', label: 'Full Name', icon: 'user', editable: false },
  { key: 'email', label: 'Email Address', icon: 'mail', editable: true, keyboardType: 'email-address' },
  { key: 'phone', label: 'Phone Number', icon: 'phone', editable: true, keyboardType: 'phone-pad' },
  { key: 'gender', label: 'Gender', icon: 'users', editable: false },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const [draft, setDraft] = useState(profile);
  const [successVisible, setSuccessVisible] = useState(false);

  const update = (key: keyof typeof profile, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need access to your photos to set a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setDraft((prev) => ({ ...prev, photoUri: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need access to your camera to take a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setDraft((prev) => ({ ...prev, photoUri: result.assets[0].uri }));
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose a source',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickPhoto },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = () => {
    updateProfile(draft);
    setSuccessVisible(true);
  };

  const handleDone = () => {
    setSuccessVisible(false);
    router.back();
  };

  const avatarSource = draft.photoUri
    ? { uri: draft.photoUri }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          draft.fullName
        )}&background=FF6B35&color=fff&size=200`,
      };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Edit Profile" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={showPhotoOptions}
            activeOpacity={0.85}
          >
            <Image source={avatarSource} style={styles.avatar} />
          </TouchableOpacity>
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
                  placeholderTextColor={foodColors.textMuted}
                  editable={field.editable}
                  selectTextOnFocus={field.editable}
                />
                {!field.editable && (
                  <Feather name="lock" size={ms(14)} color={foodColors.textMuted} />
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleDone}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={handleDone} />

          <View style={styles.modalCard}>
            <View style={styles.badgeRing}>
              <View style={styles.badgeCore}>
                <Feather name="check" size={ms(30)} color="#fff" />
              </View>
            </View>

            <Text style={styles.modalTitle}>Profile Updated</Text>
            <Text style={styles.modalMessage}>Your changes have been saved successfully.</Text>

            <TouchableOpacity style={styles.modalButton} onPress={handleDone} activeOpacity={0.85}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
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
  avatarWrapper: { position: 'relative' },
  avatar: { width: ms(108), height: ms(108), borderRadius: ms(54), backgroundColor: foodColors.border },

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
  saveButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

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
    paddingBottom: ms(22),
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
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(18),
  },
  badgeCore: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: foodColors.primary,
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
});