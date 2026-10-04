import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

type StepIcon = keyof typeof MaterialCommunityIcons.glyphMap;

type OrderLine = {
  id?: string;
  name: string;
  qty: number;
  price?: number;
};

type DetailedOrder = {
  id: string;
  ref: string;
  title: string;
  status: string;
  created_at: string;
  order_type: string;
  total: number;
  subtotal: number;
  discount: number;
  payment_method?: string;
  address?: string;
  slot?: string;
  items: OrderLine[];
};

type Step = {
  key: string;
  title: string;
  description: string;
  icon: StepIcon;
};

const ui = {
  border: '#E8E3D0',
  slate: '#5F6B77',
  pillBg: '#EDEEF1',
  circleIdle: '#EFE8D8',
  iconIdle: '#F8F4EA',
  line: '#EFE8D8',
  titleIdle: '#A3A8B4',
  blue: '#2253C9',
  blueTileSoft: '#E6EDFF',
};

const statusSteps: Record<string, Step[]> = {
  echop: [
    { key: 'received', title: 'Order Received', description: 'We have your order.', icon: 'receipt' },
    { key: 'preparing', title: 'Preparing', description: 'Your meal is being cooked.', icon: 'chef-hat' },
    { key: 'ready', title: 'Ready', description: 'Your order is ready for pickup.', icon: 'check-circle-outline' },
    { key: 'picked-up', title: 'Picked Up', description: 'Rider has picked up your order.', icon: 'moped' },
    { key: 'out-for-delivery', title: 'Out for Delivery', description: 'On the way to you.', icon: 'moped' },
    { key: 'delivered', title: 'Delivered', description: 'Enjoy your meal!', icon: 'check-circle-outline' },
  ],
  ewash: [
    { key: 'scheduled', title: 'Scheduled', description: 'Your pickup is booked.', icon: 'calendar' },
    { key: 'picked-up', title: 'Picked Up', description: 'Your laundry has been picked up.', icon: 'truck' },
    { key: 'processing', title: 'Processing', description: 'Your clothes are being cleaned.', icon: 'washing-machine' },
    { key: 'ready', title: 'Ready', description: 'Clean and ready for pickup.', icon: 'check-circle-outline' },
    { key: 'out-for-delivery', title: 'Out for Delivery', description: 'On its way back to you.', icon: 'moped' },
    { key: 'delivered', title: 'Delivered', description: 'Delivered. Enjoy!', icon: 'check-circle-outline' },
  ],
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString()}`;
}

function normalizeStatus(raw: string, orderType: string) {
  const status = raw.toLowerCase().replace(/\s+/g, '-');
  const aliases: Record<string, string> = {
    'in-progress': orderType === 'ewash' ? 'processing' : 'preparing',
    picked_up: 'picked-up',
    out_for_delivery: 'out-for-delivery',
    'on-the-way': 'out-for-delivery',
    completed: 'delivered',
    placed: orderType === 'ewash' ? 'scheduled' : 'received',
    confirmed: orderType === 'ewash' ? 'scheduled' : 'received',
    active: orderType === 'ewash' ? 'processing' : 'preparing',
  };
  return aliases[status] ?? status;
}

const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled', 'failed', 'rejected', 'refunded'];

function isCancelledStatus(raw: string) {
  return CANCELLED_STATUSES.includes(raw.toLowerCase().trim());
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseOrder(raw: any): DetailedOrder {
  const meta = raw?.metadata ?? {};
  const baseTitle = meta.title ?? (raw.order_type === 'ewash' ? 'E-Wash Order' : 'E-Chop Order');
  const lines = Array.isArray(meta.lines)
    ? meta.lines.map((item: any) => ({
        id: item?.id ?? `${item?.name ?? 'item'}-${Math.random()}`,
        name: item?.name ?? 'Item',
        qty: Number(item?.qty ?? 1),
        price: Number(item?.price ?? 0),
      }))
    : [];

  const subtotalValue = Number(meta.subtotal ?? (meta.total ?? 0));
  const totalValue = Number(meta.total ?? (raw.total_kobo ? raw.total_kobo / 100 : subtotalValue));

  return {
    id: raw.id,
    ref: meta.ref ?? raw.id,
    title: baseTitle,
    status: raw.status ?? 'placed',
    created_at: raw.created_at ?? new Date().toISOString(),
    order_type: raw.order_type ?? 'echop',
    total: totalValue,
    subtotal: subtotalValue,
    discount: Number(meta.discount ?? 0),
    payment_method: meta.payment_method ?? 'transfer',
    address: meta.address ?? '',
    slot: meta.slot ?? '',
    items: lines.length > 0 ? lines : [{ name: 'Order item', qty: 1, price: totalValue }],
  };
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [order, setOrder] = useState<DetailedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      // The id is normally the order's uuid. Short order numbers (like 239604) are
      // matched against the order reference instead, because Postgres rejects a
      // non-uuid value on the uuid id column.
      const orderId = String(Array.isArray(id) ? id[0] : id).trim();
      const base = supabase
        .from('orders')
        .select('id, order_type, status, total_kobo, metadata, created_at');

      const { data, error: queryError } = await (UUID_RE.test(orderId)
        ? base.eq('id', orderId)
        : base.eq('metadata->>ref', orderId)
      )
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('This order could not be found.');
        setLoading(false);
        return;
      }

      setOrder(parseOrder(data));
      setLoading(false);
    };

    load();
  }, [id]);

  const steps = useMemo(() => {
    if (!order) return statusSteps.echop;
    return statusSteps[order.order_type] ?? statusSteps.echop;
  }, [order]);

  const cancelled = useMemo(() => !!order && isCancelledStatus(order.status), [order]);

  const currentStep = useMemo(() => {
    if (!order) return 0;
    if (cancelled) return -1; // nothing on the timeline was reached
    const statusKey = normalizeStatus(order.status, order.order_type);
    const index = steps.findIndex((step) => step.key === statusKey);
    return index >= 0 ? index : 0;
  }, [order, steps, cancelled]);

  const totalItems = useMemo(
    () => (order?.items ?? []).reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [order]
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}> 
        <StatusBar style="dark" />
        <View style={styles.headerRow}> 
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={ms(24)} color={washColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Order details</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={washColors.navySolid} size="small" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}> 
        <StatusBar style="dark" />
        <View style={styles.headerRow}> 
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={ms(24)} color={washColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Order details</Text>
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>{error ?? 'Order not found'}</Text>
        </View>
      </View>
    );
  }

  const statusLabel = cancelled ? 'Cancelled' : steps[currentStep]?.title ?? steps[0].title;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}> 
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={ms(24)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Order details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <Text style={styles.orderNumber}>Order #{order.ref}</Text>
            <View style={styles.statusPill}>
              <Feather name={cancelled ? 'x-circle' : 'calendar'} size={ms(15)} color={ui.slate} />
              <Text style={styles.statusPillText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.summaryTitle}>{order.title}</Text>
          <Text style={styles.placed}>Placed {formatDate(order.created_at)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={[styles.card, styles.timelineCard]}>
          {steps.map((step, index) => {
            const reached = index <= currentStep;
            const isLast = index === steps.length - 1;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepCircle, reached && styles.stepCircleReached]}>
                    <MaterialCommunityIcons
                      name={step.icon}
                      size={ms(21)}
                      color={reached ? '#fff' : ui.iconIdle}
                    />
                  </View>
                  {!isLast && (
                    <View style={[styles.stepLine, index < currentStep && styles.stepLineReached]} />
                  )}
                </View>

                <View style={[styles.stepBody, !isLast && styles.stepBodySpacing]}>
                  <Text style={[styles.stepTitle, reached && styles.stepTitleReached]}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Delivery info</Text>
        <View style={[styles.card, styles.detailsCard]}>
          {order.address ? (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}><Feather name="map-pin" size={ms(20)} color={washColors.textPrimary} /></View>
                <View style={styles.detailBody}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{order.address}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
            </>
          ) : null}

          {order.slot ? (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}><Feather name="clock" size={ms(20)} color={washColors.textPrimary} /></View>
                <View style={styles.detailBody}>
                  <Text style={styles.detailLabel}>Time slot</Text>
                  <Text style={styles.detailValue}>{order.slot}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
            </>
          ) : null}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><MaterialCommunityIcons name="credit-card" size={ms(20)} color={washColors.textPrimary} /></View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>Payment method</Text>
              <Text style={styles.detailValue}>{order.payment_method ? order.payment_method : 'Transfer'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Items ({totalItems})</Text>
        <View style={[styles.card, styles.itemsCard]}>
          {order.items.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.itemRow}>
              <View style={styles.itemIconTile}>
                <MaterialCommunityIcons
                  name={order.order_type === 'ewash' ? 'hanger' : 'food'}
                  size={ms(22)}
                  color={ui.blue}
                />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>× {item.qty}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment summary</Text>
        <View style={[styles.card, styles.paymentCard]}>
          <View style={styles.paymentTotalRow}>
            <Text style={styles.paymentTotalLabel}>Subtotal</Text>
            <Text style={styles.paymentTotalValue}>{formatNaira(order.subtotal || order.total)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={[styles.paymentTotalRow, styles.paymentRowSpacing]}>
              <Text style={styles.paymentTotalLabel}>Discount</Text>
              <Text style={[styles.paymentTotalValue, styles.discountText]}>{`- ${formatNaira(order.discount)}`}</Text>
            </View>
          )}
          <View style={styles.paymentDivider} />
          <View style={styles.paymentTotalRow}>
            <Text style={styles.paymentTotalLabel}>Total paid</Text>
            <Text style={styles.paymentTotalValue}>{formatNaira(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(16) },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(22),
    paddingHorizontal: ms(20),
    marginBottom: ms(20),
  },
  backBtn: { width: ms(32), height: ms(40), justifyContent: 'center' },
  title: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(24),
    gap: ms(10),
  },
  loadingText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: washColors.textPrimary,
  },
  errorText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: ms(26),
    borderWidth: 1,
    borderColor: ui.border,
    paddingHorizontal: ms(22),
    paddingVertical: ms(22),
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(10),
  },
  orderNumber: {
    flexShrink: 1,
    fontSize: ms(24),
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: ui.pillBg,
    paddingHorizontal: ms(10),
    paddingVertical: ms(7),
    borderRadius: ms(999),
  },
  statusPillText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: ui.slate,
  },
  summaryTitle: {
    marginTop: ms(12),
    fontSize: ms(15),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },
  placed: {
    marginTop: ms(8),
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    color: ui.slate,
  },
  sectionTitle: {
    marginTop: ms(26),
    marginBottom: ms(10),
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  timelineCard: { paddingVertical: ms(12) },
  stepRow: { flexDirection: 'row', gap: ms(12) },
  stepRail: { width: ms(34), alignItems: 'center' },
  stepCircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: ui.circleIdle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D7B4',
  },
  stepCircleReached: {
    backgroundColor: washColors.navySolid,
    borderColor: washColors.navySolid,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: ui.line,
    marginTop: ms(4),
  },
  stepLineReached: { backgroundColor: washColors.navySolid },
  stepBody: { flex: 1, paddingBottom: ms(18) },
  stepBodySpacing: { paddingBottom: ms(18) },
  stepTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.medium,
    color: ui.titleIdle,
  },
  stepTitleReached: { color: washColors.textPrimary },
  stepDescription: {
    marginTop: ms(3),
    fontSize: ms(12),
    lineHeight: ms(18),
    fontFamily: fonts.poppins.regular,
    color: ui.slate,
  },
  detailsCard: { paddingVertical: ms(8) },
  detailRow: { flexDirection: 'row', gap: ms(14), paddingVertical: ms(12) },
  detailIcon: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    backgroundColor: '#F4F2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: { flex: 1 },
  detailLabel: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: ui.slate },
  detailValue: {
    marginTop: ms(2),
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },
  detailDivider: { height: 1, backgroundColor: '#F0EFEA' },
  itemsCard: { paddingVertical: ms(10) },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  itemIconTile: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(12),
    backgroundColor: ui.blueTileSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: { flex: 1, fontSize: ms(14), fontFamily: fonts.poppins.medium, color: washColors.textPrimary },
  itemQty: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: ui.blue },
  paymentCard: { paddingVertical: ms(12) },
  paymentTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentRowSpacing: { marginTop: ms(10) },
  paymentTotalLabel: { fontSize: ms(13), fontFamily: fonts.poppins.medium, color: ui.slate },
  paymentTotalValue: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  discountText: { color: '#22A06B' },
  paymentDivider: { height: 1, backgroundColor: '#F0EFEA', marginVertical: ms(12) },
});