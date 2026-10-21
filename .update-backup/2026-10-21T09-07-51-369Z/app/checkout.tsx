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
import { useDialog } from '../src/components/ui/DialogProvider';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLocation } from '../src/context/LocationContext';
import { useAppData } from '../src/context/AppDataContext';
import { useReferral } from '../src/context/ReferralContext';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

// Delivery and service fees come from the admin (Pricing settings), same as the cart screen.

const TIME_SLOTS = [
  'As soon as possible',
  'In 30 minutes',
  'In 1 hour',
  'Later today',
];

type PaymentMethod = {
  id: 'transfer' | 'cash';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  subtitle: string;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'transfer',
    icon: 'bank-transfer',
    label: 'Pay with Transfer',
    subtitle: 'Bank transfer to the provided account',
  },
  {
    id: 'cash',
    icon: 'currency-ngn',
    label: 'Pay with Cash',
    subtitle: 'Pay the rider on delivery',
  },
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const params = useLocalSearchParams<{ promoApplied?: string; discount?: string }>();
  const { session } = useAuth();
  const { lines, itemCount, total: itemsTotal, removeItem } = useCart();
  const { formatted } = useLocation();
  const { addresses } = useAppData();
  const { rewards } = useReferral();
  const { settings: pricing } = usePricingSettings();
  const DELIVERY_FEE = pricing.echop_delivery_fee;
  const SERVICE_FEE = pricing.echop_service_fee;

  // The cart grouped by restaurant. After payment each restaurant gets its own order.
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; lines: typeof lines; subtotal: number }>();
    for (const line of lines) {
      const key = line.item.storeId || line.item.partnerName || 'restaurant';
      const name =
        line.item.storeName ||
        (line.item.partnerName || 'Restaurant').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      const g = map.get(key) ?? { key, name, lines: [], subtotal: 0 };
      g.lines.push(line);
      g.subtotal += line.item.price * line.qty;
      map.set(key, g);
    }
    return [...map.values()];
  }, [lines]);
  // Delivery fee once per restaurant, service fee once per checkout.
  const deliveryTotal = DELIVERY_FEE * groups.length;

  const defaultAddress =
    addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? '');
  const [selectedPaymentId, setSelectedPaymentId] = useState<PaymentMethod['id']>('transfer');
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [placing, setPlacing] = useState(false);

  const promoApplied = params.promoApplied === '1';
  const promoDiscount = promoApplied ? Number(params.discount ?? 0) : 0;
  const foodReward = rewards.food;
  const referralDiscount = foodReward
    ? Math.min(pricing.referral_food_discount, Math.max(itemsTotal - promoDiscount, 0))
    : 0;
  const discount = promoDiscount + referralDiscount;

  const { total } = useMemo(() => {
    const base = Math.max(itemsTotal - discount, 0);
    return { total: base + (lines.length > 0 ? deliveryTotal + SERVICE_FEE : 0) };
  }, [itemsTotal, discount, lines.length, deliveryTotal, SERVICE_FEE]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress;
  const selectedPayment = PAYMENT_METHODS.find((p) => p.id === selectedPaymentId)!;

  const canPlace =
    lines.length > 0 && !!selectedAddress && !!selectedPayment && !placing;

  const handleSelectPayment = (method: PaymentMethod) => {
    if (method.id === 'cash') {
      void dialog.alert({
        title: 'Coming Soon',
        message: 'Pay with Cash will be available in a future update.',
        confirmText: 'Got it',
        icon: 'clock',
      });
      return;
    }
    setSelectedPaymentId(method.id);
  };

  // Everything in the cart must still be available: in stock, restaurant open and not paused.
  // Anything that isn't is taken out of the cart before payment.
  const checkAvailability = async (): Promise<boolean> => {
    setPlacing(true);
    try {
      const { data, error } = await supabase.rpc('hemera_echop_unavailable_items', {
        p_product_ids: lines.map(({ item }) => item.id),
      });
      if (error) {
        // Couldn't check (e.g. no connection): the payment step will handle it.
        console.warn('[checkout] availability check failed:', error.message);
        return true;
      }
      const gone = new Set(((data ?? []) as string[]).map(String));
      const removed = lines.filter(({ item }) => gone.has(item.id));
      if (removed.length === 0) return true;
      removed.forEach(({ item }) => removeItem(item.id));
      const count = removed.reduce((sum, l) => sum + l.qty, 0);
      void dialog.alert({
        title: 'Some items are no longer available',
        message:
          lines.length === removed.length
            ? 'Nothing in your cart can be ordered right now, so we removed it. Please choose something else.'
            : `We removed ${count} item${count === 1 ? '' : 's'} that can't be ordered right now. Please check your order and try again.`,
        confirmText: 'OK',
        icon: 'shopping-bag',
      });
      return false;
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!canPlace) return;
    if (!(await checkAvailability())) return;

    const ref = `CHP-${Math.floor(100000 + Math.random() * 900000)}`;
    const firstName = lines[0].item.name;
    const title =
      lines.length > 1 ? `${firstName} + ${lines.length - 1} more` : firstName;

    router.push({
      pathname: '/fund-wallet-account',
      params: {
        amount: String(total),
        service: 'echop',
        order: JSON.stringify({
          ref,
          itemCount,
          slot,
          paymentMethod: selectedPayment.id,
          metadata: {
            ref,
            title,
            customer_email: session?.user.email ?? '',
            total,
            subtotal: itemsTotal,
            discount,
            ...(foodReward && {
              referral_reward_id: foodReward.id,
              referral_discount: referralDiscount,
            }),
            items: itemCount,
            slot,
            payment_method: selectedPayment.id,
            address: selectedAddress
              ? `${selectedAddress.line}, ${selectedAddress.details}`
              : '',
            restaurants: groups.length,
            delivery_fee: deliveryTotal,
            service_fee: SERVICE_FEE,
            lines: lines.map(({ item, qty }) => ({
              store_id: item.storeId ?? null,
              store_name: item.storeName ?? null,
              id: item.id,
              name: item.name,
              qty,
              price: item.price,
            })),
          },
        }),
      },
    } as any);
  };

  if (lines.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={ms(22)} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyWrap}>
          <Feather name="shopping-bag" size={ms(40)} color={foodColors.textMuted} />
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
          <Feather name="arrow-left" size={ms(22)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
                  <Feather name={addr.icon} size={ms(16)} color={foodColors.primary} />
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
                  <Feather name="check-circle" size={ms(18)} color={foodColors.primary} />
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
              <Feather name="plus" size={ms(16)} color={foodColors.primary} />
            </View>
            <Text style={styles.rowTitle}>Add new address</Text>
          </TouchableOpacity>
        </View>

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

        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.group}>
          {PAYMENT_METHODS.map((method, i) => {
            const active = method.id === selectedPaymentId;
            const isLast = i === PAYMENT_METHODS.length - 1;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.row, isLast && styles.rowLast]}
                onPress={() => handleSelectPayment(method)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name={method.icon}
                    size={method.id === 'transfer' ? 20 : 18}
                    color={foodColors.primary}
                  />
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowTitle}>{method.label}</Text>
                  <Text style={styles.rowSubtitle}>{method.subtitle}</Text>
                </View>
                {active && (
                  <Feather name="check-circle" size={ms(18)} color={foodColors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>
          Items ({itemCount}){groups.length > 1 ? ` · ${groups.length} restaurants` : ''}
        </Text>
        {groups.map((g, gi) => (
          <View key={g.key} style={[styles.group, gi > 0 && styles.storeGroupGap]}>
            <View style={[styles.row, styles.storeHeaderRow]}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="storefront-outline" size={ms(17)} color={foodColors.primary} />
              </View>
              <Text style={[styles.rowTitle, styles.storeFlex]} numberOfLines={1}>
                {g.name}
              </Text>
              <Text style={styles.rowPrice}>{formatNaira(g.subtotal)}</Text>
            </View>
            {g.lines.map(({ item, qty }) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.qtyBubble}>
                  <Text style={styles.qtyBubbleText}>{qty}×</Text>
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.rowPrice}>{formatNaira(item.price * qty)}</Text>
              </View>
            ))}
            <View style={[styles.row, styles.rowLast]}>
              <Text style={[styles.rowSubtitle, styles.storeFootLabel]} numberOfLines={1}>
                Delivery from {g.name}
              </Text>
              <Text style={styles.rowSubtitle}>{formatNaira(DELIVERY_FEE)}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionLabel}>Order summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatNaira(itemsTotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountLabel]}>
                -{formatNaira(discount)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {groups.length > 1 ? `Delivery fee (${groups.length} restaurants)` : 'Delivery fee'}
            </Text>
            <Text style={styles.summaryValue}>{formatNaira(deliveryTotal)}</Text>
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
              {/* <Feather name="check" size={ms(16)} color="#fff" /> */}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  storeGroupGap: { marginTop: ms(10) },
  storeHeaderRow: { backgroundColor: 'rgba(0,0,0,0.025)' },
  storeFlex: { flex: 1, minWidth: 0 },
  storeFootLabel: { flex: 1, marginTop: 0 },
  container: { flex: 1, backgroundColor: foodColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5.5%',
    paddingTop: Platform.OS === 'ios' ? ms(6) : ms(16),
    paddingBottom: ms(14),
  },
  backButton: { width: ms(40), height: ms(40), justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: {
    flex: 1,
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: ms(40) },

  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  sectionLabel: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginTop: ms(18),
    marginBottom: ms(8),
  },

  group: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
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
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowTextBlock: { flex: 1, minWidth: 0 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  rowTitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  rowSubtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },
  rowPrice: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  iconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPill: {
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: ms(8),
    paddingVertical: ms(2),
    borderRadius: ms(8),
  },
  defaultPillText: {
    fontSize: ms(9.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },

  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
  },
  slotPill: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(9),
    borderRadius: ms(20),
    backgroundColor: foodColors.surface,
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  slotPillActive: {
    backgroundColor: foodColors.primaryDark,
    borderColor: foodColors.primaryDark,
  },
  slotText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  slotTextActive: { color: '#fff' },

  qtyBubble: {
    minWidth: ms(34),
    height: ms(34),
    paddingHorizontal: ms(8),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBubbleText: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },

  summaryCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(16),
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
    marginBottom: ms(10),
  },
  summaryLabel: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  summaryValue: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  discountLabel: { color: foodColors.success },
  summaryDivider: { height: 1, backgroundColor: foodColors.border, marginVertical: ms(6) },
  totalLabel: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  totalValue: { fontSize: ms(17), fontFamily: fonts.poppins.bold, color: foodColors.primary },

  bottomSpacer: { height: ms(20) },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: ms(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  footerTotalBlock: { flexShrink: 0 },
  footerTotalLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginBottom: ms(2),
  },
  footerTotalValue: {
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  placeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
  },
  placeBtnDisabled: { opacity: 0.5 },
  placeBtnText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(40),
    gap: ms(10),
  },
  emptyTitle: {
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: ms(8),
  },
  emptySubtitle: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: ms(19),
  },
  emptyBtn: {
    marginTop: ms(14),
    backgroundColor: foodColors.primary,
    paddingHorizontal: ms(22),
    paddingVertical: ms(13),
    borderRadius: ms(24),
  },
  emptyBtnText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});