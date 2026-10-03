import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';

type OrderStatus = 'scheduled' | 'picked-up' | 'processing' | 'ready' | 'out-for-delivery';

type ActiveOrder = {
  id: string;
  status: OrderStatus;
  itemCount: number;
  detail: string;
  coveredByPlan: boolean;
};

type StatusIcon = keyof typeof MaterialCommunityIcons.glyphMap;

// Order matches the timeline on the order details screen.
const STATUS_FLOW: OrderStatus[] = [
  'scheduled',
  'picked-up',
  'processing',
  'ready',
  'out-for-delivery',
  'delivered' as OrderStatus,
];

const STATUS_STYLE: Record<OrderStatus, { label: string; icon: StatusIcon; bg: string; fg: string }> = {
  scheduled: { label: 'Scheduled', icon: 'calendar', bg: '#EDEEF1', fg: '#5F6B77' },
  'picked-up': { label: 'Picked Up', icon: 'truck', bg: '#DBEAFE', fg: '#1E3A9F' },
  processing: { label: 'Processing', icon: 'washing-machine', bg: '#DBEAFE', fg: '#1E3A9F' },
  ready: { label: 'Ready', icon: 'check-circle-outline', bg: '#E3F1E8', fg: '#1F7A4A' },
  'out-for-delivery': { label: 'Out for Delivery', icon: 'moped', bg: '#E3F1E8', fg: '#1F7A4A' },
};

// Replace with real orders from your data source.
const ACTIVE_ORDERS: ActiveOrder[] = [
  {
    id: '239604',
    status: 'scheduled',
    itemCount: 8,
    detail: 'Pickup Sun, Jun 7 · 4 PM – 8 PM',
    coveredByPlan: true,
  },
  {
    id: '781126',
    status: 'out-for-delivery',
    itemCount: 10,
    detail: 'Arriving today',
    coveredByPlan: true,
  },
];

const ui = {
  border: '#E8E3D0',
  heading: '#1E3A9F',
  slate: '#5F6B77',
  chevron: '#8A94A3',
  segmentIdle: '#EFE8D8',
  heroMid: '#2563EB',
};

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openOrder = (id: string) =>
    router.push({ pathname: '/order-details', params: { id } } as any);

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
      >
        <Text style={styles.sectionTitle}>Active orders</Text>

        {ACTIVE_ORDERS.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="washing-machine" size={30} color={ui.heading} />
            </View>
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptyText}>You have nothing in the wash right now.</Text>
          </View>
        ) : (
          ACTIVE_ORDERS.map((order) => {
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
                  <View style={styles.cardInfo}>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.detail}>{order.detail}</Text>
                  </View>
                  <Feather name="chevron-right" size={22} color={ui.chevron} />
                </View>

                <View style={styles.pillRow}>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <MaterialCommunityIcons name={status.icon} size={15} color={status.fg} />
                    <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
                  </View>
                  {order.coveredByPlan && (
                    <View style={styles.coveredPill}>
                      <Feather name="tag" size={12} color={washColors.coveredText} />
                      <Text style={styles.coveredText}>Covered by plan</Text>
                    </View>
                  )}
                </View>

                <View style={styles.progressBar}>
                  {STATUS_FLOW.map((step, index) => (
                    <View
                      key={step}
                      style={[styles.segment, index <= stepIndex && styles.segmentReached]}
                    />
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.itemsInfo}>
                    <Feather name="package" size={14} color={washColors.textSecondary} />
                    <Text style={styles.itemsText}>
                      {order.itemCount} item{order.itemCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.viewText}>View details</Text>
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
  title: {
    fontSize: 22,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },

  sectionTitle: {
    fontSize: 22,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
    marginBottom: 14,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  orderId: {
    fontSize: 20,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  detail: {
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 2,
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  statusText: { fontSize: 14, fontFamily: fonts.poppins.medium },
  coveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: washColors.coveredBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  coveredText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.semiBold,
    color: washColors.coveredText,
  },

  progressBar: { flexDirection: 'row', gap: 6, marginTop: 18 },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: ui.segmentIdle,
  },
  segmentReached: { backgroundColor: ui.slate },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  itemsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemsText: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  viewText: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.medium,
    color: ui.heroMid,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
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