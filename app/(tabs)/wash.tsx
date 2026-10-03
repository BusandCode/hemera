import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';
import { usePlanStatus, PlanStatus } from '../../src/hooks/usePlanStatus';

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
  expiredOn: string | null
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
  const [activeTab, setActiveTab] = useState<'order' | 'schedule'>('order');

  const { status: planStatus, planName, renewsOn, expiredOn } = usePlanStatus();
  const plan = getPlanContent(planStatus, renewsOn, expiredOn);
  const planTitle = planStatus === 'none' ? 'No Active Plan' : planName ?? 'Your Plan';
  const isCoveredByPlan = planStatus === 'active';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Let help you with{'\n'}the washing today.</Text>

          {/* <TouchableOpacity style={styles.referButton}>
            <Feather name="gift" size={16} color={foodColors.primary} />
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
            <Feather name={plan.icon} size={11} color="#fff" />
            <Text style={styles.planBadgeText}>{plan.badge}</Text>
          </View>

          <Text style={styles.planDescription}>{plan.description}</Text>

          <TouchableOpacity style={styles.planButton} onPress={() => router.push(plan.route as any)}>
            <Text style={styles.planButtonText}>{plan.button}</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.requestPickupButton]}
            onPress={() => router.push('/request-pickup' as any)}
          >
            <MaterialCommunityIcons name="basket-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Request Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.payPerOrderButton]}
            onPress={() => router.push('/pay-per-pickup' as any)}
          >
            <MaterialCommunityIcons name="moped-outline" size={20} color="#fff" />
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
              <Feather name="clipboard" size={20} color={foodColors.textPrimary} />
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
              <Feather name="calendar" size={20} color={foodColors.textPrimary} />
            </View>
            <Text style={styles.quickNavLabel}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activeOrderCard}>
          <View style={styles.activeOrderHeader}>
            <Text style={styles.activeOrderTitle}>Active Order</Text>
            <View style={styles.coveredBadge}>
              <Feather
                name={isCoveredByPlan ? 'tag' : 'credit-card'}
                size={12}
                color={foodColors.primary}
              />
              <Text style={styles.coveredText}>
                {isCoveredByPlan ? 'Covered by plan' : 'Pay per order'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              Status: <Text style={styles.statusValue}>Scheduled</Text>
            </Text>
            <View style={styles.statusDot} />
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.progressRow}>
            <View style={styles.progressStepWrap}>
              <View style={[styles.progressStep, styles.progressStepCompleted]}>
                <Feather name="check" size={14} color="#fff" />
              </View>
              <Text style={styles.progressLabel}>Picked Up</Text>
            </View>

            <View style={[styles.progressLine, styles.progressLineRed]} />

            <View style={styles.progressStepWrap}>
              <View style={[styles.progressStep, styles.progressStepCompleted]}>
                <Feather name="check" size={14} color="#fff" />
              </View>
              <Text style={styles.progressLabel}>Processing</Text>
            </View>

            <View style={[styles.progressLine, styles.progressLineNavy]} />

            <View style={styles.progressStepWrap}>
              <View style={[styles.progressStep, styles.progressStepActive]}>
                <MaterialCommunityIcons name="hanger" size={15} color={foodColors.badgeBlue} />
              </View>
              <Text style={styles.progressLabel}>Ready</Text>
            </View>

            <View style={[styles.progressLine, styles.progressLineDashed]} />

            <View style={styles.progressStepWrap}>
              <View style={[styles.progressStep, styles.progressStepPending]}>
                <Feather name="home" size={14} color={foodColors.textMuted} />
              </View>
              <Text style={styles.progressLabel}>Delivery</Text>
            </View>
          </View>
        </View>

        <View style={styles.recentOrdersSection}>
          <Text style={styles.recentOrdersTitle}>Recent Orders</Text>

          <TouchableOpacity
            style={styles.orderCard}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/order-details', params: { id: '239604' } } as any)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Order #239604</Text>
              <View style={styles.orderChevron}>
                <Feather name="chevron-right" size={16} color={foodColors.textPrimary} />
              </View>
            </View>
            <View style={styles.orderFooter}>
              <View style={styles.orderItems}>
                <Feather name="package" size={14} color={foodColors.textSecondary} />
                <Text style={styles.orderItemsText}>10 items</Text>
              </View>
              <Text style={styles.orderDate}>July 05, 2026</Text>
            </View>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  referButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: foodColors.primaryLight,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  referText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.3,
    color: foodColors.primary,
  },
  planCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  planBadgeText: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  planDescription: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    maxWidth: '78%',
  },
  planButton: {
    alignSelf: 'flex-end',
    backgroundColor: foodColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
  },
  planButtonText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  requestPickupButton: {
    backgroundColor: foodColors.primary,
  },
  payPerOrderButton: {
    backgroundColor: foodColors.badgeBlue,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  quickNavRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
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
    marginLeft: -0.5,
    width: 1,
    height: 60,
    backgroundColor: foodColors.border,
  },
  quickNavCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickNavLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  activeOrderCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
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
    marginBottom: 10,
  },
  activeOrderTitle: {
    fontSize: 19,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  coveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  coveredText: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  statusValue: {
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: foodColors.border,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: foodColors.border,
    marginBottom: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  progressStepWrap: {
    width: 68,
    alignItems: 'center',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginTop: 15,
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
    fontSize: 10,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  recentOrdersSection: {
    marginTop: 4,
  },
  recentOrdersTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 14,
  },
  orderCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  orderChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    gap: 6,
  },
  orderItemsText: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  orderDate: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  bottomSpacer: {
    height: 20,
  },
});