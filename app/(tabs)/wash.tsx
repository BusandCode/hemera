import { useState, Fragment } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { ms } from '../../src/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';
import { usePlanStatus, PlanStatus } from '../../src/hooks/usePlanStatus';
import { useRecentOrders } from '../../src/hooks/useRecentOrders';
import { orderNumber, normalizeStatus } from '../../src/lib/orderStatus';

type PlanCardContent = {
  badge: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  button: string;
  route: string;
};

function getPlanContent(
  status: PlanStatus,
  renewsOn: string | null,
  expiredOn: string | null,
): PlanCardContent {
  switch (status) {
    case 'active':
      return {
        badge: 'Active',
        icon: 'check-circle',
        description: renewsOn
          ? `Renews on ${renewsOn} —\nenjoy seamless pickups and washes`
          : 'Enjoy seamless pickups\nand washes',
        button: 'Manage Plan',
        route: '/manage-plan',
      };
    case 'expired':
      return {
        badge: 'Expired',
        icon: 'clock',
        description: expiredOn
          ? `Expired on ${expiredOn} —\nrenew to keep using your plan`
          : 'Your plan has expired —\nrenew to keep using your plan',
        button: 'Renew Plan',
        route: '/renew-plan',
      };
    case 'none':
    default:
      return {
        badge: 'Get Started',
        icon: 'zap',
        description: 'Choose a laundry plan to enjoy\nconvenient pickups and savings.',
        button: 'Choose a Plan',
        route: '/choose-plan',
      };
  }
}

const TRACKER_STEPS = [
  { label: 'Picked Up', icon: 'basket-outline', lib: 'mci' },
  { label: 'Processing', icon: 'washing-machine', lib: 'mci' },
  { label: 'Ready', icon: 'hanger', lib: 'mci' },
  { label: 'Delivery', icon: 'home', lib: 'feather' },
] as const;

