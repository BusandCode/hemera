import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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
import { useOrders } from '../../src/hooks/useOrders';

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

export default function WashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'order' | 'schedule'>('order');

  const { status: planStatus, planName, renewsOn, expiredOn } = usePlanStatus();
  const plan = getPlanContent(planStatus, renewsOn, expiredOn);
  const planTitle = planStatus === 'none' ? 'No Active Plan' : (planName ?? 'Your Plan');
  const isCoveredByPlan = planStatus === 'active';

  const { orders } = useOrders('ewash');
  const activeOrder = useMemo(
    () => orders.find((o) => o.status === 'In Progress' || o.status === 'Scheduled') ?? null,
    [orders],
  );
  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const processingDone = activeOrder?.status === 'In Progress';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(12) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Let help you with{'\n'}the washing today.</Text>

          {/* <TouchableOpacity style={styles.referButton}>
            <Feather name="gift" size={ms(16)} color={foodColors.primary} />
            <Text style={styles.referText}>REFER</Text>
          </TouchableOpacity> */}
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
                {activeOrder?.status ?? 'No active orders'}
              </Text>
            </Text>
            <View style={styles.statusDot} />
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.progressRow}>
            <View style={styles.progressStepWrap}>
              <View
                style={[
                  styles.progressStep,
                  !activeOrder
                    ? styles.progressStepPending
                    : processingDone
                      ? styles.progressStepCompleted
                      : styles.progressStepActive,
                ]}
              >
                {processingDone ? (
                  <Feather name="check" size={ms(14)} color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name="basket-outline"
                    size={ms(15)}
                    color={activeOrder ? foodColors.badgeBlue : foodColors.textMuted}
                  />
                )}
              </View>
              <Text style={styles.progressLabel}>Picked Up</Text>
            </View>

            <View style={[styles.progressLine, processingDone && styles.progressLineRed]} />

            <View style={styles.progressStepWrap}>
              <View
                style={[
                  styles.progressStep,
                  processingDone ? styles.progressStepActive : styles.progressStepPending,
                ]}
              >
                <MaterialCommunityIcons
                  name="washing-machine"
                  size={ms(15)}
                  color={processingDone ? foodColors.badgeBlue : foodColors.textMuted}
                />
              </View>
              <Text style={styles.progressLabel}>Processing</Text>
            </View>

            <View style={[styles.progressLine, styles.progressLineDashed]} />

            <View style={styles.progressStepWrap}>
              <View style={[styles.progressStep, styles.progressStepPending]}>
                <MaterialCommunityIcons name="hanger" size={ms(15)} color={foodColors.textMuted} />
              </View>
              <Text style={styles.progressLabel}>Ready</Text>
            </View>

            <View style={[styles.progressLine, styles.progressLineDashed]} />

            <View style={styles.progressStepWrap}>
              <View style={[styles.progressStep, styles.progressStepPending]}>
                <Feather name="home" size={ms(14)} color={foodColors.textMuted} />
              </View>
              <Text style={styles.progressLabel}>Delivery</Text>
            </View>
          </View>
        </View>

        <View style={styles.recentOrdersSection}>
          <Text style={styles.recentOrdersTitle}>Recent Orders</Text>

          {recentOrders.length === 0 && (
            <View style={styles.emptyOrdersCard}>
              <Feather name="package" size={ms(18)} color={foodColors.textMuted} />
              <Text style={styles.noActiveText}>No active orders yet</Text>
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
                <Text style={styles.orderId}>Order #{order.id.slice(0, 6).toUpperCase()}</Text>
                <View style={styles.orderChevron}>
                  <Feather name="chevron-right" size={ms(16)} color={foodColors.textPrimary} />
                </View>
              </View>
              <View style={styles.orderFooter}>
                <View style={styles.orderItems}>
                  <Feather name="package" size={ms(14)} color={foodColors.textSecondary} />
                  <Text style={styles.orderItemsText}>{order.meta || order.title}</Text>
                </View>
                <Text style={styles.orderDate}>{order.date}</Text>
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
  container: {
    flex: 1,
    backgroundColor: foodColors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ms(20),
    paddingTop: 0,
    paddingBottom: ms(20),
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: foodColors.primaryLight,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: ms(14),
    paddingVertical: ms(9),
    borderRadius: ms(20),
  },
  referText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.3,
    color: foodColors.primary,
  },
  planCard: {
    borderRadius: ms(20),
    paddingHorizontal: ms(18),
    paddingVertical: ms(14),
    marginBottom: ms(16),
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  planTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: ms(12),
    marginBottom: ms(10),
  },
  planBadgeText: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  planDescription: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(18),
    color: 'rgba(255,255,255,0.85)',
    marginBottom: ms(12),
    maxWidth: '78%',
  },
  planButton: {
    alignSelf: 'flex-end',
    backgroundColor: foodColors.primary,
    paddingHorizontal: ms(18),
    paddingVertical: ms(8),
    borderRadius: ms(18),
  },
  planButtonText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginBottom: ms(20),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    paddingVertical: ms(16),
    borderRadius: ms(16),
  },
  requestPickupButton: {
    backgroundColor: foodColors.primary,
  },
  payPerOrderButton: {
    backgroundColor: foodColors.badgeBlue,
  },
  actionButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  quickNavRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(12),
    marginBottom: ms(24),
    position: 'relative',
  },
  quickNavItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickNavDivider: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -ms(0.5),
    width: 1,
    height: ms(60),
    backgroundColor: foodColors.border,
  },
  quickNavCircle: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    borderWidth: 1.5,
    borderColor: foodColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(8),
  },
  quickNavLabel: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  activeOrderCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(20),
    padding: ms(18),
    marginBottom: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  activeOrderTitle: {
    fontSize: ms(19),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  coveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: ms(10),
    paddingVertical: ms(6),
    borderRadius: ms(14),
  },
  coveredText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(14),
  },
  statusLabel: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  statusValue: {
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  statusValueEmpty: {
    color: foodColors.textMuted,
  },
  statusDot: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    borderWidth: 1.5,
    borderColor: foodColors.border,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: foodColors.border,
    marginBottom: ms(18),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  progressStepWrap: {
    width: ms(68),
    alignItems: 'center',
  },
  progressStep: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    borderWidth: 2,
    backgroundColor: foodColors.surface,
    borderColor: foodColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepCompleted: {
    backgroundColor: foodColors.primary,
    borderColor: foodColors.primary,
  },
  progressStepActive: {
    backgroundColor: foodColors.surface,
    borderColor: foodColors.badgeBlue,
  },
  progressStepPending: {
    backgroundColor: foodColors.surface,
    borderColor: foodColors.border,
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginTop: ms(15),
    backgroundColor: foodColors.border,
  },
  progressLineRed: {
    backgroundColor: foodColors.primary,
  },
  progressLineNavy: {
    backgroundColor: foodColors.badgeBlue,
  },
  progressLineDashed: {
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: foodColors.border,
    height: 0,
  },
  progressLabel: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    marginTop: ms(6),
  },
  recentOrdersSection: {
    marginTop: ms(4),
  },
  recentOrdersTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(14),
  },
  orderCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(18),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  orderCardSpacing: {
    marginBottom: ms(12),
  },
  emptyOrdersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(18),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  noActiveText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  orderId: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  orderChevron: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    borderWidth: 1.2,
    borderColor: foodColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },
  orderItemsText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  orderDate: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  bottomSpacer: {
    height: ms(20),
  },
});