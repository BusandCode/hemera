// app/cart.tsx
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useCart } from '../src/context/CartContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = SCREEN_WIDTH * 0.055;
const ITEM_IMAGE_SIZE = SCREEN_WIDTH * 0.18;

const DELIVERY_FEE = 500;
const SERVICE_FEE = 200;

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function CartScreen() {
  const router = useRouter();
  const { lines, setQty, removeItem, itemCount, total: itemsTotal } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const { discount, total } = useMemo(() => {
    const discount = promoApplied ? Math.round(itemsTotal * 0.1) : 0;
    const total =
      itemsTotal - discount + (lines.length > 0 ? DELIVERY_FEE + SERVICE_FEE : 0);
    return { discount, total };
  }, [itemsTotal, promoApplied, lines.length]);

  const applyPromo = () => {
    if (promoCode.trim().length > 0) {
      setPromoApplied(true);
    }
  };

  const isEmpty = lines.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        {!isEmpty ? (
          <Text style={styles.headerCount}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shopping-cart" size={34} color={foodColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything yet. Explore today's menu to get started.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/echop')}
          >
            <Text style={styles.browseButtonText}>Browse Menu</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.itemsSection}>
              {lines.map(({ item, qty }) => (
                <View key={item.id} style={styles.itemCard}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemPartner} numberOfLines={1}>
                      {item.partnerName}
                    </Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View style={styles.itemBottomRow}>
                      <Text style={styles.itemPrice}>
                        {formatNaira(item.price * qty)}
                      </Text>

                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => setQty(item.id, qty - 1)}
                        >
                          <Feather
                            name={qty === 1 ? 'trash-2' : 'minus'}
                            size={13}
                            color={foodColors.textPrimary}
                          />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.stepperButton, styles.stepperButtonPrimary]}
                          onPress={() => setQty(item.id, qty + 1)}
                        >
                          <Feather name="plus" size={13} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={14} color={foodColors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.promoSection}>
              <Text style={styles.sectionLabel}>Promo Code</Text>
              <View style={styles.promoRow}>
                <View style={styles.promoInputWrap}>
                  <Feather name="tag" size={15} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={foodColors.textMuted}
                    value={promoCode}
                    onChangeText={(text) => {
                      setPromoCode(text);
                      if (promoApplied) setPromoApplied(false);
                    }}
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity style={styles.promoApplyButton} onPress={applyPromo}>
                  <Text style={styles.promoApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {promoApplied && (
                <View style={styles.promoAppliedRow}>
                  <Feather name="check-circle" size={13} color={foodColors.success} />
                  <Text style={styles.promoAppliedText}>
                    Promo applied — 10% off your subtotal
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.sectionLabel}>Order Summary</Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatNaira(itemsTotal)}</Text>
                </View>

                {promoApplied && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.discountLabel]}>
                      Discount
                    </Text>
                    <Text style={[styles.summaryValue, styles.discountLabel]}>
                      -{formatNaira(discount)}
                    </Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>{formatNaira(DELIVERY_FEE)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service Fee</Text>
                  <Text style={styles.summaryValue}>{formatNaira(SERVICE_FEE)}</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatNaira(total)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          <View style={styles.checkoutBar}>
            <View style={styles.checkoutTotalBlock}>
              <Text style={styles.checkoutTotalLabel}>Total</Text>
              <Text style={styles.checkoutTotalValue}>{formatNaira(total)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutButton}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/checkout',
                  params: {
                    promoApplied: promoApplied ? '1' : '0',
                    discount: String(discount),
                  },
                } as any)
              }
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
    paddingBottom: 14,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  headerCount: {
    minWidth: 40,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  headerSpacer: { minWidth: 40 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING * 1.5,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    lineHeight: 19,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 24,
  },
  browseButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },

  itemsSection: { gap: 12, marginBottom: 22 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemImage: { width: ITEM_IMAGE_SIZE, height: ITEM_IMAGE_SIZE, borderRadius: 12 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemPartner: {
    fontSize: 10,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.3,
    color: foodColors.badgeBlue,
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    lineHeight: 15,
    color: foodColors.textSecondary,
    marginBottom: 10,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    flexShrink: 1,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonPrimary: { backgroundColor: foodColors.primary },
  stepperValue: {
    minWidth: 16,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  removeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: foodColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 10,
  },

  promoSection: { marginBottom: 22 },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: foodColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    minWidth: 0,
  },
  promoInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
  },
  promoApplyButton: {
    backgroundColor: foodColors.primaryDark,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoApplyText: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },
  promoAppliedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  promoAppliedText: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.success,
    flexShrink: 1,
  },

  summarySection: { marginBottom: 8 },
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

  bottomSpacer: { height: 100 },

  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    backgroundColor: foodColors.surface,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  checkoutTotalBlock: { flexShrink: 0 },
  checkoutTotalLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginBottom: 2,
  },
  checkoutTotalValue: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    maxWidth: '68%',
  },
  checkoutButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});