import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React from 'react';

import { EPlanHeader } from '../src/components/eplan/EPlanHeader';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useProfile } from '../src/context/ProfileContext';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const ACCENT_BLUE = '#1E3FEA';

// TODO: wire this up to a real wallet balance once a WalletContext exists —
// there's no wallet source in AppDataContext/AuthContext yet.
const WALLET_BALANCE = 45000;

// Mock data representing the selections from the previous steps
const MOCK_PLAN_DATA = {
  amount: 20000,
  duration: '1 Week',
  estimatedMeals: '4–6 Surprises',
  exclusions: 'Pork, No Meat (Veg)',
  deliveryWindow: 'Lunch + Dinner',
  starts: 'Today, May 20',
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

type PaymentMethod = 'wallet' | 'card' | 'transfer';

export default function EPlanReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  // State for the selected payment method (defaults to wallet as per design)
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>('wallet');

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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Setup E-Plan</Text>
        </View>

        <Text style={styles.subtitle}>Step 3 of 3 — Review & Pay</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressLabel}>100%</Text>

        {/* Wallet Lock Notice */}
        <Text style={styles.sectionLabel}>WALLET LOCK NOTICE</Text>
        <View style={styles.noticeBox}>
          <View style={styles.noticeIconContainer}>
            <Feather name="lock" size={20} color="#fff" />
          </View>
          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>Your funds will be securely locked</Text>
            <Text style={styles.noticeBody}>
              Once you lock your wallet, these funds will be dedicated to your E-Plan and can't be used elsewhere until the plan ends or is cancelled.
            </Text>
          </View>
        </View>

        {/* Plan Summary */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>YOUR E-PLAN SUMMARY</Text>
        <View style={styles.summaryCard}>
          <SummaryRow icon="list" label="Plan" value="E-Plan" />
          <SummaryRow icon="dollar-sign" label="Amount" value={formatNaira(MOCK_PLAN_DATA.amount)} isBold />
          <SummaryRow icon="calendar" label="Duration" value={MOCK_PLAN_DATA.duration} />
          <SummaryRow icon="pie-chart" label="Estimated Meals" value={MOCK_PLAN_DATA.estimatedMeals} />
          <SummaryRow icon="slash" label="Exclusions" value={MOCK_PLAN_DATA.exclusions} />
          <SummaryRow icon="clock" label="Delivery Window" value={MOCK_PLAN_DATA.deliveryWindow} />
          <SummaryRow icon="calendar" label="Starts" value={MOCK_PLAN_DATA.starts} isLast />
        </View>

        {/* Payment Method */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>PAY WITH</Text>

        <PaymentOption
          id="wallet"
          title="Hemera Wallet"
          subtitle={`Balance: ${formatNaira(WALLET_BALANCE)}`}
          icon="wallet"
          isSelected={selectedMethod === 'wallet'}
          onSelect={setSelectedMethod}
        />

        <PaymentOption
          id="card"
          title="Debit Card"
          subtitle="Visa ending •••• 4521"
          icon="credit-card"
          isSelected={selectedMethod === 'card'}
          onSelect={setSelectedMethod}
        />

        <PaymentOption
          id="transfer"
          title="Bank Transfer"
          subtitle="Make payment from your bank"
          icon="bank"
          isSelected={selectedMethod === 'transfer'}
          onSelect={setSelectedMethod}
        />

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => {
            // TODO: Handle final submission logic
            console.log('Locking funds and activating plan...');
          }}
        >
          <Feather name="lock" size={16} color="#fff" style={styles.btnIcon} />
          <Text style={styles.primaryBtnText}>
            Lock {formatNaira(MOCK_PLAN_DATA.amount)} & Activate
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// --- Sub-components ---

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

function PaymentOption({
  id,
  title,
  subtitle,
  icon,
  isSelected,
  onSelect,
}: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isSelected: boolean;
  onSelect: (id: PaymentMethod) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.paymentCard, isSelected && styles.paymentCardSelected]}
      activeOpacity={0.8}
      onPress={() => onSelect(id)}
    >
      <View style={[styles.paymentIconBox, isSelected && styles.paymentIconBoxSelected]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={isSelected ? '#fff' : ACCENT_BLUE}
        />
      </View>
      <View style={styles.paymentTextContainer}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: { fontSize: 27, fontFamily: serif, fontWeight: '700', color: foodColors.textPrimary },
  subtitle: { fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: 18 },

  progressTrack: { height: 4, borderRadius: 2, backgroundColor: foodColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: foodColors.primary, borderRadius: 2 },
  progressLabel: {
    alignSelf: 'center',
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: 6,
    marginBottom: 24,
  },

  sectionLabel: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.6, marginBottom: 10 },
  sectionSpacing: { marginTop: 26 },

  // Wallet Lock Notice
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#161311',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  noticeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  noticeTextContainer: { flex: 1 },
  noticeTitle: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 4 },
  noticeBody: { fontSize: 12, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },

  // Summary Card
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

  // Payment Options
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    padding: 16,
    marginBottom: 12,
  },
  paymentCardSelected: {
    borderColor: ACCENT_BLUE,
    backgroundColor: 'rgba(30,63,234,0.03)',
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(30,63,234,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paymentIconBoxSelected: {
    backgroundColor: ACCENT_BLUE,
  },
  paymentTextContainer: { flex: 1 },
  paymentTitle: { fontSize: 14, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 2 },
  paymentSubtitle: { fontSize: 12, fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: ACCENT_BLUE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT_BLUE,
  },

  // CTA Button
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: foodColors.primary, // Red color from design
    borderRadius: 26,
    paddingVertical: 16,
    marginTop: 20,
  },
  btnIcon: { marginRight: 8 },
  primaryBtnText: { fontSize: 15, fontFamily: fonts.poppins.bold, color: '#fff' },
});