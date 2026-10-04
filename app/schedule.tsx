import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { ms } from '../src/utils/responsive';

type PickupStatus = 'scheduled' | 'picked-up' | 'processing' | 'ready' | 'out-for-delivery';

type Pickup = {
  id: string; // the order's uuid, used for navigation and updates
  ref: string; // short number shown to the customer
  month: string;
  day: number;
  slot: string;
  status: PickupStatus;
  sortTime: number;
};

type StatusIcon = keyof typeof MaterialCommunityIcons.glyphMap;

const STATUS_STYLE: Record<
  PickupStatus,
  { label: string; icon: StatusIcon; bg: string; fg: string }
> = {
  scheduled: { label: 'Scheduled', icon: 'calendar', bg: '#EDEEF1', fg: '#5F6B77' },
  'picked-up': { label: 'Picked Up', icon: 'truck', bg: '#DBEAFE', fg: '#1E3A9F' },
  processing: { label: 'Processing', icon: 'washing-machine', bg: '#DBEAFE', fg: '#1E3A9F' },
  ready: { label: 'Ready', icon: 'check-circle-outline', bg: '#E3F1E8', fg: '#1F7A4A' },
  'out-for-delivery': { label: 'Out for Delivery', icon: 'moped', bg: '#E3F1E8', fg: '#1F7A4A' },
};

// Statuses that mean the order is finished, so it isn't "upcoming" any more.
const FINISHED = new Set([
  'delivered',
  'completed',
  'complete',
  'fulfilled',
  'cancelled',
  'canceled',
  'failed',
  'rejected',
  'refunded',
]);

