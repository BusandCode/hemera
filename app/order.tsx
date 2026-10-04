import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { useOrders } from '../src/hooks/useOrders';
import { ms } from '../src/utils/responsive';

type OrderStatus = 'scheduled' | 'picked-up' | 'processing' | 'ready' | 'out-for-delivery';

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
  const { orders, loading } = useOrders('ewash', 'active');

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
          <Feather name="arrow-left" size={ms(24)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Active orders</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={ui.heading} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="washing-machine" size={ms(30)} color={ui.heading} />
            </View>
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptyText}>You have nothing in the wash right now.</Text>
          </View>
        ) : (
          orders.map((order) => {
            const flowStatus: OrderStatus = order.status === 'Scheduled' ? 'scheduled' : 'processing';
            const status = STATUS_STYLE[flowStatus];
            const stepIndex = STATUS_FLOW.indexOf(flowStatus);

            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => openOrder(order.id)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.orderId}>Order #{order.id.slice(0, 6).toUpperCase()}</Text>
                    <Text style={styles.detail}>{order.date}</Text>
                  </View>
                  <Feather name="chevron-right" size={ms(22)} color={ui.chevron} />
                </View>

                <View style={styles.pillRow}>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <MaterialCommunityIcons name={status.icon} size={ms(15)} color={status.fg} />
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

                <View style={styles.cardFooter}>
                  <View style={styles.itemsInfo}>
                    <Feather name="package" size={ms(14)} color={washColors.textSecondary} />
                    <Text style={styles.itemsText}>{order.meta || order.title}</Text>
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
  content: { paddingHorizontal: ms(16) },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(22),
    paddingHorizontal: ms(20),
    marginBottom: ms(20),
  },
  backBtn: { width: ms(32), height: ms(40), justifyContent: 'center' },
  title: {
    fontSize: ms(22),
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },

  sectionTitle: {
    fontSize: ms(22),
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
    marginBottom: ms(14),
    marginLeft: ms(4),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: ms(26),
    borderWidth: 1,
    borderColor: ui.border,
    padding: ms(20),
    marginBottom: ms(16),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: ms(12) },
  cardInfo: { flex: 1 },
  orderId: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  detail: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: ms(2),
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: ms(8),
    marginTop: ms(14),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    paddingHorizontal: ms(14),
    paddingVertical: ms(7),
    borderRadius: ms(16),
  },
  statusText: { fontSize: ms(14), fontFamily: fonts.poppins.medium },
  coveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: washColors.coveredBg,
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
    borderRadius: ms(16),
  },
  coveredText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.coveredText,
  },

  progressBar: { flexDirection: 'row', gap: ms(6), marginTop: ms(18) },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: ms(3),
    backgroundColor: ui.segmentIdle,
  },
  segmentReached: { backgroundColor: ui.slate },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ms(14),
  },
  itemsInfo: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  itemsText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  viewText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.medium,
    color: ui.heroMid,
  },

  loader: { marginTop: ms(48) },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: ms(26),
    borderWidth: 1,
    borderColor: ui.border,
    padding: ms(24),
    alignItems: 'center',
  },
  emptyIcon: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(20),
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(14),
  },
  emptyTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
  },
  emptyText: {
    fontSize: ms(14),
    lineHeight: ms(21),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(6),
  },
});