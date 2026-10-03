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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useCart } from '../src/context/CartContext';
import type { MenuItem } from '../src/constants/foodData';
import { useAllMenuItems } from '../src/hooks/useFood';
import { useReferral } from '../src/context/ReferralContext';
import { REFERRAL_FOOD_DISCOUNT } from '../src/constants/referral';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = SCREEN_WIDTH * 0.055;
const ITEM_IMAGE_SIZE = SCREEN_WIDTH * 0.18;
const SUGGESTION_IMAGE_SIZE = SCREEN_WIDTH * 0.24;

const DELIVERY_FEE = 500;
const SERVICE_FEE = 200;

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function animateLayout() {
  LayoutAnimation.configureNext({
    duration: 260,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });
}

export default function CartScreen() {
  const router = useRouter();
  const {
    lines,
    addItem,
    setQty,
    removeItem,
    itemCount,
    total: itemsTotal,
    quantityOf,
  } = useCart();
  const { items: allMenuItems } = useAllMenuItems();
  const { rewards } = useReferral();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const hasFoodReward = !!rewards.food;

  const { discount, referralDiscount, total } = useMemo(() => {
    const discount = promoApplied ? Math.round(itemsTotal * 0.1) : 0;
    const referralDiscount = hasFoodReward
      ? Math.min(REFERRAL_FOOD_DISCOUNT, Math.max(itemsTotal - discount, 0))
      : 0;
    const total =
      Math.max(itemsTotal - discount - referralDiscount, 0) +
      (lines.length > 0 ? DELIVERY_FEE + SERVICE_FEE : 0);
    return { discount, referralDiscount, total };
  }, [itemsTotal, promoApplied, lines.length, hasFoodReward]);

  const applyPromo = () => {
    if (promoCode.trim().length > 0) {
      animateLayout();
      setPromoApplied(true);
    }
  };

  const handleAdd = (item: MenuItem) => {
    animateLayout();
    addItem(item, 1);
  };

  const handleSetQty = (id: string, qty: number) => {
    animateLayout();
    setQty(id, qty);
  };

  const handleRemove = (id: string) => {
    animateLayout();
    removeItem(id);
  };

  // Suggest items not already in the cart, prioritizing same partner names
  // as items currently in the cart, then popular items.
  const [suggestions, setSuggestions] = useState<MenuItem[]>([]);
  const suggestionsBuilt = useRef(false);

  useEffect(() => {
    if (suggestionsBuilt.current || allMenuItems.length === 0) return;
    suggestionsBuilt.current = true;

    const inCartIds = new Set(lines.map((l) => l.item.id));
    const cartPartners = new Set(lines.map((l) => l.item.partnerName));

    const available = allMenuItems.filter((it) => !inCartIds.has(it.id));

    const score = (it: MenuItem) => {
      let s = 0;
      if (cartPartners.has(it.partnerName)) s += 2;
      if (it.isPopular) s += 1;
      return s;
    };

    setSuggestions([...available].sort((a, b) => score(b) - score(a)).slice(0, 8));
  }, [allMenuItems]);

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
                          onPress={() => handleSetQty(item.id, qty - 1)}
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
                          onPress={() => handleSetQty(item.id, qty + 1)}
                        >
                          <Feather name="plus" size={13} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(item.id)}
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
                      if (promoApplied) {
                        animateLayout();
                        setPromoApplied(false);
                      }
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

                {discount + referralDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.discountLabel]}>
                      Discount
                    </Text>
                    <Text style={[styles.summaryValue, styles.discountLabel]}>
                      -{formatNaira(discount + referralDiscount)}
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

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.sectionLabel}>You might also like</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestionsRow}
                >
                  {suggestions.map((item) => {
                    const inCart = quantityOf(item.id) > 0;
                    return (
                      <View key={item.id} style={styles.suggestionCard}>
                        <Image
                          source={{ uri: item.image }}
                          style={styles.suggestionImage}
                        />

                        <Text
                          style={styles.suggestionPartner}
                          numberOfLines={1}
                        >
                          {item.partnerName}
                        </Text>
                        <Text style={styles.suggestionName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.suggestionPrice}>
                          {formatNaira(item.price)}
                        </Text>

                        <TouchableOpacity
                          style={[
                            styles.suggestionAdd,
                            inCart && styles.suggestionAddActive,
                          ]}
                          onPress={() => {
                            if (!inCart) handleAdd(item);
                          }}
                          activeOpacity={0.85}
                        >
                          <Feather
                            name={inCart ? 'check' : 'plus'}
                            size={13}
                            color="#fff"
                          />
                          <Text style={styles.suggestionAddText}>
                            {inCart ? 'Added' : 'Add'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

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

  summarySection: { marginBottom: 22 },
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

  suggestionsSection: { marginBottom: 8, marginHorizontal: -HORIZONTAL_PADDING },
  suggestionsHeader: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 10,
  },
  suggestionsRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 12,
  },
  suggestionCard: {
    width: SUGGESTION_IMAGE_SIZE + 40,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  suggestionImage: {
    width: '100%',
    height: SUGGESTION_IMAGE_SIZE,
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionPartner: {
    fontSize: 9.5,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.3,
    color: foodColors.badgeBlue,
  },
  suggestionName: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: 1,
  },
  suggestionPrice: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginTop: 3,
    marginBottom: 8,
  },
  suggestionAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: foodColors.primaryDark,
    paddingVertical: 8,
    borderRadius: 18,
  },
  suggestionAddActive: { backgroundColor: foodColors.success },
  suggestionAddText: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

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