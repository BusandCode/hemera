import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useDialog } from '../src/components/ui/DialogProvider';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

type NotificationCategory =
  | 'order_updates'
  | 'wallet_credits'
  | 'network_updates'
  | 'promotions'
  | 'third_party_updates'
  | 'eplan_subscription_updates'
  | 'ewash_subscription_updates'
  | 'chat_messages'
  | 'welcome';

type NotificationItem = {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
};

const CHAT_REPLY_MESSAGE = 'Support has replied to your live chat. Open the app to continue the conversation.';
const NOTIFICATION_COLUMNS = 'id, user_id, category, title, body, data, created_at, read_at';
const ERROR_COLOR = '#FF3B30';

function mergeNotifications(...groups: NotificationItem[][]): NotificationItem[] {
  const byId = new Map<string, NotificationItem>();
  groups.forEach((group) => group.forEach((item) => byId.set(item.id, item)));
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function formatTime(value: string): string {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return '';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return createdAt.toLocaleDateString();
}

function iconForCategory(category: NotificationCategory): keyof typeof Feather.glyphMap {
  switch (category) {
    case 'order_updates':
      return 'package';
    case 'wallet_credits':
      return 'credit-card';
    case 'network_updates':
      return 'wifi';
    case 'promotions':
      return 'tag';
    case 'third_party_updates':
      return 'truck';
    case 'eplan_subscription_updates':
      return 'calendar';
    case 'ewash_subscription_updates':
      return 'droplet';
    case 'chat_messages':
      return 'message-circle';
    case 'welcome':
      return 'heart';
  }
}

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const unread = !item.read_at;
  const message = item.category === 'chat_messages' ? CHAT_REPLY_MESSAGE : item.body;

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.iconContainer, unread && styles.iconContainerUnread]}>
        <Feather
          name={iconForCategory(item.category)}
          size={ms(18)}
          color={unread ? '#fff' : foodColors.textPrimary}
        />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          {unread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.rowMessage}>{message}</Text>
        <Text style={styles.rowTime}>{formatTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dialog = useDialog();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);
      setLoadError(null);
      setNotifications([]);

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!active) return;

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const item = payload.new as NotificationItem;
              setNotifications((current) => mergeNotifications(current, [item]));
            } else if (payload.eventType === 'DELETE') {
              const removed = payload.old as Pick<NotificationItem, 'id'>;
              setNotifications((current) => current.filter((item) => item.id !== removed.id));
            }
          }
        )
        .subscribe((status) => {
          if (!active) return;
          if (status === 'SUBSCRIBED') {
            setLoadError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setLoadError('Live updates are temporarily unavailable. Please reopen this screen to try again.');
          }
        });

      const loadNotifications = async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select(NOTIFICATION_COLUMNS)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!active) return;
        if (error) {
          console.error('[Notifications] Could not load notifications:', error);
          setLoadError('We couldn’t load your notifications. Please check your connection and try again.');
        } else {
          setNotifications((current) => mergeNotifications(data as NotificationItem[], current));
        }
        setLoading(false);
      };

      void loadNotifications();

      return () => {
        active = false;
        void supabase.removeChannel(channel);
      };
    }, [userId])
  );

  const markRead = async (item: NotificationItem) => {
    if (!userId || item.read_at) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', item.id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Notifications] Could not mark notification as read:', error);
      await dialog.alert({
        title: 'Not updated',
        message: 'We couldn’t update this notification. Please try again.',
        icon: 'wifi-off',
      });
      return;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === item.id ? { ...notification, read_at: readAt } : notification
      )
    );
  };

  const clearAll = async () => {
    if (!userId || notifications.length === 0) return;

    const confirmed = await dialog.confirm({
      title: 'Clear all notifications?',
      message: 'This will remove your notification history.',
      confirmText: 'Clear all',
      destructive: true,
      icon: 'trash-2',
    });
    if (!confirmed) return;

    const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
    if (error) {
      console.error('[Notifications] Could not clear notifications:', error);
      await dialog.alert({
        title: 'Not cleared',
        message: 'We couldn’t clear your notifications. Please try again.',
        icon: 'wifi-off',
      });
      return;
    }
    setNotifications([]);
  };

  const openNotification = (item: NotificationItem) => {
    void markRead(item);
    if (item.category === 'chat_messages') router.push('/live-chat');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(10) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={ms(24)} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAll}
            disabled={loading || notifications.length === 0}
          >
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        </View>

        {loadError && <Text style={styles.errorText}>{loadError}</Text>}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={foodColors.primary} />
          </View>
        ) : notifications.length > 0 ? (
          <View style={styles.list}>
            {notifications.map((item) => (
              <NotificationRow key={item.id} item={item} onPress={() => openNotification(item)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="bell-off" size={ms(40)} color={foodColors.textMuted} />
            <Text style={styles.emptyText}>
              {loadError ? 'Notifications are unavailable' : 'No notifications yet'}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(20) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(20),
  },
  backButton: { width: ms(40), height: ms(40), justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  clearButton: { paddingHorizontal: ms(10), paddingVertical: ms(6) },
  clearText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  errorText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: ERROR_COLOR,
    marginBottom: ms(12),
  },
  loadingState: { paddingTop: ms(80), alignItems: 'center' },
  list: {
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
    padding: ms(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: ms(12),
  },
  iconContainer: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerUnread: { backgroundColor: foodColors.primary },
  rowContent: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginBottom: ms(3),
  },
  rowTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: ms(3),
    backgroundColor: foodColors.primary,
  },
  rowMessage: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: ms(18),
    marginBottom: ms(4),
  },
  rowTime: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: ms(80),
    gap: ms(12),
  },
  emptyText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },
  bottomSpacer: { height: ms(20) },
});