import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { WASH_DURATIONS, durationTotal, planFromName } from '../src/constants/washPlans';
import { useAuth } from '../src/context/AuthContext';
import { usePlanStatus } from '../src/hooks/usePlanStatus';
import { ms } from '../src/utils/responsive';

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

export default function RenewPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { status, planName, renewsOn, expiredOn, allowance, isLoading } = usePlanStatus();
  const [selected, setSelected] = useState<string>('3m');

  const plan = planFromName(planName);
  const duration = WASH_DURATIONS.find((d) => d.key === selected) ?? WASH_DURATIONS[0];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={washColors.navySolid} />
      </View>
    );
  }

  // Nothing to renew (no plan on file, or a plan we don't recognise)
  if (status === 'none' || !plan) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <Text style={styles.emptyTitle}>No plan to renew</Text>
        <Text style={styles.emptyText}>Choose a laundry plan to get started with pickups.</Text>
        <TouchableOpacity
          style={styles.renewButton}
          activeOpacity={0.85}
          onPress={() => router.replace('/choose-plan' as any)}
        >
          <Text style={styles.renewButtonText}>Choose a Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive = status === 'active';
  const total = durationTotal(plan.price, duration);
  const unusedPickups = isActive ? allowance?.pickupsRemaining ?? 0 : 0;

  // Renew Now opens the Flutterwave transfer screen. The renewal order is only created
  // there once payment is confirmed, followed by the success pop-up and order details.
  const handleRenew = () => {
    if (!session?.user.id) return;

    const ref = `WSH-${Math.floor(100000 + Math.random() * 900000)}`;
    const draft = {
      kind: 'subscription',
      metadata: {
        ref,
        kind: 'subscription',
        renewal: true,
        title: `${plan.name} Plan · ${duration.label} renewal`,
        plan_id: plan.id,
        duration_months: duration.months,
        subtotal: total,
        total,
        payment_method: 'transfer',
        customer_email: session.user.email ?? '',
        unused_pickups: unusedPickups,
      },
    };

    router.push({
      pathname: '/fund-wallet-account',
      params: {
        amount: String(total),
        service: 'ewash',
        order: JSON.stringify(draft),
      },
    } as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={ms(18)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Renew Plan</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[washColors.navyStart, washColors.navyEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <Text style={styles.planTitle}>{plan.name} Plan</Text>
          <View style={styles.expiredBadge}>
            <Feather name={isActive ? 'check-circle' : 'clock'} size={ms(12)} color="#fff" />
            <Text style={styles.expiredText}>
              {isActive ? `Active · renews ${renewsOn}` : `Expired ${expiredOn}`}
            </Text>
          </View>
          <Text style={styles.planDescription}>
            Pick a duration below to renew and keep your {formatNaira(plan.price)} / month plan going.
          </Text>
        </LinearGradient>

        {isActive && unusedPickups > 0 && (
          <View style={styles.rolloverCard}>
            <Feather name="repeat" size={ms(16)} color={washColors.textPrimary} style={{ marginTop: ms(2) }} />
            <Text style={styles.rolloverText}>
              You have {unusedPickups} unused pickup{unusedPickups === 1 ? '' : 's'}. Renew before{' '}
              {renewsOn} and {unusedPickups === 1 ? 'it rolls' : 'they roll'} over to your new plan. Once
              your plan expires, unused pickups are lost.
            </Text>
          </View>
        )}

        {!isActive && (
          <View style={styles.rolloverCard}>
            <Feather name="info" size={ms(16)} color={washColors.textPrimary} style={{ marginTop: ms(2) }} />
            <Text style={styles.rolloverText}>
              Your plan has expired, so any unused pickups from it can no longer roll over.
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>CHOOSE DURATION</Text>
        <View style={styles.durationList}>
          {WASH_DURATIONS.map((d) => {
            const isSelected = d.key === selected;
            const dTotal = durationTotal(plan.price, d);
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.durationCard, isSelected && styles.durationCardSelected]}
                activeOpacity={0.85}
                onPress={() => setSelected(d.key)}
              >
                <View style={styles.radioOuter}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <View style={styles.durationInfo}>
                  <Text style={styles.durationLabel}>{d.label}</Text>
                  <Text style={styles.durationSub}>{formatNaira(Math.round(dTotal / d.months))} / month</Text>
                </View>

                <View style={styles.durationRight}>
                  {d.savePct > 0 ? (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>SAVE {d.savePct}%</Text>
                    </View>
                  ) : null}
                  <Text style={styles.durationPrice}>{formatNaira(dTotal)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>WHAT'S INCLUDED</Text>
        <View style={styles.featuresCard}>
          {plan.features.map((label, i) => (
            <View key={label} style={[styles.featureRow, i !== plan.features.length - 1 && styles.featureRowDivider]}>
              <View style={styles.featureIconWrap}>
                <MaterialCommunityIcons name="check" size={ms(18)} color={washColors.navySolid} />
              </View>
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerSummaryLabel}>Total</Text>
          <Text style={styles.footerSummaryPrice}>{formatNaira(total)}</Text>
        </View>
        <TouchableOpacity
          style={styles.renewButton}
          activeOpacity={0.85}
          onPress={handleRenew}
        >
          <Text style={styles.renewButtonText}>Renew Now</Text>
          <Feather name="arrow-right" size={ms(16)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(20) },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(20),
    marginBottom: ms(16),
  },
  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: washColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  planCard: {
    borderRadius: ms(24),
    padding: ms(20),
    marginBottom: ms(24),
  },
  planTitle: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: ms(12) },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    alignSelf: 'flex-start',
    backgroundColor: washColors.overlay,
    borderWidth: 1,
    borderColor: washColors.overlayBorder,
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(14),
    marginBottom: ms(14),
  },
  expiredText: { fontSize: ms(12), fontFamily: fonts.poppins.bold, color: '#fff' },
  planDescription: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(19),
    color: washColors.whiteText85,
  },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: washColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: ms(12),
  },
  sectionSpacing: { marginTop: ms(26) },

  durationList: { gap: ms(10) },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: washColors.surface,
    borderRadius: ms(16),
    borderWidth: 1.5,
    borderColor: washColors.grayBorder,
    paddingVertical: ms(14),
    paddingHorizontal: ms(14),
  },
  durationCardSelected: {
    borderColor: washColors.navySolid,
    backgroundColor: washColors.coveredBg,
  },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: washColors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: washColors.navySolid,
  },
  durationInfo: { flex: 1 },
  durationLabel: { fontSize: ms(14.5), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  durationSub: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: washColors.textSecondary, marginTop: ms(2) },
  durationRight: { alignItems: 'flex-end', gap: ms(4) },
  saveBadge: {
    backgroundColor: washColors.red,
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(10),
  },
  saveBadgeText: { fontSize: ms(9.5), fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.3 },
  durationPrice: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  featuresCard: {
    backgroundColor: washColors.surface,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingVertical: ms(14),
  },
  featureRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: washColors.divider,
  },
  featureIconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: washColors.coveredBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { flex: 1, fontSize: ms(13), fontFamily: fonts.poppins.regular, color: washColors.textPrimary },

  bottomSpacer: { height: ms(100) },

  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: ms(32) },
  emptyTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
    textAlign: 'center',
    marginBottom: ms(8),
  },
  emptyText: {
    fontSize: ms(13),
    lineHeight: ms(20),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    textAlign: 'center',
    marginBottom: ms(20),
  },
  rolloverCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(10),
    backgroundColor: '#FBF3D9',
    borderRadius: ms(16),
    padding: ms(14),
    marginBottom: ms(24),
  },
  rolloverText: {
    flex: 1,
    fontSize: ms(12.5),
    lineHeight: ms(18),
    fontFamily: fonts.poppins.regular,
    color: washColors.textPrimary,
  },
  renewButtonDisabled: { opacity: 0.7 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
    backgroundColor: washColors.background,
    paddingHorizontal: ms(20),
    paddingTop: ms(14),
    borderTopWidth: 1,
    borderTopColor: washColors.divider,
  },
  footerSummary: { flex: 1 },
  footerSummaryLabel: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  footerSummaryPrice: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: washColors.textPrimary, marginTop: ms(2) },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: washColors.red,
    paddingHorizontal: ms(24),
    paddingVertical: ms(16),
    borderRadius: ms(26),
  },
  renewButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});