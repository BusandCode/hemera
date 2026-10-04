// app/personal-information.tsx
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useProfile } from '../src/context/ProfileContext';
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

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  const avatarSource = profile.photoUri
    ? { uri: profile.photoUri }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          profile.fullName
        )}&background=FF6B35&color=fff&size=120`,
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
          <Image source={avatarSource} style={styles.avatar} />
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  avatarSection: { alignItems: 'center', marginBottom: ms(26) },
  avatar: { width: ms(92), height: ms(92), borderRadius: ms(46), backgroundColor: foodColors.border },
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

  bottomSpacer: { height: ms(20) },
});