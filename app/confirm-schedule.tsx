import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';

type PaymentMethod = {
  id: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'wallet',
    label: 'Wallet',
    subtitle: 'Pay from your BusandCode wallet',
    icon: 'credit-card',
  },
  {
    id: 'card',
    label: 'Card',
    subtitle: 'Pay with a saved or new card',
    icon: 'credit-card',
  },
  {
    id: 'transfer',
    label: 'Bank Transfer',
    subtitle: 'Transfer to a one-time account',
    icon: 'repeat',
  },
];

const EXPRESS_FEE = 1500;
const BASE_FEE = 3500;

function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-US')}`;
}

export default function ConfirmScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pickupDate?: string;
    pickupTime?: string;
    pickupSlotId?: string;
    pickupAddress?: string;
    express?: string;
    itemCount?: string;
    itemSummary?: string;
  }>();

  const pickupDate = params.pickupDate ?? '—';
  const pickupTime = params.pickupTime ?? '—';
  const pickupAddress = params.pickupAddress ?? '—';
  const isExpress = params.express === 'true';
  const itemCount = parseInt(params.itemCount ?? '0', 10);

  const [selectedMethod, setSelectedMethod] = useState('wallet');
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const expressFee = isExpress ? EXPRESS_FEE : 0;
  const total = BASE_FEE + expressFee;

  const canPay = agreed && !processing;

  const handlePayAndConfirm = () => {
    if (!canPay) return;

    setProcessing(true);

    // Simulate payment processing — swap for your real payment call.
    setTimeout(() => {
      setProcessing(false);
      Alert.alert(
        'Pickup Scheduled',
        `Your pickup for ${pickupDate} (${pickupTime}) has been confirmed.`,
        [
          {
            text: 'View Schedule',
            onPress: () => router.replace('/schedule' as any),
          },
        ]
      );
    }, 1200);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={ms(18)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm & Pay</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pickup summary */}
        <Text style={styles.sectionLabel}>PICKUP DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <Feather name="calendar" size={ms(16)} color={washColors.navySolid} />
            </View>
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{pickupDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <Feather name="clock" size={ms(16)} color={washColors.navySolid} />
            </View>
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>Time slot</Text>
              <Text style={styles.summaryValue}>{pickupTime}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <Feather name="map-pin" size={ms(16)} color={washColors.navySolid} />
            </View>
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>Pickup address</Text>
              <Text style={styles.summaryValue}>{pickupAddress}</Text>
            </View>
          </View>

          {itemCount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryIconWrap}>
                  <MaterialCommunityIcons
                    name="washing-machine"
                    size={ms(16)}
                    color={washColors.navySolid}
                  />
                </View>
                <View style={styles.summaryTextBlock}>
                  <Text style={styles.summaryLabel}>Items</Text>
                  <Text style={styles.summaryValue}>
                    {itemCount} item{itemCount > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Payment method */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>
          PAYMENT METHOD
        </Text>
        <View style={styles.methodsList}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                activeOpacity={0.85}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodIconWrap}>
                  <Feather name={method.icon} size={ms(18)} color={washColors.navySolid} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price breakdown */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>
          PRICE BREAKDOWN
        </Text>
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Standard pickup & delivery</Text>
            <Text style={styles.priceValue}>{formatNaira(BASE_FEE)}</Text>
          </View>

          {isExpress && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Express delivery</Text>
              <Text style={styles.priceValue}>{formatNaira(EXPRESS_FEE)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total</Text>
            <Text style={styles.priceTotalValue}>{formatNaira(total)}</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsBox}>
          <View style={styles.termsHeader}>
            <Feather name="shield" size={ms(15)} color={washColors.textPrimary} />
            <Text style={styles.termsTitle}>Before you pay</Text>
          </View>
          <Text style={styles.termsBullet}>
            • A missed pickup counts toward your monthly allowance.
          </Text>
          <Text style={styles.termsBullet}>
            • Have your laundry bagged and ready at the scheduled time.
          </Text>
          <Text style={styles.termsBullet}>
            • Delivery returns to the address on file unless updated.
          </Text>

          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => setAgreed((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Feather name="check" size={ms(13)} color="#fff" />}
            </View>
            <Text style={styles.agreeText}>
              I agree to the pickup terms & conditions
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.footerSummary}>
          <Text style={styles.footerSummaryLabel}>Total to pay</Text>
          <Text style={styles.footerSummaryPrice}>{formatNaira(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, !canPay && styles.payButtonDisabled]}
          onPress={handlePayAndConfirm}
          disabled={!canPay}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Pay & Confirm</Text>
              <Feather name="arrow-right" size={ms(16)} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(20) },

  header: {
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
  headerTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: washColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: ms(10),
  },
  sectionSpacing: { marginTop: ms(24) },

  card: {
    backgroundColor: washColors.surface,
    borderRadius: ms(18),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(12),
  },
  summaryIconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextBlock: { flex: 1, minWidth: 0 },
  summaryLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  summaryValue: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
    marginTop: ms(2),
  },
  divider: {
    height: 1,
    backgroundColor: washColors.divider,
    marginVertical: ms(12),
  },

  methodsList: { gap: ms(10) },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: washColors.surface,
    borderRadius: ms(16),
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: ms(14),
    paddingHorizontal: ms(14),
  },
  methodCardSelected: {
    borderColor: washColors.navySolid,
    backgroundColor: washColors.coveredBg,
  },
  methodIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(11),
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: { flex: 1, minWidth: 0 },
  methodLabel: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  methodSubtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: ms(2),
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
  radioOuterActive: { borderColor: washColors.navySolid },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: washColors.navySolid,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ms(5),
  },
  priceLabel: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  priceValue: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },
  priceTotalLabel: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  priceTotalValue: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.bold,
    color: washColors.navySolid,
  },

  termsBox: {
    backgroundColor: '#FBF3D9',
    borderRadius: ms(18),
    padding: ms(16),
    marginTop: ms(24),
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(10),
  },
  termsTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  termsBullet: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(18),
    color: washColors.textSecondary,
    marginBottom: ms(6),
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginTop: ms(8),
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
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
    flex: 1,
  },

  bottomSpacer: { height: ms(100) },

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
  footerSummaryLabel: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  footerSummaryPrice: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
    marginTop: ms(2),
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: washColors.red,
    paddingHorizontal: ms(24),
    paddingVertical: ms(16),
    borderRadius: ms(26),
    minWidth: ms(160),
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: washColors.grayBorder,
  },
  payButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});