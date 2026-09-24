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

const PLAN_DATA = {
  amount: 20000,
  duration: '1 Week',
  estimatedMeals: '4–6 Surprises',
  deliveryWindow: 'Lunch + Dinner',
  starts: 'Today, May 20',
  exclusions: 'Pork, No Meat (Veg)',
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function EPlanSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

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
        <View style={styles.heroSection}>
          <View style={styles.successIconWrapper}>
            <View style={[styles.confetti, styles.confetti1]} />
            <View style={[styles.confetti, styles.confetti2]} />
            <View style={[styles.confetti, styles.confetti3]} />
            <View style={[styles.confetti, styles.confetti4]} />
            
            <View style={styles.successIconCircle}>
              <Feather name="check" size={40} color="#10B981" />
            </View>
          </View>

          <Text style={styles.heroTitle}>E-Plan is Live!</Text>
          <Text style={styles.heroSubtitle}>
            Your {formatNaira(PLAN_DATA.amount)} has been locked and your E-Plan is now active. Get ready for delicious surprises!
          </Text>
        </View>

        <Text style={styles.sectionLabel}>WHAT HAPPENS NEXT</Text>
        <View style={styles.infoCard}>
          <InfoRow
            icon="calendar-check"
            title="Meals Incoming"
            description="We'll surprise you with 4–6 meals within your selected windows."
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon="clock-outline"
            title="Track Everything"
            description="Follow your deliveries and check your plan status anytime."
          />
          <View style={styles.infoDivider} />
          <InfoRow
            icon="shield-check-outline"
            title="Flexible & Secure"
            description="You can pause or cancel your plan anytime if needed."
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>YOUR E-PLAN OVERVIEW</Text>
        <View style={styles.summaryCard}>
          <SummaryRow icon="list" label="Plan" value="E-Plan" />
          <SummaryRow icon="dollar-sign" label="Amount Locked" value={formatNaira(PLAN_DATA.amount)} isBold />
          <SummaryRow icon="calendar" label="Duration" value={PLAN_DATA.duration} />
          <SummaryRow icon="pie-chart" label="Estimated Meals" value={PLAN_DATA.estimatedMeals} />
          <SummaryRow icon="clock" label="Delivery Window" value={PLAN_DATA.deliveryWindow} />
          <SummaryRow icon="calendar" label="Starts" value={PLAN_DATA.starts} />
          <SummaryRow icon="slash" label="Exclusions" value={PLAN_DATA.exclusions} isLast />
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/my-plan' as any)}
        >
          <Text style={styles.primaryBtnText}>Go to My Plan</Text>
          <Feather name="arrow-right" size={18} color="#fff" style={styles.btnIcon} />
        </TouchableOpacity>
      </ScrollView>

      <BottomTabs />
    </View>
  );
}

function InfoRow({
  icon,
  title,
  description,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>
        <MaterialCommunityIcons name={icon} size={22} color={ACCENT_BLUE} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: 26, paddingBottom: 8 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 26 },

  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 32,
  },
  successIconWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  confetti: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confetti1: { backgroundColor: '#1E3FEA', top: 10, right: 25, transform: [{ rotate: '45deg' }] },
  confetti2: { backgroundColor: '#F59E0B', bottom: 15, left: 20, width: 8, height: 8, borderRadius: 4 },
  confetti3: { backgroundColor: '#10B981', top: 25, left: 15, width: 4, height: 4 },
  confetti4: { backgroundColor: '#EC4899', bottom: 30, right: 10 },

  heroTitle: {
    fontSize: 28,
    fontFamily: serif,
    fontWeight: '700',
    color: foodColors.textPrimary,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  sectionLabel: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.6, marginBottom: 12 },
  sectionSpacing: { marginTop: 26 },

  infoCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  infoDivider: {
    height: 1,
    backgroundColor: foodColors.border,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(30,63,234,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoTextContainer: { flex: 1, justifyContent: 'center' },
  infoTitle: { fontSize: 14, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 4 },
  infoDescription: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 18 },

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

  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161311',
    borderRadius: 26,
    paddingVertical: 16,
    marginTop: 30,
  },
  btnIcon: { marginLeft: 8 },
  primaryBtnText: { fontSize: 15, fontFamily: fonts.poppins.bold, color: '#fff' },
});