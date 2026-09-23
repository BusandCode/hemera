// app/checkout.tsx
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useCart } from '../src/context/CartContext';
import { useLocation } from '../src/context/LocationContext';
import { useAppData } from '../src/context/AppDataContext';

const DELIVERY_FEE = 500;
const SERVICE_FEE = 200;

const TIME_SLOTS = [
  'As soon as possible',
  'In 30 minutes',
  'In 1 hour',
  'Later today',
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ promoApplied?: string; discount?: string }>();
  const { lines, itemCount, total: itemsTotal, clear } = useCart();
  const { formatted } = useLocation();
  const { addresses, cards } = useAppData();

  const defaultAddress =
    addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const defaultCard =
    cards.find((c) => c.isDefault) ?? cards[0] ?? null;

  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? '');
  const [selectedCardId, setSelectedCardId] = useState(defaultCard?.id ?? '');
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [placing, setPlacing] = useState(false);

  const promoApplied = params.promoApplied === '1';
  const discount = Number(params.discount ?? 0);

  const { total } = useMemo(() => {
    const base = itemsTotal - discount;
    return { total: base + (lines.length > 0 ? DELIVERY_FEE + SERVICE_FEE : 0) };
  }, [itemsTotal, discount, lines.length]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress;
  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? defaultCard;

  const canPlace =
    lines.length > 0 && !!selectedAddress && !!selectedCard && !placing;

  const handlePlaceOrder = () => {
    if (!canPlace) return;
    setPlacing(true);

    const orderId = `#${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      clear();
      setPlacing(false);
      router.replace({
        pathname: '/order-success',
        params: {
          orderId,
          total: String(total),
          items: String(itemCount),
          slot,
        },
      } as any);
    }, 900);
  };

  if (lines.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyWrap}>
          <Feather name="shopping-bag" size={40} color={foodColors.textMuted} />
          <Text style={styles.emptyTitle}>Nothing to check out</Text>
          <Text style={styles.emptySubtitle}>
            Your cart is empty. Add items from the menu first.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.replace('/echop' as any)}
          >
            <Text style={styles.emptyBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address */}
        <Text style={styles.sectionLabel}>Deliver to</Text>
        <View style={styles.group}>
          {addresses.map((addr, i) => {
            const active = addr.id === selectedAddressId;
            const isLast = i === addresses.length - 1;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[styles.row, isLast && styles.rowLast]}
                onPress={() => setSelectedAddressId(addr.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <Feather name={addr.icon} size={16} color={foodColors.primary} />
                </View>
                <View style={styles.rowTextBlock}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.rowTitle}>{addr.label}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultPill}>
                        <Text style={styles.defaultPillText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {addr.line}, {addr.details}
                  </Text>
                </View>
                {active && (
                  <Feather name="check-circle" size={18} color={foodColors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => router.push('/add-address' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name="plus" size={16} color={foodColors.primary} />
            </View>
            <Text style={styles.rowTitle}>Add new address</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery time */}
        <Text style={styles.sectionLabel}>Delivery time</Text>
        <View style={styles.slotRow}>
          {TIME_SLOTS.map((s) => {
            const active = s === slot;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.slotPill, active && styles.slotPillActive]}
                onPress={() => setSlot(s)}
                activeOpacity={0.85}
              >
                <Text style={[styles.slotText, active && styles.slotTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment method */}
        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.group}>
          {cards.map((card, i) => {
            const active = card.id === selectedCardId;
            const isLast = i === cards.length - 1;
            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.row, isLast && styles.rowLast]}
                onPress={() => setSelectedCardId(card.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="credit-card-chip-outline"
                    size={16}
                    color={foodColors.primary}
                  />
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowTitle}>
                    {card.brand} •••• {card.last4}
                  </Text>
                  <Text style={styles.rowSubtitle}>Expires {card.expiry}</Text>
                </View>
                {active && (
                  <Feather name="check-circle" size={18} color={foodColors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={() => router.push('/add-payment-method' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name="plus" size={16} color={foodColors.primary} />
            </View>
            <Text style={styles.rowTitle}>Add payment method</Text>
          </TouchableOpacity>
        </View>

        {/* Items preview */}
        <Text style={styles.sectionLabel}>Items ({itemCount})</Text>
        <View style={styles.group}>
          {lines.map(({ item, qty }, i) => {
            const isLast = i === lines.length - 1;
            return (
              <View key={item.id} style={[styles.row, isLast && styles.rowLast]}>
                <View style={styles.qtyBubble}>
                  <Text style={styles.qtyBubbleText}>{qty}×</Text>
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {item.partnerName}
                  </Text>
                </View>
                <Text style={styles.rowPrice}>
                  {formatNaira(item.price * qty)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <Text style={styles.sectionLabel}>Order summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatNaira(itemsTotal)}</Text>
          </View>
          {promoApplied && discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountLabel]}>
                -{formatNaira(discount)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>{formatNaira(DELIVERY_FEE)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service fee</Text>
            <Text style={styles.summaryValue}>{formatNaira(SERVICE_FEE)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatNaira(total)}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.footerTotalBlock}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>{formatNaira(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeBtn, !canPlace && styles.placeBtnDisabled]}
          disabled={!canPlace}
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeBtnText}>Place Order</Text>
              <Feather name="check" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5.5%',
    paddingTop: Platform.OS === 'ios' ? 6 : 16,
    paddingBottom: 14,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },

  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowTextBlock: { flex: 1, minWidth: 0 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },
  rowPrice: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPill: {
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultPillText: {
    fontSize: 9.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },

  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: foodColors.surface,
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  slotPillActive: {
    backgroundColor: foodColors.primaryDark,
    borderColor: foodColors.primaryDark,
  },
  slotText: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  slotTextActive: { color: '#fff' },

  qtyBubble: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBubbleText: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },

  summaryCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  discountLabel: { color: foodColors.success },
  summaryDivider: { height: 1, backgroundColor: foodColors.border, marginVertical: 6 },
  totalLabel: { fontSize: 15, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  totalValue: { fontSize: 17, fontFamily: fonts.poppins.bold, color: foodColors.primary },

  bottomSpacer: { height: 20 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  footerTotalBlock: { flexShrink: 0 },
  footerTotalLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginBottom: 2,
  },
  footerTotalValue: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  placeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
  },
  placeBtnDisabled: { opacity: 0.5 },
  placeBtnText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: 14,
    backgroundColor: foodColors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 24,
  },
  emptyBtnText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});