export default function WashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'order' | 'schedule'>('order');

  const { status: planStatus, planName, renewsOn, expiredOn, allowance } = usePlanStatus();
  const plan = getPlanContent(planStatus, renewsOn, expiredOn);
  const planTitle = planStatus === 'none' ? 'No Active Plan' : (planName ?? 'Your Plan');

  const { orders: recentOrders, activeOrder, refetch } = useRecentOrders('ewash', 5);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  const isCoveredByPlan = !!activeOrder?.coveredByPlan;

  const STAGES = ['scheduled', 'picked-up', 'processing', 'ready', 'out-for-delivery', 'delivered'];
  const STAGE_LABELS = ['Scheduled', 'Picked Up', 'Processing', 'Ready', 'Out for Delivery', 'Delivered'];
  const stage = activeOrder
    ? Math.max(0, STAGES.indexOf(normalizeStatus(activeOrder.rawStatus, 'ewash')))
    : -1;
  const statusText = activeOrder ? STAGE_LABELS[stage] : 'No active order';

  const totalPickups = allowance
    ? allowance.pickupsLimit + allowance.rolloverPickups
    : 0;
  const pickupsUsed = allowance
    ? totalPickups - allowance.pickupsRemaining
    : 0;
  const totalItems = allowance
    ? allowance.itemsLimit + allowance.rolloverItems
    : 0;
  const itemsUsed = allowance
    ? totalItems - allowance.itemsRemaining
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(12) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Let help you with{'\n'}the washing today.</Text>
        </View>

        <LinearGradient
          colors={[foodColors.badgeBlue, foodColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <View style={styles.planTopRow}>
            <Text style={styles.planTitle}>{planTitle}</Text>
          </View>

          <View style={styles.planBadge}>
            <Feather name={plan.icon} size={ms(11)} color="#fff" />
            <Text style={styles.planBadgeText}>{plan.badge}</Text>
          </View>

          <Text style={styles.planDescription}>{plan.description}</Text>

          <TouchableOpacity
            style={styles.planButton}
            onPress={() => router.push(plan.route as any)}
          >
            <Text style={styles.planButtonText}>{plan.button}</Text>
          </TouchableOpacity>
        </LinearGradient>

        {planStatus === 'active' && allowance && (
          <View style={styles.planChipsRow}>
            <View style={styles.planChip}>
              <MaterialCommunityIcons
                name="truck-outline"
                size={ms(16)}
                color={foodColors.badgeBlue}
              />
              <Text style={styles.planChipText} numberOfLines={1}>
                {pickupsUsed}/{totalPickups} pickups used
              </Text>
            </View>
            <View style={styles.planChip}>
              <Feather name="user" size={ms(14)} color={foodColors.badgeBlue} />
              <Text style={styles.planChipText} numberOfLines={1}>
                {itemsUsed}/{totalItems} items used
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.requestPickupButton]}
            onPress={() => router.push('/request-pickup' as any)}
          >
            <MaterialCommunityIcons name="basket-outline" size={ms(20)} color="#fff" />
            <Text style={styles.actionButtonText}>Request Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.payPerOrderButton]}
            onPress={() => router.push('/pay-per-pickup' as any)}
          >
            <MaterialCommunityIcons name="moped-outline" size={ms(20)} color="#fff" />
            <Text style={styles.actionButtonText}>Pay Per Order</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickNavRow}>
          <TouchableOpacity
            style={styles.quickNavItem}
            onPress={() => {
              setActiveTab('order');
              router.push('/order' as any);
            }}
          >
            <View style={styles.quickNavCircle}>
              <Feather name="clipboard" size={ms(20)} color={foodColors.textPrimary} />
            </View>
            <Text style={styles.quickNavLabel}>Order</Text>
          </TouchableOpacity>

          <View style={styles.quickNavDivider} />

          <TouchableOpacity
            style={styles.quickNavItem}
            onPress={() => {
              setActiveTab('schedule');
              router.push('/schedule' as any);
            }}
          >
            <View style={styles.quickNavCircle}>
              <Feather name="calendar" size={ms(20)} color={foodColors.textPrimary} />
            </View>
            <Text style={styles.quickNavLabel}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activeOrderCard}>
          <View style={styles.activeOrderHeader}>
            <Text style={styles.activeOrderTitle}>Active Order</Text>
            {activeOrder && (
              <View style={styles.coveredBadge}>
                <Feather
                  name={isCoveredByPlan ? 'tag' : 'credit-card'}
                  size={ms(12)}
                  color={foodColors.primary}
                />
                <Text style={styles.coveredText}>
                  {isCoveredByPlan ? 'Covered by plan' : 'Pay per order'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              Status:{' '}
              <Text style={[styles.statusValue, !activeOrder && styles.statusValueEmpty]}>
                {statusText}
              </Text>
            </Text>
            <View style={styles.statusDot} />
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.progressRow}>
            {TRACKER_STEPS.map((step, i) => {
              const k = i + 1;
              const done = stage > k || stage === 5;
              const current = !done && (stage === k || (stage === 0 && k === 1));
              return (
                <Fragment key={step.label}>
                  {i > 0 && (
                    <View
                      style={[
                        styles.progressLine,
                        stage >= k ? styles.progressLineRed : styles.progressLineDashed,
                      ]}
                    />
                  )}
                  <View style={styles.progressStepWrap}>
                    <View
                      style={[
                        styles.progressStep,
                        done
                          ? styles.progressStepCompleted
                          : current
                            ? styles.progressStepActive
                            : styles.progressStepPending,
                      ]}
                    >
                      {done ? (
                        <Feather name="check" size={ms(14)} color="#fff" />
                      ) : step.lib === 'feather' ? (
                        <Feather
                          name={step.icon as any}
                          size={ms(14)}
                          color={current ? foodColors.badgeBlue : foodColors.textMuted}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={step.icon as any}
                          size={ms(15)}
                          color={current ? foodColors.badgeBlue : foodColors.textMuted}
                        />
                      )}
                    </View>
                    <Text style={styles.progressLabel}>{step.label}</Text>
                  </View>
                </Fragment>
              );
            })}
          </View>
        </View>

        <View style={styles.recentOrdersSection}>
          <Text style={styles.recentOrdersTitle}>Recent Orders</Text>

          {recentOrders.length === 0 && (
            <View style={styles.emptyOrdersCard}>
              <Feather name="package" size={ms(18)} color={foodColors.textMuted} />
              <Text style={styles.noActiveText}>No recent order activity yet</Text>
            </View>
          )}

          {recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, styles.orderCardSpacing]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: '/order-details', params: { id: order.id } } as any)
              }
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{orderNumber(order.ref, order.id)}</Text>
                <View style={styles.orderChevron}>
                  <Feather name="chevron-right" size={ms(16)} color={foodColors.textPrimary} />
                </View>
              </View>
              <View style={styles.orderFooter}>
                <View style={styles.orderItems}>
                  <Feather name="package" size={ms(14)} color={foodColors.textSecondary} />
                  <Text style={styles.orderItemsText}>{order.summary} · {order.stageLabel}</Text>
                </View>
                <Text style={styles.orderDate}>{order.activityLabel}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FoodTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingTop: 0, paddingBottom: ms(20) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ms(20),
  },
  headerTitle: {
    fontSize: ms(20),
    lineHeight: ms(28),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    flex: 1,
    marginRight: ms(12),
  },
  referButton: {
    flexDirection: 'row', alignItems: 'center', gap: ms(6),
    backgroundColor: foodColors.primaryLight, borderWidth: 1, borderColor: foodColors.border,
    paddingHorizontal: ms(14), paddingVertical: ms(9), borderRadius: ms(20),
  },
  referText: { fontSize: ms(12), fontFamily: fonts.poppins.bold, letterSpacing: 0.3, color: foodColors.primary },

  planCard: { borderRadius: ms(20), paddingHorizontal: ms(18), paddingVertical: ms(14), marginBottom: ms(10) },
  planTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(8) },
  planTitle: { fontSize: ms(18), fontFamily: fonts.poppins.bold, color: '#fff' },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: ms(5), alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: ms(10), paddingVertical: ms(4), borderRadius: ms(12), marginBottom: ms(10),
  },
  planBadgeText: { fontSize: ms(11), fontFamily: fonts.poppins.bold, color: '#fff' },
  planDescription: {
    fontSize: ms(12.5), fontFamily: fonts.poppins.regular, lineHeight: ms(18),
    color: 'rgba(255,255,255,0.85)', marginBottom: ms(12), maxWidth: '78%',
  },
  planButton: {
    alignSelf: 'flex-end', backgroundColor: foodColors.primary,
    paddingHorizontal: ms(18), paddingVertical: ms(8), borderRadius: ms(18),
  },
  planButtonText: { fontSize: ms(12.5), fontFamily: fonts.poppins.bold, color: '#fff' },

  planChipsRow: { flexDirection: 'row', gap: ms(8), marginBottom: ms(16) },
  planChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: '#EEF4FB',
    borderRadius: ms(14),
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
  },
  planChipText: {
    flex: 1,
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.badgeBlue,
  },

  actionRow: { flexDirection: 'row', gap: ms(12), marginBottom: ms(20) },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: ms(8), paddingVertical: ms(16), borderRadius: ms(16),
  },
  requestPickupButton: { backgroundColor: foodColors.primary },
  payPerOrderButton: { backgroundColor: foodColors.badgeBlue },
  actionButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },

  quickNavRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(12), marginBottom: ms(24), position: 'relative' },
  quickNavItem: { flex: 1, alignItems: 'center' },
  quickNavDivider: {
    position: 'absolute', top: 0, left: '50%', marginLeft: -ms(0.5),
    width: 1, height: ms(60), backgroundColor: foodColors.border,
  },
  quickNavCircle: {
    width: ms(56), height: ms(56), borderRadius: ms(28),
    borderWidth: 1.5, borderColor: foodColors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: ms(8),
  },
  quickNavLabel: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },

  activeOrderCard: {
    backgroundColor: foodColors.surface, borderRadius: ms(20), padding: ms(18), marginBottom: ms(20),
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  activeOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(10) },
  activeOrderTitle: { fontSize: ms(19), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  coveredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: ms(6),
    backgroundColor: foodColors.primaryLight, paddingHorizontal: ms(10), paddingVertical: ms(6), borderRadius: ms(14),
  },
  coveredText: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(14) },
  statusLabel: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  statusValue: { fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  statusValueEmpty: { color: foodColors.textMuted },
  statusDot: { width: ms(18), height: ms(18), borderRadius: ms(9), borderWidth: 1.5, borderColor: foodColors.border },
  sectionDivider: { height: 1, backgroundColor: foodColors.border, marginBottom: ms(18) },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  progressStepWrap: { width: ms(68), alignItems: 'center' },
  progressStep: {
    width: ms(32), height: ms(32), borderRadius: ms(16), borderWidth: 2,
    backgroundColor: foodColors.surface, borderColor: foodColors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  progressStepCompleted: { backgroundColor: foodColors.primary, borderColor: foodColors.primary },
  progressStepActive: { backgroundColor: foodColors.surface, borderColor: foodColors.badgeBlue },
  progressStepPending: { backgroundColor: foodColors.surface, borderColor: foodColors.border },
  progressLine: { flex: 1, height: 2, marginTop: ms(15), backgroundColor: foodColors.border },
  progressLineRed: { backgroundColor: foodColors.primary },
  progressLineNavy: { backgroundColor: foodColors.badgeBlue },
  progressLineDashed: {
    backgroundColor: 'transparent', borderTopWidth: 2, borderStyle: 'dashed',
    borderColor: foodColors.border, height: 0,
  },
  progressLabel: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, textAlign: 'center', marginTop: ms(6) },

  recentOrdersSection: { marginTop: ms(4) },
  recentOrdersTitle: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(14) },
  orderCard: {
    backgroundColor: foodColors.surface, borderRadius: ms(18), padding: ms(16),
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  orderCardSpacing: { marginBottom: ms(12) },
  emptyOrdersCard: {
    flexDirection: 'row', alignItems: 'center', gap: ms(10),
    backgroundColor: foodColors.surface, borderRadius: ms(18), padding: ms(16),
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  noActiveText: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(12) },
  orderId: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  orderChevron: {
    width: ms(34), height: ms(34), borderRadius: ms(17),
    borderWidth: 1.2, borderColor: foodColors.border, alignItems: 'center', justifyContent: 'center',
  },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItems: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  orderItemsText: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  orderDate: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  bottomSpacer: { height: ms(20) },
});