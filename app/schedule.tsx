import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import { AppDialog } from '../src/components/AppDialog';

type Pickup = {
  id: string;
  ref: string;
  month: string;
  day: number;
  slot: string;
  sortTime: number;
};

const statusStyle = {
  label: 'Scheduled',
  icon: 'calendar' as keyof typeof MaterialCommunityIcons.glyphMap,
  bg: '#EDEEF1',
  fg: '#5F6B77',
};

// Only "scheduled" (before the rider picks up) belongs in this list.
const SCHEDULED_STATUSES = new Set(['scheduled', 'placed', 'confirmed', 'pending']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

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
  const raw = (row.status ?? '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (!SCHEDULED_STATUSES.has(raw)) return null;

  const meta = (row.metadata ?? {}) as Record<string, any>;
  if (meta.kind === 'subscription') return null;

  const when = pickupDateOf(meta, row.created_at);
  const ref = String(meta.ref ?? meta.order_number ?? String(row.id).slice(0, 8).toUpperCase());

  return {
    id: row.id,
    ref,
    month: when.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: when.getDate(),
    slot: meta.slot ?? meta.pickup_time ?? meta.pickupTime ?? '',
    sortTime: when.getTime(),
  };
}

const ui = {
  border: '#E8E3D0',
  heading: '#1E3A9F',
  blue: '#2563EB',
  dateTile: '#DBEAFE',
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

  type CancelStep = 'confirm' | 'done' | 'error';
  const [dialog, setDialog] = useState<{ step: CancelStep; pickup: Pickup; message?: string; notCancellable?: boolean } | null>(
    null
  );
  const [cancelling, setCancelling] = useState(false);

  const cancelPickup = (pickup: Pickup) => {
    setDialog({ step: 'confirm', pickup });
  };

  const closeDialog = () => {
    if (cancelling) return;
    setDialog(null);
  };

  const confirmCancel = async () => {
    if (!dialog || !userId) return;
    const { pickup } = dialog;
    setCancelling(true);
    setBusyId(pickup.id);

    const { error: cancelError } = await supabase.rpc('cancel_order', {
      p_order_id: pickup.id,
    });

    setCancelling(false);
    setBusyId(null);

    if (cancelError) {
      const notCancellable = /processed|no longer|already|picked/i.test(cancelError.message ?? '');
      setDialog({
        step: 'error',
        pickup,
        notCancellable,
        message: notCancellable
          ? 'This pickup has already been picked up, so it can no longer be cancelled here. Message support and we will help you.'
          : cancelError.message || 'This pickup could not be cancelled. Please try again.',
      });
      if (notCancellable) load();
      return;
    }

    setPickups((current) => current.filter((p) => p.id !== pickup.id));
    setDialog({ step: 'done', pickup });
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
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Schedule</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.heroMid} />
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
            <Feather name="plus" size={30} color="#fff" />
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
            <Text style={styles.emptyTitle}>No upcoming pickups</Text>
            <Text style={styles.emptyText}>Schedule a pickup and it will show up here.</Text>
          </View>
        ) : (
          pickups.map((pickup) => {
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
                        { backgroundColor: statusStyle.bg },
                        !pickup.slot && styles.statusPillNoSlot,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={statusStyle.icon}
                        size={15}
                        color={statusStyle.fg}
                      />
                      <Text style={[styles.statusText, { color: statusStyle.fg }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={22} color={ui.chevron} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => cancelPickup(pickup)}
                  disabled={busy}
                >
                  <Feather name="x-circle" size={20} color={foodColors.primary} />
                  <Text style={[styles.actionText, { color: foodColors.primary }]}>
                    Cancel pickup
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {dialog?.step === 'confirm' && (
        <AppDialog
          visible
          tone="danger"
          title="Cancel this pickup?"
          message={`Order #${dialog.pickup.ref} will be cancelled.`}
          primaryLabel="Yes, cancel pickup"
          onPrimary={confirmCancel}
          secondaryLabel="Keep pickup"
          onSecondary={closeDialog}
          loading={cancelling}
        />
      )}

      {dialog?.step === 'done' && (
        <AppDialog
          visible
          tone="success"
          title="Pickup cancelled"
          message={`Order #${dialog.pickup.ref} has been cancelled. You can schedule a new pickup anytime.`}
          primaryLabel="Done"
          onPrimary={closeDialog}
        />
      )}

      {dialog?.step === 'error' && (
        <AppDialog
          visible
          tone="error"
          title={dialog.notCancellable ? 'Pickup already picked up' : "Couldn't cancel pickup"}
          message={dialog.message}
          primaryLabel={dialog.notCancellable ? 'Request cancel via support' : 'Try again'}
          onPrimary={() => {
            if (dialog.notCancellable) {
              setDialog(null);
              requestCancelViaSupport();
            } else {
              setDialog({ step: 'confirm', pickup: dialog.pickup });
            }
          }}
          secondaryLabel="Close"
          onSecondary={closeDialog}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    elevation: 8,
    shadowColor: ui.heroMid,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  heroText: { flex: 1, paddingRight: 12 },
  heroTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: fonts.poppins.medium,
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  heroPlus: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 22,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
    marginTop: 28,
    marginBottom: 14,
    marginLeft: 4,
  },
  loader: { marginTop: 32 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
    marginBottom: 16,
  },
  cardBusy: { opacity: 0.55 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateTile: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: ui.dateTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: 15,
    letterSpacing: 0.6,
    fontFamily: fonts.poppins.regular,
    color: ui.heading,
  },
  dateDay: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  cardInfo: { flex: 1 },
  orderId: {
    fontSize: 20,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  slot: {
    fontSize: 15,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  statusPillNoSlot: { marginTop: 8 },
  statusText: {
    fontSize: 14,
    fontFamily: fonts.poppins.medium,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 16,
    marginTop: 14,
  },
  cancelButton: { borderColor: foodColors.primary },
  actionText: {
    fontSize: 18,
    fontFamily: fonts.poppins.medium,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 12 },
  retryText: { fontSize: 14, fontFamily: fonts.poppins.medium, color: ui.blue },
});