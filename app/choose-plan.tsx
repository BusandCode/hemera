import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

type PlanId = 'basic' | 'standard' | 'premium' | 'vip';
type PaymentMethod = 'wallet' | 'card';

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

export default function ChoosePlanScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<PlanId>('standard');
  const [method, setMethod] = useState<PaymentMethod>('wallet');
  const [confirmVisible, setConfirmVisible] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selectedId)!;
  const methodLabel = paymentMethods.find((m) => m.id === method)!.label;

  const handleConfirm = () => {
    setConfirmVisible(false);
  };

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
          onPress={() => setConfirmVisible(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmText}>Confirm subscription</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setConfirmVisible(false)} />

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={[styles.sheetIcon, { backgroundColor: `${selectedPlan.accent}1F` }]}>
              <MaterialCommunityIcons name="washing-machine" size={28} color={selectedPlan.accent} />
            </View>

            <Text style={styles.sheetTitle}>Confirm your subscription</Text>
            <Text style={styles.sheetSubtitle}>Review the details below before you continue.</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Plan</Text>
                <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Billing</Text>
                <Text style={styles.summaryValue}>Monthly</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pay with</Text>
                <View style={styles.methodValue}>
                  {method === 'wallet' ? (
                    <MaterialCommunityIcons name="wallet-outline" size={16} color={foodColors.textPrimary} />
                  ) : (
                    <Feather name="credit-card" size={15} color={foodColors.textPrimary} />
                  )}
                  <Text style={styles.summaryValue}>{methodLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total due today</Text>
              <Text style={styles.totalValue}>{formatNaira(selectedPlan.price)}</Text>
            </View>

            <TouchableOpacity style={styles.sheetPrimary} onPress={handleConfirm} activeOpacity={0.9}>
              <Text style={styles.sheetPrimaryText}>Pay {formatNaira(selectedPlan.price)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetSecondary}
              onPress={() => setConfirmVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20,20,30,0.5)',
  },
  sheet: {
    backgroundColor: foodColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: foodColors.border,
    marginBottom: 22,
  },
  sheetIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  summaryCard: {
    alignSelf: 'stretch',
    backgroundColor: foodColors.background,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  summaryDivider: { height: 1, backgroundColor: foodColors.border },
  summaryLabel: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  methodValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },
  totalValue: {
    fontSize: 22,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  sheetPrimary: {
    alignSelf: 'stretch',
    backgroundColor: foodColors.badgeBlue,
    paddingVertical: 17,
    borderRadius: 30,
    alignItems: 'center',
  },
  sheetPrimaryText: {
    fontSize: 16,
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },
  sheetSecondary: {
    alignSelf: 'stretch',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  sheetSecondaryText: {
    fontSize: 14.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
});