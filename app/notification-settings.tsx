import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

type ToggleKey =
  | 'order_updates'
  | 'promotions'
  | 'chat_messages'
  | 'push_enabled'
  | 'email_enabled'
  | 'sms_enabled';

type Values = Record<ToggleKey, boolean>;

type ToggleDef = {
  key: ToggleKey;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
};

// Same as the column defaults in Supabase: everything on, SMS off.
const DEFAULTS: Values = {
  order_updates: true,
  promotions: true,
  chat_messages: true,
  push_enabled: true,
  email_enabled: true,
  sms_enabled: false,
};

const COLUMNS = Object.keys(DEFAULTS).join(', ');

export default function NotificationSettingsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const email = session?.user.email ?? '';
  const phone = (session?.user.user_metadata?.phone as string | undefined) ?? '';

  const [values, setValues] = useState<Values>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  // Load the user's saved choices every time the screen opens.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      (async () => {
        const { data } = await supabase
          .from('notification_settings')
          .select(COLUMNS)
          .eq('user_id', userId)
          .maybeSingle();
        if (!active) return;
        setValues(data ? { ...DEFAULTS, ...(data as Partial<Values>) } : DEFAULTS);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [userId])
  );

  // Save only the toggle the user tapped. Show the change straight away,
  // and put it back if saving fails.
  const toggle = async (key: ToggleKey) => {
    if (!userId) return;
    const next = !values[key];
    setValues((prev) => ({ ...prev, [key]: next }));

    const { error } = await supabase
      .from('notification_settings')
      .upsert({ user_id: userId, [key]: next }, { onConflict: 'user_id' });

    if (error) {
      console.log('notification save error:', error);
      setValues((prev) => ({ ...prev, [key]: !next }));
      Alert.alert('Not saved', 'We couldn’t save that change. Please check your connection and try again.');
    }
  };

  const activityToggles: ToggleDef[] = [
    { key: 'order_updates', icon: 'package', title: 'Order Updates', subtitle: 'Status changes for E-Chop & E-Wash orders' },
    { key: 'promotions', icon: 'tag', title: 'Promotions & Offers', subtitle: 'Discounts, deals, and new features' },
    { key: 'chat_messages', icon: 'message-circle', title: 'Chat Messages', subtitle: 'Replies from support and riders' },
  ];

  const channelToggles: ToggleDef[] = [
    { key: 'push_enabled', icon: 'bell', title: 'Push Notifications', subtitle: 'Alerts on this device' },
    { key: 'email_enabled', icon: 'mail', title: 'Email', subtitle: email ? `Sent to ${email}` : 'Sent to your email' },
    { key: 'sms_enabled', icon: 'message-square', title: 'SMS', subtitle: phone ? `Sent to ${phone}` : 'Sent to your phone number' },
  ];

  const renderGroup = (items: ToggleDef[]) => (
    <View style={styles.group}>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={styles.iconWrap}>
            <Feather name={item.icon} size={ms(16)} color={foodColors.textPrimary} />
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={foodColors.primary} />
        </View>
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(30) },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: ms(8),
    marginTop: ms(16),
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