import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData } from '../src/context/AppDataContext';

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={16} color={foodColors.textPrimary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={16} color={foodColors.textPrimary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: foodColors.border, true: foodColors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const { security, setBiometric, setTwoFactor } = useAppData();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Security" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Login & Payment Access</Text>
        <View style={styles.group}>
          <ActionRow
            icon="lock"
            title="Change Password"
            subtitle={`Last changed ${security.passwordLastChanged}`}
            onPress={() => router.push('/change-password' as any)}
          />
          <ActionRow
            icon="hash"
            title="Change Transaction PIN"
            subtitle={`Used to confirm E-Chop & E-Wash payments · changed ${security.pinLastChanged}`}
            onPress={() => router.push('/change-pin' as any)}
          />
          <ToggleRow
            icon="smartphone"
            title="Biometric Login"
            subtitle="Use Face ID or fingerprint to open the app"
            value={security.biometric}
            onValueChange={setBiometric}
          />
          <ToggleRow
            icon="shield"
            title="Two-Factor Authentication"
            subtitle="Extra code required when logging in on a new device"
            value={security.twoFactor}
            onValueChange={setTwoFactor}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 30 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: 8,
    marginTop: 18,
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },

  bottomSpacer: { height: 20 },
});