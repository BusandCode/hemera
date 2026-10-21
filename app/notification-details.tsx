// One notification, in full: what it's about, when it arrived, the whole message, and a
// button to the thing it refers to (order, wallet, live chat). Opening it marks it as read.
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useDialog } from '../src/components/ui/DialogProvider';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

type Notif = {
  id: string;
  category: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
};

const CHAT_REPLY_MESSAGE = 'Support has replied to your live chat. Open the app to continue the conversation.';

const CATEGORY: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  order_updates: { label: 'Order update', icon: 'package' },
  wallet_credits: { label: 'Wallet', icon: 'credit-card' },
  network_updates: { label: 'Service update', icon: 'wifi' },
  promotions: { label: 'Offer', icon: 'tag' },
  third_party_updates: { label: 'Delivery', icon: 'truck' },
  eplan_subscription_updates: { label: 'E-Plan', icon: 'calendar' },
  ewash_subscription_updates: { label: 'E-Wash plan', icon: 'droplet' },
  chat_messages: { label: 'Live chat', icon: 'message-circle' },
  welcome: { label: 'Welcome', icon: 'heart' },
};

type Action = { label: string; icon: keyof typeof Feather.glyphMap; onPress: () => void; primary?: boolean };

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

function fullDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dialog = useDialog();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [notif, setNotif] = useState<Notif | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId || !id) {
        setLoading(false);
        setMissing(true);
        return;
      }
      let active = true;
      setLoading(true);
      (async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, category, title, body, data, created_at, read_at')
          .eq('id', id)
          .eq('user_id', userId)
          .maybeSingle();
        if (!active) return;
        if (error || !data) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setNotif(data as Notif);
        setMissing(false);
        setLoading(false);
        if (!(data as Notif).read_at) {
          const readAt = new Date().toISOString();
          const { error: readError } = await supabase
            .from('notifications')
            .update({ read_at: readAt })
            .eq('id', id)
            .eq('user_id', userId);
          if (!readError && active) setNotif((n) => (n ? { ...n, read_at: readAt } : n));
        }
      })();
      return () => {
        active = false;
      };
    }, [id, userId])
  );

  const remove = async () => {
    if (!notif || !userId) return;
    const ok = await dialog.confirm({
      title: 'Delete this notification?',
      message: 'It will be removed from your notifications.',
      confirmText: 'Delete',
      destructive: true,
      icon: 'trash-2',
    });
    if (!ok) return;
    const { error } = await supabase.from('notifications').delete().eq('id', notif.id).eq('user_id', userId);
    if (error) {
      await dialog.alert({ title: 'Not deleted', message: 'Please try again.', icon: 'wifi-off' });
      return;
    }
    router.back();
  };

  const data = notif?.data ?? {};
  const meta = CATEGORY[notif?.category ?? ''] ?? { label: 'Notification', icon: 'bell' as const };
  const message = notif?.category === 'chat_messages' ? CHAT_REPLY_MESSAGE : notif?.body ?? '';
  const orderId = str(data.order_id);
  const orderRef = str(data.ref);
  const promoCode = str(data.code ?? data.promo_code);
  const kind = str(data.kind).toLowerCase();
  const aboutWallet =
    notif?.category === 'wallet_credits' ||
    !!data.withdrawal_id ||
    kind === 'refund' ||
    /refund|wallet|withdraw/i.test(`${notif?.title ?? ''} ${notif?.body ?? ''}`);

  const actions: Action[] = [];
  if (orderId) {
    actions.push({
      label: 'View order',
      icon: 'package',
      primary: true,
      onPress: () => router.push({ pathname: '/order-details', params: { id: orderId } } as any),
    });
  }
  if (aboutWallet) {
    actions.push({
      label: 'Open wallet',
      icon: 'credit-card',
      primary: actions.length === 0,
      onPress: () => router.push('/wallet' as any),
    });
  }
  if (notif?.category === 'chat_messages') {
    actions.push({ label: 'Open live chat', icon: 'message-circle', primary: true, onPress: () => router.push('/live-chat' as any) });
  }
  if (promoCode) {
    actions.push({
      label: copied ? 'Copied' : `Copy code ${promoCode}`,
      icon: copied ? 'check' : 'copy',
      primary: actions.length === 0,
      onPress: async () => {
        await Clipboard.setStringAsync(promoCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={ms(24)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <TouchableOpacity style={styles.headerButton} onPress={remove} disabled={!notif}>
          <Feather name="trash-2" size={ms(20)} color={notif ? foodColors.textSecondary : 'transparent'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={foodColors.primary} />
        </View>
      ) : missing || !notif ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Feather name="bell-off" size={ms(28)} color={foodColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Notification not found</Text>
          <Text style={styles.emptyText}>It may have been deleted.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Back to notifications</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + ms(32) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.iconWrap}>
                <Feather name={meta.icon} size={ms(22)} color={foodColors.primary} />
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{meta.label}</Text>
              </View>
            </View>

            <Text style={styles.title}>{notif.title}</Text>
            <View style={styles.dateRow}>
              <Feather name="clock" size={ms(13)} color={foodColors.textMuted} />
              <Text style={styles.date}>{fullDate(notif.created_at)}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.body}>{message}</Text>

            {(orderRef || orderId) && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Order</Text>
                <Text style={styles.infoValue}>#{orderRef || orderId.slice(0, 8).toUpperCase()}</Text>
              </View>
            )}
          </View>

          {actions.length > 0 && (
            <View style={styles.actions}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.label}
                  activeOpacity={0.85}
                  style={[styles.action, a.primary ? styles.actionPrimary : styles.actionSecondary]}
                  onPress={a.onPress}
                >
                  <Feather name={a.icon} size={ms(18)} color={a.primary ? '#fff' : foodColors.textPrimary} />
                  <Text style={[styles.actionText, a.primary && styles.actionTextPrimary]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingBottom: ms(12),
  },
  headerButton: { width: ms(40), height: ms(40), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  content: { paddingHorizontal: ms(20), paddingTop: ms(8) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(32), gap: ms(8) },
  card: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(20),
    padding: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(14),
    backgroundColor: foodColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: foodColors.background,
    borderRadius: ms(20),
    paddingHorizontal: ms(12),
    paddingVertical: ms(5),
  },
  chipText: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
  title: {
    marginTop: ms(16),
    fontSize: ms(20),
    lineHeight: ms(28),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: ms(6), marginTop: ms(6) },
  date: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  divider: { height: 1, backgroundColor: foodColors.border, marginVertical: ms(16) },
  body: {
    fontSize: ms(15),
    lineHeight: ms(23),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  infoBox: {
    marginTop: ms(16),
    backgroundColor: foodColors.background,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  infoValue: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  actions: { marginTop: ms(16), gap: ms(10) },
  action: {
    height: ms(52),
    borderRadius: ms(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
  },
  actionPrimary: { backgroundColor: foodColors.primary },
  actionSecondary: { backgroundColor: foodColors.surface, borderWidth: 1, borderColor: foodColors.border },
  actionText: { fontSize: ms(15), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  actionTextPrimary: { color: '#fff' },
  emptyIcon: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: foodColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(8),
  },
  emptyTitle: { fontSize: ms(16), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  emptyText: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  emptyButton: {
    marginTop: ms(12),
    backgroundColor: foodColors.primary,
    borderRadius: ms(12),
    paddingHorizontal: ms(20),
    paddingVertical: ms(12),
  },
  emptyButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: '#fff' },
});
