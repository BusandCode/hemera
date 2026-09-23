import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type ToggleKey =
  | 'orderUpdates'
  | 'promotions'
  | 'chatMessages'
  | 'pushEnabled'
  | 'emailEnabled'
  | 'smsEnabled';

type ToggleDef = {
  key: ToggleKey;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
};

const activityToggles: ToggleDef[] = [
  { key: 'orderUpdates', icon: 'package', title: 'Order Updates', subtitle: 'Status changes for E-Chop & E-Wash orders' },
  { key: 'promotions', icon: 'tag', title: 'Promotions & Offers', subtitle: 'Discounts, deals, and new features' },
  { key: 'chatMessages', icon: 'message-circle', title: 'Chat Messages', subtitle: 'Replies from support and riders' },
];

const channelToggles: ToggleDef[] = [
  { key: 'pushEnabled', icon: 'bell', title: 'Push Notifications', subtitle: 'Alerts on this device' },
  { key: 'emailEnabled', icon: 'mail', title: 'Email', subtitle: 'Sent to suleiman@example.com' },
  { key: 'smsEnabled', icon: 'message-square', title: 'SMS', subtitle: 'Sent to +234 803 123 4567' },
];

export default function NotificationSettingsScreen() {
  const [values, setValues] = useState<Record<ToggleKey, boolean>>({
    orderUpdates: true,
    promotions: true,
    chatMessages: true,
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: true,
  });

  const toggle = (key: ToggleKey) => {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderGroup = (items: ToggleDef[]) => (
    <View style={styles.group}>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={styles.iconWrap}>
            <Feather name={item.icon} size={16} color={foodColors.textPrimary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Switch
            value={values[item.key]}
            onValueChange={() => toggle(item.key)}
            trackColor={{ false: foodColors.border, true: foodColors.primary }}
            thumbColor="#fff"
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Notifications" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>What you're notified about</Text>
        {renderGroup(activityToggles)}

        <Text style={styles.sectionLabel}>How you're notified</Text>
        {renderGroup(channelToggles)}

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
    marginTop: 16,
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