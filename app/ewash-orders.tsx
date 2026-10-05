import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { ms } from '../src/utils/responsive';

type FinishedOrder = {
  id: string;
  ref: string;
  cancelled: boolean;
  slot: string;
  month: string;
  day: number;
  dateLine: string;
  sortTime: number;
};

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const FINISHED = new Set([
  'delivered',
  'completed',
  'complete',
  'fulfilled',
  'cancelled',
  'canceled',
]);

const CANCELLED = new Set(['cancelled', 'canceled']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function dateOf(meta: Record<string, any>, createdAt: string) {
  const candidates = [meta.pickup_date, meta.pickupDate, meta.pickup_at, meta.date];
  for (const c of candidates) {
    if (typeof c === 'string' && ISO_DATE.test(c)) {
      const d = new Date(c);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date(createdAt);
}

export default function EwashOrdersScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [orders, setOrders] = useState<FinishedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([]);
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
      const list: FinishedOrder[] = [];
      for (const row of data ?? []) {
        const raw = String(row.status ?? '').toLowerCase().trim().replace(/[\s_]+/g, '-');
        if (!FINISHED.has(raw)) continue;

        const meta = (row.metadata ?? {}) as Record<string, any>;
        if (meta.kind === 'subscription') continue;

        const d = dateOf(meta, row.created_at);
        const ref = String(meta.ref ?? String(row.id).slice(0, 8).toUpperCase());
        const cancelled = CANCELLED.has(raw);

        list.push({
          id: row.id,
          ref,
          cancelled,
          slot: String(meta.slot ?? meta.pickup_time ?? meta.pickupTime ?? ''),
          month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
          day: d.getDate(),
          dateLine: d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          sortTime: d.getTime(),
        });
      }
      list.sort((a, b) => b.sortTime - a.sortTime);
      setOrders(list);
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="E-Wash Orders" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={foodColors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={foodColors.primary} />
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Couldn't load your orders</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.linkText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>No finished E-Wash orders</Text>
            <Text style={styles.stateText}>
              Delivered and cancelled laundry orders will show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {orders.map((order) => {
              const cancelled = order.cancelled;
              const statusLabel = cancelled ? 'Cancelled' : 'Delivered';
              const statusBg = cancelled ? 'rgba(255,59,48,0.10)' : 'rgba(31,122,74,0.10)';
              const statusFg = cancelled ? '#FF3B30' : '#1F7A4A';
              const statusIcon: IconName = cancelled
                ? 'close-circle-outline'
                : 'check-circle-outline';

              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({ pathname: '/order-details', params: { id: order.id } } as any)
                  }
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.dateTile, cancelled && styles.dateTileCancelled]}>
                      <Text style={[styles.dateMonth, cancelled && styles.dateTextCancelled]}>
                        {order.month}
                      </Text>
                      <Text style={[styles.dateDay, cancelled && styles.dateTextCancelled]}>
                        {order.day}
                      </Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.orderId}>Order #{order.ref}</Text>
                      {!!order.slot && <Text style={styles.slot}>{order.slot}</Text>}
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: statusBg },
                          !order.slot && styles.statusPillNoSlot,
                        ]}
                      >
                        <MaterialCommunityIcons name={statusIcon} size={14} color={statusFg} />
                        <Text style={[styles.statusText, { color: statusFg }]}>{statusLabel}</Text>
                      </View>
                    </View>

                    <Feather name="chevron-right" size={ms(22)} color={foodColors.textMuted} />
                  </View>

                  <View style={styles.footer}>
                    <Feather name="calendar" size={ms(13)} color={foodColors.textSecondary} />
                    <Text style={styles.footerText}>{order.dateLine}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  content: { paddingHorizontal: '5.5%', paddingTop: ms(4), paddingBottom: ms(16) },
  list: { gap: ms(12) },
  loader: { marginTop: ms(48) },

  card: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(20),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
  },
  dateTile: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(18),
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTileCancelled: { backgroundColor: '#F4F5F7' },
  dateMonth: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.badgeBlue,
    letterSpacing: 0.4,
  },
  dateDay: {
    fontSize: ms(24),
    lineHeight: ms(28),
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },
  dateTextCancelled: { color: foodColors.textSecondary },
  cardInfo: { flex: 1, minWidth: 0 },
  orderId: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  slot: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(3),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: ms(6),
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: ms(12),
    marginTop: ms(8),
  },
  statusPillNoSlot: { marginTop: ms(8) },
  statusText: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.bold,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginTop: ms(14),
    paddingTop: ms(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textSecondary,
  },

  stateBox: { alignItems: 'center', marginTop: ms(48), paddingHorizontal: ms(12) },
  stateTitle: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontSize: ms(13),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(6),
  },
  linkBtn: { marginTop: ms(16), paddingVertical: ms(8), paddingHorizontal: ms(12) },
  linkText: { fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },
  bottomSpacer: { height: ms(20) },
});