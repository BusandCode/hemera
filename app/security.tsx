import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData } from '../src/context/AppDataContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

type PinStatus = {
  loaded: boolean;
  hasPin: boolean;
  changedAt: string | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={ms(16)} color={foodColors.textPrimary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={ms(18)} color={foodColors.textMuted} />
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
        <Feather name={icon} size={ms(16)} color={foodColors.textPrimary} />
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
  const [pin, setPin] = useState<PinStatus>({ loaded: false, hasPin: false, changedAt: null });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const { data } = await supabase.rpc('get_pin_status');
          if (!active) return;
          setPin({
            loaded: true,
            hasPin: data?.has_pin === true,
            changedAt: data?.changed_at ?? null,
          });
        } catch {
          if (active) setPin((p) => ({ ...p, loaded: true }));
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const pinTitle = !pin.loaded ? 'PIN' : pin.hasPin ? 'Change PIN' : 'Set PIN';
  const pinSubtitle = !pin.loaded
    ? undefined
    : pin.hasPin
      ? `Used to confirm E-Chop & E-Wash payments${
          pin.changedAt ? ` · changed ${formatDate(pin.changedAt)}` : ''
        }`
      : 'Create a 4-digit PIN to confirm payments and unlock the app';

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
            title={pinTitle}
            subtitle={pinSubtitle}
            disabled={!pin.loaded}
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
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(30) },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: ms(8),
    marginTop: ms(18),
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
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
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  iconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },

  bottomSpacer: { height: ms(20) },
});