function toPickupStatus(raw: string | null): PickupStatus | null {
  const s = (raw ?? '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (FINISHED.has(s)) return null;
  switch (s) {
    case 'scheduled':
    case 'placed':
    case 'confirmed':
    case 'pending':
      return 'scheduled';
    case 'picked-up':
      return 'picked-up';
    case 'ready':
      return 'ready';
    case 'out-for-delivery':
    case 'on-the-way':
      return 'out-for-delivery';
    default:
      return 'processing'; // in-progress, active, processing...
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

// Uses the saved pickup date when it's stored as an ISO date; otherwise falls back
// to when the order was placed.
function pickupDateOf(meta: Record<string, any>, createdAt: string) {
  const candidates = [meta.pickup_date, meta.pickupDate, meta.pickup_at, meta.date];
  for (const c of candidates) {
    if (typeof c === 'string' && ISO_DATE.test(c)) {
      const d = new Date(c);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date(createdAt);
}

function toPickup(row: any): Pickup | null {
  const status = toPickupStatus(row.status);
  if (!status) return null;

  const meta = (row.metadata ?? {}) as Record<string, any>;
  const when = pickupDateOf(meta, row.created_at);
  const ref = String(meta.ref ?? meta.order_number ?? String(row.id).slice(0, 8).toUpperCase());

  return {
    id: row.id,
    ref,
    month: when.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: when.getDate(),
    slot: meta.slot ?? meta.pickup_time ?? meta.pickupTime ?? '',
    status,
    sortTime: when.getTime(),
  };
}

const ui = {
  border: '#E8E3D0',
  heading: '#1E3A9F',
  blue: '#2563EB',
  dateTile: '#DBEAFE',
  slate: '#5F6B77',
  chevron: '#8A94A3',
  noticeBg: '#FBF1D5',
  noticeText: '#1E3A9F',
  noticeIcon: '#E0A91F',
  heroStart: '#1E3FAE',
  heroMid: '#2563EB',
  heroEnd: '#5B9BF5',
};

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setPickups([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, status, metadata, created_at')
      .eq('user_id', userId)
      .eq('order_type', 'ewash')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      const list = (data ?? [])
        .map(toPickup)
        .filter((p): p is Pickup => p !== null)
        .sort((a, b) => a.sortTime - b.sortTime);
      setPickups(list);
      setError(null);
    }
    setLoading(false);
  }, [userId]);

  // Reload whenever the screen comes back into view, so a pickup that was just
  // scheduled shows up straight away.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const openOrder = (id: string) => {
    router.push({ pathname: '/order-details', params: { id } } as any);
  };

  const cancelPickup = (pickup: Pickup) => {
    Alert.alert('Cancel pickup?', `Order #${pickup.ref} will be cancelled.`, [
      { text: 'Keep pickup', style: 'cancel' },
      {
        text: 'Cancel pickup',
        style: 'destructive',
        onPress: async () => {
          if (!userId) return;
          setBusyId(pickup.id);
          const { data, error: updateError } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', pickup.id)
            .eq('user_id', userId)
            .select('id');
          setBusyId(null);

          if (updateError || !data || data.length === 0) {
            Alert.alert(
              "Couldn't cancel pickup",
              updateError?.message ?? 'This pickup could not be cancelled. Please try again.'
            );
            return;
          }
          setPickups((current) => current.filter((p) => p.id !== pickup.id));
        },
      },
    ]);
  };

  const requestCancelViaSupport = () => {
    router.push('/contact-support' as any);
  };

  const hasPickups = useMemo(() => pickups.length > 0, [pickups]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.85}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Schedule</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ui.heroMid}
          />
        }
      >
        <LinearGradient
          colors={[ui.heroStart, ui.heroMid, ui.heroEnd]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.hero}
        >
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Schedule a pickup</Text>
            <Text style={styles.heroSubtitle}>Pick a date and time, we handle the rest.</Text>
          </View>
          <TouchableOpacity
            style={styles.heroPlus}
            onPress={() => router.push('/pickup-options' as any)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={ms(30)} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Upcoming pickups</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={ui.heroMid} />
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Couldn't load your pickups</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : !hasPickups ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No upcoming orders</Text>
            <Text style={styles.emptyText}>Schedule a pickup and it will show up here.</Text>
          </View>
        ) : (
          pickups.map((pickup) => {
            const status = STATUS_STYLE[pickup.status];
            const locked = pickup.status !== 'scheduled';
            const busy = busyId === pickup.id;

            return (
              <View key={pickup.id} style={[styles.card, busy && styles.cardBusy]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.cardTop}
                  onPress={() => openOrder(pickup.id)}
                >
                  <View style={styles.dateTile}>
                    <Text style={styles.dateMonth}>{pickup.month}</Text>
                    <Text style={styles.dateDay}>{pickup.day}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.orderId}>Order #{pickup.ref}</Text>
                    {!!pickup.slot && <Text style={styles.slot}>{pickup.slot}</Text>}
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: status.bg },
                        !pickup.slot && styles.statusPillNoSlot,
                      ]}
                    >
                      <MaterialCommunityIcons name={status.icon} size={ms(15)} color={status.fg} />
                      <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={ms(22)} color={ui.chevron} />
                </TouchableOpacity>

                {locked ? (
                  <>
                    <View style={styles.notice}>
                      <Feather name="headphones" size={ms(18)} color={ui.noticeIcon} />
                      <Text style={styles.noticeText}>
                        Already with our team — message support to request a cancel.
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.actionButton, styles.supportButton]}
                      onPress={requestCancelViaSupport}
                    >
                      <Feather name="message-square" size={ms(20)} color={ui.blue} />
                      <Text style={[styles.actionText, { color: ui.blue }]}>Request cancel via support</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => cancelPickup(pickup)}
                    disabled={busy}
                  >
                    <Feather name="x-circle" size={ms(20)} color={foodColors.primary} />
                    <Text style={[styles.actionText, { color: foodColors.primary }]}>Cancel pickup</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(16), paddingTop: ms(16) },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    gap: ms(10),
  },
  backButton: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: ms(24),
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: ms(28),
    paddingHorizontal: ms(24),
    paddingVertical: ms(28),
    elevation: 8,
    shadowColor: ui.heroMid,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: ms(8) },
  },
  heroText: { flex: 1, paddingRight: ms(12) },
  heroTitle: {
    fontSize: ms(26),
    lineHeight: ms(34),
    fontFamily: fonts.poppins.medium,
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: ms(15),
    lineHeight: ms(22),
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: ms(4),
  },
  heroPlus: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: foodColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  sectionTitle: {
    fontSize: ms(22),
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
    marginTop: ms(28),
    marginBottom: ms(14),
    marginLeft: ms(4),
  },
  loader: { marginTop: ms(32) },

  card: {
    backgroundColor: '#fff',
    borderRadius: ms(26),
    borderWidth: 1,
    borderColor: ui.border,
    padding: ms(16),
    marginBottom: ms(16),
  },
  cardBusy: { opacity: 0.55 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
  },
  dateTile: {
    width: ms(78),
    height: ms(78),
    borderRadius: ms(20),
    backgroundColor: ui.dateTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: ms(15),
    letterSpacing: 0.6,
    fontFamily: fonts.poppins.regular,
    color: ui.heading,
  },
  dateDay: {
    fontSize: ms(30),
    lineHeight: ms(36),
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  cardInfo: { flex: 1 },
  orderId: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  slot: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
    marginBottom: ms(8),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: ms(8),
    paddingHorizontal: ms(14),
    paddingVertical: ms(7),
    borderRadius: ms(16),
  },
  statusPillNoSlot: { marginTop: ms(8) },
  statusText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.medium,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: ui.noticeBg,
    borderRadius: ms(16),
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
    marginTop: ms(14),
  },
  noticeText: {
    flex: 1,
    fontSize: ms(15),
    lineHeight: ms(22),
    fontFamily: fonts.poppins.regular,
    color: ui.noticeText,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(10),
    borderRadius: ms(24),
    borderWidth: 1.5,
    paddingVertical: ms(16),
    marginTop: ms(14),
  },
  cancelButton: { borderColor: foodColors.primary },
  supportButton: { borderColor: ui.blue },
  actionText: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.medium,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: ms(26),
    borderWidth: 1,
    borderColor: ui.border,
    padding: ms(24),
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(4),
    textAlign: 'center',
  },
  retryBtn: { marginTop: ms(14), paddingVertical: ms(8), paddingHorizontal: ms(12) },
  retryText: { fontSize: ms(14), fontFamily: fonts.poppins.medium, color: ui.blue },
});