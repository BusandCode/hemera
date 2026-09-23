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

type Field = {
  key: 'fullName' | 'email' | 'phone' | 'gender' | 'dob';
  label: string;
  icon: keyof typeof Feather.glyphMap;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
};

const fields: Field[] = [
  { key: 'fullName', label: 'Full Name', icon: 'user' },
  { key: 'email', label: 'Email Address', icon: 'mail', keyboardType: 'email-address' },
  { key: 'phone', label: 'Phone Number', icon: 'phone', keyboardType: 'phone-pad' },
  { key: 'gender', label: 'Gender', icon: 'users' },
  { key: 'dob', label: 'Date of Birth', icon: 'calendar' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof typeof profile, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
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
      setSaved(false);
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
      setSaved(false);
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
    setSaved(true);
    setTimeout(() => router.back(), 900);
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
              <View style={styles.fieldInputWrap}>
                <Feather name={field.icon} size={16} color={foodColors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  value={draft[field.key]}
                  onChangeText={(text) => update(field.key, text)}
                  keyboardType={field.keyboardType ?? 'default'}
                  placeholderTextColor={foodColors.textMuted}
                />
              </View>
            </View>
          ))}
        </View>

        {saved && (
          <View style={styles.savedBanner}>
            <Feather name="check-circle" size={14} color={foodColors.success} />
            <Text style={styles.savedBannerText}>Profile updated successfully</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  avatarSection: { alignItems: 'center', marginBottom: 26 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 108, height: 108, borderRadius: 54, backgroundColor: foodColors.border },

  form: { gap: 16 },
  fieldBlock: {},
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: 6,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 4,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  savedBannerText: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.success,
  },

  bottomSpacer: { height: 90 },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  saveButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});