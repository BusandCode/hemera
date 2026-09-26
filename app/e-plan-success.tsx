import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EPlanHeader } from '../src/components/eplan/EPlanHeader';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

const ACCENT_BLUE = '#1E3FEA';

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

type PlanRow = {
  locked_amount_kobo: number;
  ends_at: string;
  exclusions: string | null;
  delivery_window: string | null;
  created_at: string;
};

export default function EPlanSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const [plan, setPlan] = useState<PlanRow | null>(null);

  useEffect(() => {
    if (!planId) return;

    (async () => {
      const { data } = await supabase
        .from('eplan_plans')
        .select(
          'locked_amount_kobo, ends_at, exclusions, delivery_window, created_at'
        )
        .eq('id', planId)
        .single();

      setPlan(data);
    })();
  }, [planId]);

  if (!plan) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 40,
            alignItems: 'center',
          },
        ]}
      >
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={ACCENT_BLUE} />
      </View>
    );
  }

  const amount = Math.round(plan.locked_amount_kobo / 100);

  const durationDays = Math.round(
    (new Date(plan.ends_at).getTime() -
      new Date(plan.created_at).getTime()) /
      86400000
  );

  const durationLabel = `${durationDays} Day${
    durationDays === 1 ? '' : 's'
  }`;

  const estimatedMeals =
    durationDays <= 7 ? '4–6 Surprises' : '8–12 Surprises';

  const startsLabel = `Today, ${new Date(
    plan.created_at
  ).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })}`;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 12,
        },
      ]}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <EPlanHeader />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
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
            Your {formatNaira(amount)} has been locked and your E-Plan is now
            active. Get ready for delicious surprises!
          </Text>
        </View>

        <Text style={styles.sectionLabel}>WHAT HAPPENS NEXT</Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="calendar-check"
            title="Meals Incoming"
            description="We'll surprise you with meals within your selected windows."
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
            description="You can cancel your plan anytime if needed."
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>
          YOUR E-PLAN OVERVIEW
        </Text>

        <View style={styles.summaryCard}>
          <SummaryRow icon="list" label="Plan" value="E-Plan" />

          <SummaryRow
            icon="dollar-sign"
            label="Amount Locked"
            value={formatNaira(amount)}
            isBold
          />

          <SummaryRow
            icon="calendar"
            label="Duration"
            value={durationLabel}
          />

          <SummaryRow
            icon="pie-chart"
            label="Estimated Meals"
            value={estimatedMeals}
          />

          <SummaryRow
            icon="clock"
            label="Delivery Window"
            value={plan.delivery_window ?? '—'}
          />

          <SummaryRow
            icon="calendar"
            label="Starts"
            value={startsLabel}
          />

          <SummaryRow
            icon="slash"
            label="Exclusions"
            value={plan.exclusions ?? 'None'}
            isLast
          />
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => router.replace('/my-plan' as any)}
        >
          <Text style={styles.primaryBtnText}>Go to My Plan</Text>
          <Feather
            name="arrow-right"
            size={18}
            color="#fff"
            style={styles.btnIcon}
          />
        </TouchableOpacity>
      </ScrollView>
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
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={ACCENT_BLUE}
        />
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
    <View
      style={[
        styles.summaryRow,
        !isLast && styles.summaryRowBorder,
      ]}
    >
      <View style={styles.summaryRowLeft}>
        <View style={styles.summaryIconWrapper}>
          <Feather
            name={icon}
            size={14}
            color={ACCENT_BLUE}
          />
        </View>

        <Text style={styles.summaryLabel}>{label}</Text>
      </View>

      <Text
        style={[
          styles.summaryValue,
          isBold && styles.summaryValueBold,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: foodColors.background,
  },
  header: {
    paddingHorizontal: 26,
    paddingBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 26,
  },
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
  confetti1: {
    backgroundColor: '#1E3FEA',
    top: 10,
    right: 25,
    transform: [{ rotate: '45deg' }],
  },
  confetti2: {
    backgroundColor: '#F59E0B',
    bottom: 15,
    left: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confetti3: {
    backgroundColor: '#10B981',
    top: 25,
    left: 15,
    width: 4,
    height: 4,
  },
  confetti4: {
    backgroundColor: '#EC4899',
    bottom: 30,
    right: 10,
  },
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
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 26,
  },
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
  infoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 18,
  },
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
    gap: 10,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: foodColors.border,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(30,63,234,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },
  summaryValueBold: {
    fontFamily: fonts.poppins.bold,
    color: ACCENT_BLUE,
  },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161311',
    borderRadius: 26,
    paddingVertical: 16,
    marginTop: 30,
  },
  btnIcon: {
    marginLeft: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});
