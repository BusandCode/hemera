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
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';

type PlanId = 'basic' | 'standard' | 'premium' | 'vip';
type PaymentMethod = 'wallet' | 'card';
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
      'Fast pickup and delivery 🚚',
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

const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: 'wallet', label: 'Wallet' },
  { id: 'card', label: 'Card' },
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
  const [step, setStep] = useState<Step>('plans');
  const [selectedId, setSelectedId] = useState<PlanId>('standard');
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [durationKey, setDurationKey] = useState<DurationKey>('3m');

  const selectedPlan = plans.find((p) => p.id === selectedId)!;
  const selectedDuration = durations.find((d) => d.key === durationKey)!;
  const methodLabel = paymentMethods.find((m) => m.id === method)!.label;
  const total = durationTotal(selectedPlan.price, selectedDuration);

  useEffect(() => {
    if (step !== 'duration') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('plans');
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const handlePay = () => {
    router.back();
  };

  if (step === 'duration') {
    return (
      <View style={[styles.dContainer, { paddingTop: insets.top + 12 }]}>
        <StatusBar style="dark" />

        <View style={styles.dTitleRow}>
          <TouchableOpacity style={styles.dBackBtn} onPress={() => setStep('plans')} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color={washColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.dTitle}>Choose Duration</Text>
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
              <Feather name="check-circle" size={12} color="#fff" />
              <Text style={styles.dBadgeText}>{formatNaira(selectedPlan.price)} / month</Text>
            </View>
            <Text style={styles.dPlanDescription}>
              Pick a duration below to start your plan. Longer plans save you more.
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
                style={[styles.includedRow, i !== selectedPlan.features.length - 1 && styles.includedRowDivider]}
              >
                <View style={styles.includedIconWrap}>
                  <Feather name="check" size={16} color={washColors.navySolid} />
                </View>
                <Text style={styles.includedLabel}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dBottomSpacer} />
        </ScrollView>

        <View style={[styles.dFooter, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.dFooterSummary}>
            <Text style={styles.dFooterLabel}>Total · {methodLabel}</Text>
            <Text style={styles.dFooterPrice}>{formatNaira(total)}</Text>
          </View>
          <TouchableOpacity style={styles.dPayButton} activeOpacity={0.85} onPress={handlePay}>
            <Text style={styles.dPayButtonText}>Subscribe Now</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={24} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose your plan</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.savingsCard}>
          <View style={styles.savingsTop}>
            <Feather name="award" size={24} color={foodColors.forestGreen} />
            <Text style={styles.savingsTitle}>Subscribe & Save 20%</Text>
            <View style={styles.bestValuePill}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
          </View>
          {savingsPoints.map((point) => (
            <View key={point} style={styles.savingsRow}>
              <View style={styles.savingsCheck}>
                <Feather name="check" size={11} color="#fff" />
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
                    {selected && <Feather name="check" size={15} color={foodColors.textPrimary} />}
                  </View>
                </View>
              </ImageBackground>

              <View style={styles.planBody}>
                <Text style={styles.planTagline}>{plan.tagline}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: plan.accent }]}>{formatNaira(plan.price)}</Text>
                  <Text style={styles.perMonth}> / month</Text>
                </View>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Feather name="check" size={17} color={plan.accent} style={styles.featureIcon} />
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
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.paymentTile, active && styles.paymentTileActive]}
                activeOpacity={0.85}
                onPress={() => setMethod(m.id)}
              >
                {m.id === 'wallet' ? (
                  <MaterialCommunityIcons
                    name="wallet-outline"
                    size={22}
                    color={active ? foodColors.badgeBlue : foodColors.textPrimary}
                  />
                ) : (
                  <Feather
                    name="credit-card"
                    size={20}
                    color={active ? foodColors.badgeBlue : foodColors.textPrimary}
                  />
                )}
                <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => setStep('duration')}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmText}>Confirm subscription</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
    paddingBottom: 14,
  },
  closeButton: { width: 32, height: 40, justifyContent: 'center' },
  headerTitle: {
    fontSize: 19,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },

  savingsCard: {
    backgroundColor: '#DDF0E4',
    borderWidth: 1,
    borderColor: '#B4DAC2',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  savingsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  savingsTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.forestGreen,
  },
  bestValuePill: {
    backgroundColor: foodColors.forestGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  bestValueText: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.4,
    color: '#fff',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  savingsCheck: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: foodColors.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsText: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },

  planCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    overflow: 'hidden',
    marginBottom: 18,
  },
  planCardSelected: { borderColor: foodColors.badgeBlue },
  planImage: {
    height: 150,
    justifyContent: 'flex-end',
    backgroundColor: '#3A3A3A',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: '#F0B429',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  recommendedText: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textPrimary,
  },
  planImageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  planName: {
    fontSize: 26,
    fontFamily: fonts.poppins.medium,
    color: '#fff',
  },
  radio: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { backgroundColor: '#fff' },

  planBody: { padding: 18 },
  planTagline: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.poppins.regular,
    color: '#55504B',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 14,
  },
  price: { fontSize: 34, fontFamily: fonts.poppins.semiBold },
  perMonth: {
    fontSize: 15,
    fontFamily: fonts.poppins.regular,
    color: '#55504B',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 9,
  },
  featureIcon: { marginTop: 3 },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.poppins.regular,
    color: '#55504B',
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginTop: 10,
    marginBottom: 12,
  },
  paymentRow: { flexDirection: 'row', gap: 12 },
  paymentTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    backgroundColor: foodColors.surface,
  },
  paymentTileActive: { borderColor: foodColors.badgeBlue },
  paymentLabel: {
    fontSize: 14.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  paymentLabelActive: { color: foodColors.badgeBlue },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: foodColors.background,
  },
  confirmButton: {
    backgroundColor: foodColors.badgeBlue,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 17,
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },
  bottomSpacer: { height: 10 },

  dContainer: { flex: 1, backgroundColor: washColors.background },
  dContent: { paddingHorizontal: 20, paddingBottom: 20 },
  dTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: washColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dTitle: { fontSize: 20, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  dPlanCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  dPlanTitle: { fontSize: 20, fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 12 },
  dBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: washColors.overlay,
    borderWidth: 1,
    borderColor: washColors.overlayBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  dBadgeText: { fontSize: 12, fontFamily: fonts.poppins.bold, color: '#fff' },
  dPlanDescription: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    lineHeight: 19,
    color: washColors.whiteText85,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: washColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionSpacing: { marginTop: 26 },

  durationList: { gap: 10 },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: washColors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: washColors.grayBorder,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  durationCardSelected: {
    borderColor: washColors.navySolid,
    backgroundColor: washColors.coveredBg,
  },
  durationRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: washColors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: washColors.navySolid,
  },
  durationInfo: { flex: 1 },
  durationLabel: { fontSize: 14.5, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  durationSub: { fontSize: 12, fontFamily: fonts.poppins.regular, color: washColors.textSecondary, marginTop: 2 },
  durationRight: { alignItems: 'flex-end', gap: 4 },
  saveBadge: {
    backgroundColor: washColors.red,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveBadgeText: { fontSize: 9.5, fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.3 },
  durationPrice: { fontSize: 14, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  includedCard: {
    backgroundColor: washColors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  includedRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: washColors.divider,
  },
  includedIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: washColors.coveredBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  includedLabel: { flex: 1, fontSize: 13, fontFamily: fonts.poppins.regular, color: washColors.textPrimary },

  dBottomSpacer: { height: 100 },

  dFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: washColors.background,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: washColors.divider,
  },
  dFooterSummary: { flex: 1 },
  dFooterLabel: { fontSize: 12, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  dFooterPrice: { fontSize: 20, fontFamily: fonts.poppins.bold, color: washColors.textPrimary, marginTop: 2 },
  dPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: washColors.red,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 26,
  },
  dPayButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});