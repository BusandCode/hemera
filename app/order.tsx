import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { orderNumber, normalizeStatus } from '../src/lib/orderStatus';
import { ms } from '../src/utils/responsive';

type FlowStatus = 'picked-up' | 'processing' | 'ready' | 'out-for-delivery';

type OrderRow = {
  id: string;
  ref: string;
  status: FlowStatus;
  rawStatus: string;
  title: string;
  date: string;
  month: string;
  day: number;
  sortTime: number;
};

type StatusIcon = keyof typeof MaterialCommunityIcons.glyphMap;

const STATUS_FLOW: FlowStatus[] = ['picked-up', 'processing', 'ready', 'out-for-delivery'];

const STATUS_STYLE: Record<FlowStatus, { label: string; icon: StatusIcon; bg: string; fg: string }> = {
  'picked-up': { label: 'Picked Up', icon: 'truck', bg: '#DBEAFE', fg: '#1E3A9F' },
  processing: { label: 'Processing', icon: 'washing-machine', bg: '#DBEAFE', fg: '#1E3A9F' },
  ready: { label: 'Ready', icon: 'check-circle-outline', bg: '#E3F1E8', fg: '#1F7A4A' },
  'out-for-delivery': { label: 'Out for Delivery', icon: 'moped', bg: '#E3F1E8', fg: '#1F7A4A' },
};

function toOrder(row: any): OrderRow | null {
  const stage = normalizeStatus(row.status ?? '', 'ewash') as FlowStatus;
  if (!STATUS_FLOW.includes(stage)) return null;

  const meta = (row.metadata ?? {}) as Record<string, any>;
  if (meta.kind === 'subscription') return null;

  const d = new Date(meta.pickup_date ?? row.created_at);
  const ref = String(meta.ref ?? String(row.id).slice(0, 8).toUpperCase());

  return {
    id: row.id,
    ref,
    status: stage,
    rawStatus: row.status ?? '',
    title: meta.title ?? 'E-Wash Order',
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    sortTime: d.getTime(),
  };
}

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('orders')
      .select('id, status, metadata, created_at')
      .eq('user_id', userId)
      .eq('order_type', 'ewash')
      .order('created_at', { ascending: false });

    const list = (data ?? [])
      .map(toOrder)
      .filter((o): o is OrderRow => o !== null)
      .sort((a, b) => b.sortTime - a.sortTime);

    setOrders(list);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>In the wash</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={washColors.navySolid} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="washing-machine" size={30} color={washColors.navySolid} />
            </View>
            <Text style={styles.emptyTitle}>No orders in the wash</Text>
            <Text style={styles.emptyText}>
              Orders that have been picked up by the rider will appear here.
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const status = STATUS_STYLE[order.status];
            const stepIndex = STATUS_FLOW.indexOf(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => openOrder(order.id)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.dateTile}>
                    <Text style={styles.dateMonth}>{order.month}</Text>
                    <Text style={styles.dateDay}>{order.day}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.orderId}>Order #{orderNumber(order.ref, order.id)}</Text>
                    <Text style={styles.detail}>{order.date}</Text>
                  </View>
                  <Feather name="chevron-right" size={22} color="#8A94A3" />
                </View>

                <View style={styles.pillRow}>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <MaterialCommunityIcons name={status.icon} size={15} color={status.fg} />
                    <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.progressBar}>
                  {STATUS_FLOW.map((step, index) => (
                    <View
                      key={step}
                      style={[styles.segment, index <= stepIndex && styles.segmentReached]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: { width: 32, height: 40, justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: fonts.poppins.medium, color: washColors.textPrimary },

  sectionTitle: {
    fontSize: 22,
    fontFamily: fonts.poppins.medium,
    color: washColors.navySolid,
    marginBottom: 14,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E8E3D0',
    padding: 20,
    marginBottom: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateTile: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: { fontSize: 15, letterSpacing: 0.6, fontFamily: fonts.poppins.regular, color: washColors.navySolid },
  dateDay: { fontSize: 30, lineHeight: 36, fontFamily: fonts.poppins.medium, color: washColors.navySolid },
  cardInfo: { flex: 1 },
  orderId: { fontSize: 20, fontFamily: fonts.poppins.medium, color: washColors.navySolid },
  detail: { fontSize: 15, fontFamily: fonts.poppins.regular, color: washColors.textSecondary, marginTop: 2 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  statusText: { fontSize: 14, fontFamily: fonts.poppins.medium },

  progressBar: { flexDirection: 'row', gap: 6, marginTop: 18 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#EFE8D8' },
  segmentReached: { backgroundColor: '#5F6B77' },

  loader: { marginTop: 32 },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E8E3D0',
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});