import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EPlanHeader } from '../src/components/eplan/EPlanHeader';
import { BottomTabs } from '../src/components/eplan/BottomTabs';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useProfile } from '../src/context/ProfileContext';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const ACCENT_BLUE = '#1E3FEA';
const WALLET_BALANCE = 25000;

const ACTIVE_PLAN = {
  amount: 20000,
  duration: '1 Week',
  estimatedMeals: '4–6 Surprises',
  deliveryWindow: 'Lunch + Dinner',
  starts: 'Today, May 20',
  ends: 'May 27',
  exclusions: 'Pork, No Meat (Veg)',
  mealsDelivered: 2,
  mealsTotal: 5,
  nextDelivery: 'Today, 12:30 PM',
};

const UPCOMING_DELIVERIES = [
  {
    id: '1',
    day: 'Today',
    date: 'May 20',
    window: '12:30 PM – 2:00 PM',
    meal: 'Jollof Rice & Grilled Chicken',
    status: 'in-transit' as const,
  },
  {
    id: '2',
    day: 'Tomorrow',
    date: 'May 21',
    window: '5:30 PM – 8:00 PM',
    meal: 'Egusi Soup & Pounded Yam',
    status: 'scheduled' as const,
  },
  {
    id: '3',
    day: 'Wed',
    date: 'May 22',
    window: '12:30 PM – 2:00 PM',
    meal: 'Ofada Rice & Ayamase',
    status: 'scheduled' as const,
  },
];

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function MyPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const progressPct = Math.round((ACTIVE_PLAN.mealsDelivered / ACTIVE_PLAN.mealsTotal) * 100);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <EPlanHeader
          wallet={formatNaira(WALLET_BALANCE)}
          initials={getInitials(profile.fullName)}
          onPressWallet={() => router.push('/wallet' as any)}
          onPressAvatar={() => router.push('/profile' as any)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Plan</Text>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Your active E-Plan at a glance</Text>

        {/* Hero Active Plan Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBadge}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={ACCENT_BLUE} />
            </View>
            <View style={styles.heroStatusPill}>
              <View style={styles.liveDot} />
              <Text style={styles.heroStatusText}>Active</Text>
            </View>
          </View>

          <Text style={styles.heroPlanName}>E-Plan</Text>
          <Text style={styles.heroPlanSub}>
            {formatNaira(ACTIVE_PLAN.amount)} locked • ends {ACTIVE_PLAN.ends}
          </Text>

          {/* Progress */}
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Meals delivered</Text>
            <Text style={styles.progressValue}>
              {ACTIVE_PLAN.mealsDelivered} / {ACTIVE_PLAN.mealsTotal}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Next delivery teaser */}
          <View style={styles.nextDeliveryBox}>
            <View style={styles.nextDeliveryIcon}>
              <Feather name="truck" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextDeliveryLabel}>Next delivery</Text>
              <Text style={styles.nextDeliveryValue}>{ACTIVE_PLAN.nextDelivery}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <QuickAction icon="pause-circle" label="Pause" onPress={() => {}} />
          <QuickAction icon="edit-2" label="Edit" onPress={() => {}} />
          <QuickAction icon="help-circle" label="Support" onPress={() => {}} />
          <QuickAction icon="x-circle" label="Cancel" onPress={() => {}} danger />
        </View>

        {/* Upcoming Deliveries */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>UPCOMING DELIVERIES</Text>
        <View style={styles.deliveryList}>
          {UPCOMING_DELIVERIES.map((d, i) => (
            <DeliveryRow
              key={d.id}
              day={d.day}
              date={d.date}
              window={d.window}
              meal={d.meal}
              status={d.status}
              isLast={i === UPCOMING_DELIVERIES.length - 1}
            />
          ))}
        </View>

        {/* Plan Overview */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>PLAN OVERVIEW</Text>
        <View style={styles.summaryCard}>
          <SummaryRow icon="dollar-sign" label="Amount Locked" value={formatNaira(ACTIVE_PLAN.amount)} isBold />
          <SummaryRow icon="calendar" label="Duration" value={ACTIVE_PLAN.duration} />
          <SummaryRow icon="pie-chart" label="Estimated Meals" value={ACTIVE_PLAN.estimatedMeals} />
          <SummaryRow icon="clock" label="Delivery Window" value={ACTIVE_PLAN.deliveryWindow} />
          <SummaryRow icon="slash" label="Exclusions" value={ACTIVE_PLAN.exclusions} isLast />
        </View>

        {/* Start a new plan CTA */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/e-plan-setup' as any)}
        >
          <Feather name="plus" size={16} color={foodColors.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.secondaryBtnText}>Start a new E-Plan</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabs />
    </View>
  );
}

// --- Sub-components ---

function QuickAction({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? '#DC2626' : foodColors.textPrimary;
  return (
    <TouchableOpacity style={styles.actionItem} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.actionIconBox, danger && styles.actionIconBoxDanger]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.actionLabel, danger && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DeliveryRow({
  day,
  date,
  window,
  meal,
  status,
  isLast,
}: {
  day: string;
  date: string;
  window: string;
  meal: string;
  status: 'in-transit' | 'scheduled' | 'delivered';
  isLast?: boolean;
}) {
  const statusMeta = {
    'in-transit': { color: ACCENT_BLUE, bg: 'rgba(30,63,234,0.08)', label: 'In transit' },
    scheduled: { color: '#B45309', bg: 'rgba(180,83,9,0.08)', label: 'Scheduled' },
    delivered: { color: '#059669', bg: 'rgba(5,150,105,0.08)', label: 'Delivered' },
  }[status];

  return (
    <View style={[styles.deliveryRow, !isLast && styles.deliveryRowBorder]}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateValue}>{date}</Text>
      </View>

      <View style={styles.deliveryDivider} />

      <View style={{ flex: 1 }}>
        <Text style={styles.deliveryMeal} numberOfLines={1}>
          {meal}
        </Text>
        <Text style={styles.deliveryWindow}>{window}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg, marginTop: 6 }]}>
          <Text style={[styles.statusPillText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
      </View>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  isBold = false,
  isLast = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  isBold?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !isLast && styles.summaryRowBorder]}>
      <View style={styles.summaryRowLeft}>
        <View style={styles.summaryIconWrapper}>
          <Feather name={icon} size={14} color={ACCENT_BLUE} />
        </View>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={[styles.summaryValue, isBold && styles.summaryValueBold]}>{value}</Text>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: 26, paddingBottom: 8 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 26 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  title: { fontSize: 27, fontFamily: serif, fontWeight: '700', color: foodColors.textPrimary },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  livePillText: { fontSize: 10, fontFamily: fonts.poppins.bold, color: '#059669', letterSpacing: 0.6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  subtitle: { fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: 20 },

  // Hero active card
  heroCard: {
    backgroundColor: '#161311',
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroStatusText: { fontSize: 11, fontFamily: fonts.poppins.bold, color: '#34D399' },
  heroPlanName: { fontSize: 26, fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 4 },
  heroPlanSub: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 11, fontFamily: fonts.poppins.medium, color: 'rgba(255,255,255,0.7)' },
  progressValue: { fontSize: 11, fontFamily: fonts.poppins.bold, color: '#fff' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },

  nextDeliveryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  nextDeliveryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextDeliveryLabel: { fontSize: 10.5, fontFamily: fonts.poppins.medium, color: 'rgba(255,255,255,0.55)', marginBottom: 2 },
  nextDeliveryValue: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: '#fff' },

  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
  },
  actionItem: { flex: 1, alignItems: 'center', gap: 6 },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: foodColors.surface,
    borderWidth: 1,
    borderColor: foodColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBoxDanger: {
    backgroundColor: 'rgba(220,38,38,0.06)',
    borderColor: 'rgba(220,38,38,0.2)',
  },
  actionLabel: { fontSize: 11, fontFamily: fonts.poppins.medium, color: foodColors.textPrimary },

  // Section
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionSpacing: { marginTop: 26 },

  // Deliveries list
  deliveryList: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 16,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  deliveryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: foodColors.border,
  },
  dateBlock: { width: 46, alignItems: 'flex-start' },
  dateDay: { fontSize: 10.5, fontFamily: fonts.poppins.bold, color: ACCENT_BLUE, letterSpacing: 0.4 },
  dateValue: { fontSize: 12, fontFamily: fonts.poppins.medium, color: foodColors.textSecondary, marginTop: 2 },
  deliveryDivider: {
    width: 1,
    height: 34,
    backgroundColor: foodColors.border,
    marginHorizontal: 12,
  },
  deliveryMeal: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 2 },
  deliveryWindow: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontFamily: fonts.poppins.bold, letterSpacing: 0.3 },

  // Summary card
  summaryCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: foodColors.border,
  },
  summaryRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(30,63,234,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  summaryValue: { fontSize: 13, fontFamily: fonts.poppins.medium, color: foodColors.textPrimary },
  summaryValueBold: { fontFamily: fonts.poppins.bold, color: ACCENT_BLUE },

  // Secondary button
  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    borderRadius: 26,
    paddingVertical: 15,
    marginTop: 26,
  },
  secondaryBtnText: { fontSize: 14.5, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
});