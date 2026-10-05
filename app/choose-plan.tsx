import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  BackHandler,
  Platform,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { useAuth } from '../src/context/AuthContext';
import { useReferral } from '../src/context/ReferralContext';
import { REFERRAL_LAUNDRY_PERCENT } from '../src/constants/referral';
import { ms } from '../src/utils/responsive';

type PlanId = 'basic' | 'standard' | 'premium' | 'vip';
type PaymentMethod = 'transfer' | 'card';
type DurationKey = '1m' | '3m' | '6m' | '12m';
type Step = 'plans' | 'duration';

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  accent: string;
  image: string;
  recommended?: boolean;
  features: string[];
};

type Duration = {
  key: DurationKey;
  label: string;
  months: number;
  savePct: number;
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For small households or single professionals',
    price: 17000,
    accent: '#255DDE',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    features: [
      '2 pickups per month',
      '14 items per month',
      '2 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Standard turnaround (24 hrs)',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Most popular plan for couples & busy homes',
    price: 26000,
    accent: '#255DDE',
    recommended: true,
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80',
    features: [
      'Up to 3 pickups per month',
      '25 items per month',
      '3 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Priority 24 hr turnaround',
      'Personal branded bag',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'White glove care for families & high volume needs',
    price: 35000,
    accent: '#D64545',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80',
    features: [
      'Up to 4 pickups per month',
      '45 items per month',
      '4 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Same day express turnaround',
      'Personal Hemera premium bag',
      'Dedicated support line',
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    tagline: 'Our highest tier with priority everything',
    price: 110000,
    accent: '#E0B43F',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80',
    features: [
      'Up to 6 pickups per month',
      '85 items per month',
      '6 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Same day express turnaround (24 hrs)',
      'Personal Hemera VIP bag',
      'Fast pickup and delivery',
      'Dedicated support line',
    ],
  },
];

const durations: Duration[] = [
  { key: '1m', label: '1 Month', months: 1, savePct: 0 },
  { key: '3m', label: '3 Months', months: 3, savePct: 11 },
  { key: '6m', label: '6 Months', months: 6, savePct: 19 },
  { key: '12m', label: '12 Months', months: 12, savePct: 28 },
];

const savingsPoints = [
  'Enjoy consistent clean with monthly plans',
  'Unlock priority scheduling',
  'Save up to 20% on every order',
];

const paymentMethods: { id: PaymentMethod; label: string; comingSoon?: boolean }[] = [
  { id: 'transfer', label: 'Transfer' },
  { id: 'card', label: 'Card', comingSoon: true },
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function durationTotal(monthly: number, d: Duration) {
  const raw = monthly * d.months * (1 - d.savePct / 100);
  return Math.round(raw / 100) * 100;
}

export default function ChoosePlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSwitch = mode === 'switch';
  const { session } = useAuth();
  const { rewards } = useReferral();
  const [step, setStep] = useState<Step>('plans');
  const [selectedId, setSelectedId] = useState<PlanId>('standard');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [durationKey, setDurationKey] = useState<DurationKey>('3m');
  const [agreed, setAgreed] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedId)!;
  const selectedDuration = durations.find((d) => d.key === durationKey)!;
  const methodLabel = paymentMethods.find((m) => m.id === method)!.label;
  const subtotal = durationTotal(selectedPlan.price, selectedDuration);
  const laundryReward = rewards.laundry;
  const referralDiscount = laundryReward
    ? Math.round((subtotal * REFERRAL_LAUNDRY_PERCENT) / 100)
    : 0;
  const total = subtotal - referralDiscount;

  useEffect(() => {
    if (step !== 'duration') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('plans');
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const selectMethod = (m: { id: PaymentMethod; label: string; comingSoon?: boolean }) => {
    if (m.comingSoon) {
      Alert.alert(
        'Coming soon',
        `${m.label} payments are coming soon. Please use Transfer for now.`
      );
      return;
    }
    setMethod(m.id);
  };

  const handlePay = () => {
    if (!agreed) return;

    const ref = `WSH-${Math.floor(100000 + Math.random() * 900000)}`;

    const draft = {
      kind: 'subscription',
      metadata: {
        ref,
        kind: 'subscription',
        title: `${selectedPlan.name} Plan · ${selectedDuration.label}`,
        plan_id: selectedPlan.id,
        duration_months: selectedDuration.months,
        subtotal,
        total,
        payment_method: method,
        customer_email: session?.user.email ?? '',
        ...(isSwitch && { switch: true }),
        ...(laundryReward && {
          referral_reward_id: laundryReward.id,
          referral_discount: referralDiscount,
        }),
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

  if (step === 'duration') {
    return (
      <View style={[styles.dContainer, { paddingTop: insets.top + 12 }]}>
        <StatusBar style="dark" />

        <View style={styles.dTitleRow}>
          <TouchableOpacity
            style={styles.dBackBtn}
            onPress={() => setStep('plans')}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={ms(18)} color={washColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.dTitle}>
            {isSwitch ? 'Switch Plan' : 'Choose Duration'}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.dContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[washColors.navyStart, washColors.navyEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dPlanCard}
          >
            <Text style={styles.dPlanTitle}>{selectedPlan.name} Plan</Text>
            <View style={styles.dBadge}>
              <Feather name="check-circle" size={ms(12)} color="#fff" />
              <Text style={styles.dBadgeText}>{formatNaira(selectedPlan.price)} / month</Text>
            </View>
            <Text style={styles.dPlanDescription}>
              {isSwitch
                ? 'Pick a duration for your new plan. Your old plan will be replaced and unused items will roll over.'
                : 'Pick a duration below to start your plan. Longer plans save you more.'}
            </Text>
          </LinearGradient>

          <Text style={styles.sectionLabel}>CHOOSE DURATION</Text>
          <View style={styles.durationList}>
            {durations.map((d) => {
              const active = d.key === durationKey;
              const dTotal = durationTotal(selectedPlan.price, d);
              const perMonthValue = Math.round(dTotal / d.months);
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.durationCard, active && styles.durationCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setDurationKey(d.key)}
                >
                  <View style={styles.durationRadio}>
                    {active && <View style={styles.durationRadioDot} />}
                  </View>

                  <View style={styles.durationInfo}>
                    <Text style={styles.durationLabel}>{d.label}</Text>
                    <Text style={styles.durationSub}>{formatNaira(perMonthValue)} / month</Text>
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
          <View style={styles.includedCard}>
            {selectedPlan.features.map((feature, i) => (
              <View
                key={feature}
                style={[
                  styles.includedRow,
                  i !== selectedPlan.features.length - 1 && styles.includedRowDivider,
                ]}
              >
                <View style={styles.includedIconWrap}>
                  <Feather name="check" size={ms(16)} color={washColors.navySolid} />
                </View>
                <Text style={styles.includedLabel}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.termsBox}
            onPress={() => setAgreed((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Feather name="check" size={ms(13)} color="#fff" />}
            </View>
            <Text style={styles.agreeText}>
              By ticking this box, you agree to our{' '}
              <Text
                style={styles.agreeLink}
                onPress={() => router.push('/terms' as any)}
                suppressHighlighting
              >
                Terms & Conditions
              </Text>
              .
            </Text>
          </TouchableOpacity>

          <View style={styles.dBottomSpacer} />
        </ScrollView>

        <View style={[styles.dFooter, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.dFooterSummary}>
            <Text style={styles.dFooterLabel}>
              Total · {methodLabel}
              {referralDiscount > 0 ? ` · ${REFERRAL_LAUNDRY_PERCENT}% referral reward` : ''}
            </Text>
            <Text style={styles.dFooterPrice}>{formatNaira(total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.dPayButton, !agreed && styles.dPayButtonDisabled]}
            activeOpacity={0.85}
            onPress={handlePay}
            disabled={!agreed}
          >
            <Text style={[styles.dPayButtonText, !agreed && styles.dPayButtonTextDisabled]}>
              {isSwitch ? 'Switch Plan' : 'Subscribe Now'}
            </Text>
            <Feather
              name="arrow-right"
              size={ms(16)}
              color={agreed ? '#fff' : washColors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={ms(24)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSwitch ? 'Switch your plan' : 'Choose your plan'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.savingsCard}>
          <View style={styles.savingsTop}>
            <Feather name="award" size={ms(24)} color={foodColors.forestGreen} />
            <Text style={styles.savingsTitle}>Subscribe & Save 20%</Text>
            <View style={styles.bestValuePill}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
          </View>
          {savingsPoints.map((point) => (
            <View key={point} style={styles.savingsRow}>
              <View style={styles.savingsCheck}>
                <Feather name="check" size={ms(11)} color="#fff" />
              </View>
              <Text style={styles.savingsText}>{point}</Text>
            </View>
          ))}
        </View>

        {plans.map((plan) => {
          const selected = plan.id === selectedId;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selected && styles.planCardSelected]}
              activeOpacity={0.9}
              onPress={() => setSelectedId(plan.id)}
            >
              <ImageBackground source={{ uri: plan.image }} style={styles.planImage}>
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
                  style={StyleSheet.absoluteFill}
                />
                {plan.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}
                <View style={styles.planImageFooter}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && (
                      <Feather name="check" size={ms(15)} color={foodColors.textPrimary} />
                    )}
                  </View>
                </View>
              </ImageBackground>

              <View style={styles.planBody}>
                <Text style={styles.planTagline}>{plan.tagline}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: plan.accent }]}>
                    {formatNaira(plan.price)}
                  </Text>
                  <Text style={styles.perMonth}> / month</Text>
                </View>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Feather name="check" size={ms(17)} color={plan.accent} style={styles.featureIcon} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionTitle}>Payment method</Text>
        <View style={styles.paymentRow}>
          {paymentMethods.map((m) => {
            const active = m.id === method;
            const iconColor = m.comingSoon
              ? '#9A9A9A'
              : active
                ? foodColors.badgeBlue
                : foodColors.textPrimary;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.paymentTile,
                  active && styles.paymentTileActive,
                  m.comingSoon && styles.paymentTileDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => selectMethod(m)}
              >
                {m.id === 'transfer' ? (
                  <MaterialCommunityIcons name="bank-transfer" size={ms(24)} color={iconColor} />
                ) : (
                  <Feather name="credit-card" size={ms(20)} color={iconColor} />
                )}
                <Text
                  style={[
                    styles.paymentLabel,
                    active && styles.paymentLabelActive,
                    m.comingSoon && styles.paymentLabelDisabled,
                  ]}
                >
                  {m.label}
                </Text>
                {m.comingSoon && (
                  <View style={styles.soonPill}>
                    <Text style={styles.soonText}>SOON</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => setStep('duration')}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmText}>
            {isSwitch ? 'Switch Plan' : 'Confirm subscription'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingTop: ms(8), paddingBottom: ms(20) },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(24),
    paddingHorizontal: ms(20),
    paddingBottom: ms(14),
  },
  closeButton: { width: ms(32), height: ms(40), justifyContent: 'center' },
  headerTitle: {
    fontSize: ms(19),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },

  savingsCard: {
    backgroundColor: '#DDF0E4',
    borderWidth: 1,
    borderColor: '#B4DAC2',
    borderRadius: ms(22),
    padding: ms(18),
    marginBottom: ms(18),
  },
  savingsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginBottom: ms(14),
  },
  savingsTitle: {
    flex: 1,
    fontSize: ms(20),
    lineHeight: ms(26),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.forestGreen,
  },
  bestValuePill: {
    backgroundColor: foodColors.forestGreen,
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(14),
  },
  bestValueText: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.4,
    color: '#fff',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginTop: ms(8),
  },
  savingsCheck: {
    width: ms(19),
    height: ms(19),
    borderRadius: ms(10),
    backgroundColor: foodColors.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsText: {
    flex: 1,
    fontSize: ms(14.5),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },

  planCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(24),
    borderWidth: 1.5,
    borderColor: foodColors.border,
    overflow: 'hidden',
    marginBottom: ms(18),
  },
  planCardSelected: { borderColor: foodColors.badgeBlue },
  planImage: {
    height: ms(150),
    justifyContent: 'flex-end',
    backgroundColor: '#3A3A3A',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: '#F0B429',
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(14),
  },
  recommendedText: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textPrimary,
  },
  planImageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(16),
    paddingBottom: ms(14),
  },
  planName: {
    fontSize: ms(26),
    fontFamily: fonts.poppins.medium,
    color: '#fff',
  },
  radio: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    borderWidth: 2.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { backgroundColor: '#fff' },

  planBody: { padding: ms(18) },
  planTagline: {
    fontSize: ms(15),
    lineHeight: ms(22),
    fontFamily: fonts.poppins.regular,
    color: '#55504B',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: ms(12),
    marginBottom: ms(14),
  },
  price: { fontSize: ms(34), fontFamily: fonts.poppins.semiBold },
  perMonth: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.regular,
    color: '#55504B',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(12),
    marginBottom: ms(9),
  },
  featureIcon: { marginTop: ms(3) },
  featureText: {
    flex: 1,
    fontSize: ms(15),
    lineHeight: ms(22),
    fontFamily: fonts.poppins.regular,
    color: '#55504B',
  },

  sectionTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginTop: ms(10),
    marginBottom: ms(12),
  },
  paymentRow: { flexDirection: 'row', gap: ms(12) },
  paymentTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(10),
    paddingVertical: ms(16),
    borderRadius: ms(16),
    borderWidth: 1.5,
    borderColor: foodColors.border,
    backgroundColor: foodColors.surface,
  },
  paymentTileActive: { borderColor: foodColors.badgeBlue },
  paymentTileDisabled: { opacity: 0.6 },
  paymentLabel: {
    fontSize: ms(14.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  paymentLabelActive: { color: foodColors.badgeBlue },
  paymentLabelDisabled: { color: '#9A9A9A' },
  soonPill: {
    backgroundColor: '#F0B429',
    paddingHorizontal: ms(7),
    paddingVertical: ms(2),
    borderRadius: ms(8),
  },
  soonText: {
    fontSize: ms(9.5),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.4,
    color: foodColors.textPrimary,
  },

  footer: {
    paddingHorizontal: ms(20),
    paddingTop: ms(12),
    backgroundColor: foodColors.background,
  },
  confirmButton: {
    backgroundColor: foodColors.badgeBlue,
    paddingVertical: ms(18),
    borderRadius: ms(30),
    alignItems: 'center',
  },
  confirmText: {
    fontSize: ms(17),
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },
  bottomSpacer: { height: ms(10) },

  dContainer: { flex: 1, backgroundColor: washColors.background },
  dContent: { paddingHorizontal: ms(20), paddingBottom: ms(20) },
  dTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(20),
    marginBottom: ms(16),
  },
  dBackBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: washColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  dPlanCard: { borderRadius: ms(24), padding: ms(20), marginBottom: ms(24) },
  dPlanTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: ms(12),
  },
  dBadge: {
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
  dBadgeText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  dPlanDescription: {
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
  durationRadio: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: washColors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationRadioDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: washColors.navySolid,
  },
  durationInfo: { flex: 1 },
  durationLabel: {
    fontSize: ms(14.5),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  durationSub: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: ms(2),
  },
  durationRight: { alignItems: 'flex-end', gap: ms(4) },
  saveBadge: {
    backgroundColor: washColors.red,
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(10),
  },
  saveBadgeText: {
    fontSize: ms(9.5),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },
  durationPrice: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  includedCard: {
    backgroundColor: washColors.surface,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingVertical: ms(14),
  },
  includedRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: washColors.divider,
  },
  includedIconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: washColors.coveredBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  includedLabel: {
    flex: 1,
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: washColors.textPrimary,
  },

  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: '#FBF3D9',
    borderRadius: ms(16),
    paddingVertical: ms(14),
    paddingHorizontal: ms(16),
    marginTop: ms(24),
  },
  checkbox: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(5),
    borderWidth: 1.5,
    borderColor: washColors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: washColors.navySolid,
    borderColor: washColors.navySolid,
  },
  agreeText: {
    flex: 1,
    fontSize: ms(12.5),
    lineHeight: ms(18),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  agreeLink: {
    fontFamily: fonts.poppins.bold,
    color: washColors.navySolid,
    textDecorationLine: 'underline',
  },

  dBottomSpacer: { height: ms(100) },

  dFooter: {
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
  dFooterSummary: { flex: 1 },
  dFooterLabel: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  dFooterPrice: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
    marginTop: ms(2),
  },
  dPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: washColors.red,
    paddingHorizontal: ms(24),
    paddingVertical: ms(16),
    borderRadius: ms(26),
  },
  dPayButtonDisabled: { backgroundColor: washColors.grayBorder },
  dPayButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  dPayButtonTextDisabled: { color: washColors.textMuted },
});