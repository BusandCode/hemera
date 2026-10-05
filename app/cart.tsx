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
  Keyboard,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useCart } from '../src/context/CartContext';
import type { MenuItem } from '../src/constants/foodData';
import { useAllMenuItems } from '../src/hooks/useFood';
import { useReferral } from '../src/context/ReferralContext';
import { useLocation } from '../src/context/LocationContext';
import { REFERRAL_FOOD_DISCOUNT } from '../src/constants/referral';
import { findPromo, type PromoCode } from '../src/constants/promoCodes';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = SCREEN_WIDTH * 0.055;
const ITEM_IMAGE_SIZE = SCREEN_WIDTH * 0.18;
const SUGGESTION_IMAGE_SIZE = SCREEN_WIDTH * 0.24;

const DELIVERY_FEE = 500;
const SERVICE_FEE = 200;

const STOP_WORDS = new Set(['with', 'and', 'the', 'plus', 'combo', 'pack', 'meal', 'portion']);

function nameTokens(name: string) {
  return name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

type DishGroup = 'rice' | 'swallow' | 'soup' | 'grill' | 'drink';

// Checked in this order, so "pepper soup" lands in soup before grill.
const GROUP_ORDER: DishGroup[] = ['rice', 'swallow', 'soup', 'grill', 'drink'];

const GROUP_KEYWORDS: Record<DishGroup, string[]> = {
  rice: ['rice', 'jollof', 'ofada'],
  swallow: ['swallow', 'amala', 'eba', 'fufu', 'pounded', 'semo', 'tuwo', 'poundo'],
  soup: ['soup', 'egusi', 'ogbono', 'okra', 'efo', 'banga', 'afang', 'stew', 'ewedu'],
  grill: ['grill', 'suya', 'asun', 'chicken', 'fish', 'turkey', 'barbecue', 'bbq', 'kebab'],
  drink: ['drink', 'juice', 'zobo', 'smoothie', 'water', 'malt', 'soda', 'chapman', 'tea', 'coffee'],
};

// What people usually order alongside each kind of dish.
const COMPLEMENTS: Record<DishGroup, DishGroup[]> = {
  rice: ['grill', 'drink'],
  swallow: ['soup', 'drink'],
  soup: ['swallow', 'drink'],
  grill: ['rice', 'drink'],
  drink: ['rice', 'grill'],
};

function findGroup(text: string): DishGroup | null {
  for (const g of GROUP_ORDER) {
    if (GROUP_KEYWORDS[g].some((k) => text.includes(k))) return g;
  }
  return null;
}

// Prefer the menu category; fall back to words in the dish name.
function groupOf(item: MenuItem): DishGroup | null {
  return findGroup((item.category ?? '').toLowerCase()) ?? findGroup(item.name.toLowerCase());
}

// Orders can mix stores as long as they're all in the chosen state and LGA.
// If a partner has no area saved yet, it isn't excluded.
function inDeliveryArea(item: MenuItem, state: string, lga: string) {
  const same = (a?: string, b?: string) =>
    !a || !b || a.trim().toLowerCase() === b.trim().toLowerCase();
  return same(item.state, state) && same(item.lga, lga);
}

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
  const { items: allMenuItems, error: menuError } = useAllMenuItems();
  const { rewards } = useReferral();
  const { location } = useLocation();

  useEffect(() => {
    if (menuError) console.warn('[Cart] suggestions query failed:', menuError);
  }, [menuError]);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoNotice, setPromoNotice] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Items added from the "You might also like" row. They stay visible (as
  // "Added") instead of vanishing, and don't re-trigger a re-rank of the row.
  const [addedFromSuggestions, setAddedFromSuggestions] = useState<string[]>([]);

  const hasFoodReward = !!rewards.food;

  const { discount, referralDiscount, total } = useMemo(() => {
    const discount = appliedPromo ? Math.round(itemsTotal * (appliedPromo.percent / 100)) : 0;
    const referralDiscount = hasFoodReward
      ? Math.min(REFERRAL_FOOD_DISCOUNT, Math.max(itemsTotal - discount, 0))
      : 0;
    const total =
      Math.max(itemsTotal - discount - referralDiscount, 0) +
      (lines.length > 0 ? DELIVERY_FEE + SERVICE_FEE : 0);
    return { discount, referralDiscount, total };
  }, [itemsTotal, appliedPromo, lines.length, hasFoodReward]);

  const dismissPromoNotice = () => {
    setPromoNotice(null);
  };

  const applyPromo = () => {
    Keyboard.dismiss();
    animateLayout();

    if (!promoCode.trim()) {
      setAppliedPromo(null);
      setPromoError('Enter a promo code');
      setPromoNotice({
        type: 'error',
        title: 'Promo code required',
        message: 'Please enter a promo code before applying it.',
      });
      return;
    }

    const found = findPromo(promoCode);
    if (!found) {
      setAppliedPromo(null);
      setPromoError('Invalid promo code');
      setPromoNotice({
        type: 'error',
        title: 'Invalid promo code',
        message: 'Please try a different promo code.',
      });
      return;
    }

    setPromoError(null);
    setAppliedPromo(found);
    setPromoNotice({
      type: 'success',
      title: 'Promo applied',
      message: `${found.percent}% off your subtotal has been added.`,
    });
  };

  const handlePromoChange = (text: string) => {
    setPromoCode(text);
    if (appliedPromo || promoError || promoNotice) {
      animateLayout();
      setAppliedPromo(null);
      setPromoError(null);
      setPromoNotice(null);
    }
  };

  const handleAdd = (item: MenuItem) => {
    animateLayout();
    addItem(item, 1);
  };

  const handleAddSuggestion = (item: MenuItem) => {
    setAddedFromSuggestions((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    handleAdd(item);
  };

  const handleSetQty = (id: string, qty: number) => {
    animateLayout();
    setQty(id, qty);
  };

  const handleRemove = (id: string) => {
    animateLayout();
    removeItem(id);
  };

  // Suggestions come from any store in the chosen state and LGA, ranked by how
  // they relate to the most recently added item (last line): dishes that go with
  // it come first (rice -> grill/drinks, swallow -> soup), then similar dishes,
  // then similar names, then popular items. Items added from the suggestion row
  // are left out of the ranking so the row doesn't reshuffle under the user's finger.
  const suggestions = useMemo<MenuItem[]>(() => {
    if (allMenuItems.length === 0 || lines.length === 0) return [];

    const seedLines = lines.filter((l) => !addedFromSuggestions.includes(l.item.id));
    const basis = seedLines.length > 0 ? seedLines : lines;

    const seedIds = new Set(basis.map((l) => l.item.id));
    const anchor = basis[basis.length - 1].item;

    const anchorGroup = groupOf(anchor);
    const complements = anchorGroup ? COMPLEMENTS[anchorGroup] : [];
    const cartGroups = new Set(basis.map((l) => groupOf(l.item)).filter(Boolean));
    const anchorTokens = new Set(nameTokens(anchor.name));

    const score = (it: MenuItem) => {
      let s = 0;
      const g = groupOf(it);
      if (g) {
        if (complements.includes(g)) s += 5;
        else if (g === anchorGroup) s += 4;
        else if (cartGroups.has(g)) s += 1;
      }

      const shared = nameTokens(it.name).filter((t) => anchorTokens.has(t)).length;
      s += Math.min(shared, 2) * 2;

      if (it.isPopular) s += 1;
      return s;
    };

    return allMenuItems
      .filter((it) => !seedIds.has(it.id) && inDeliveryArea(it, location.state, location.lga))
      .map((it) => ({ it, s: score(it) }))
      .sort((a, b) => b.s - a.s || b.it.rating - a.it.rating)
      .slice(0, 8)
      .map(({ it }) => it);
  }, [allMenuItems, lines, addedFromSuggestions, location.state, location.lga]);

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
            keyboardShouldPersistTaps="handled"
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
                <View style={[styles.promoInputWrap, !!promoError && styles.promoInputWrapError]}>
                  <Feather name="tag" size={15} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={foodColors.textMuted}
                    value={promoCode}
                    onChangeText={handlePromoChange}
                    onSubmitEditing={applyPromo}
                    returnKeyType="done"
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity style={styles.promoApplyButton} onPress={applyPromo}>
                  <Text style={styles.promoApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {/* promo feedback is shown in a native alert popup for a cleaner cart experience */}
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
                            if (!inCart) handleAddSuggestion(item);
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
                    promoApplied: appliedPromo ? '1' : '0',
                    promoCode: appliedPromo?.code ?? '',
                    discount: String(discount),
                  },
                } as any)
              }
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {promoNotice && (
            <View style={styles.noticeOverlay} pointerEvents="box-none">
              <View
                style={[
                  styles.noticeCard,
                  promoNotice.type === 'success' ? styles.noticeSuccess : styles.noticeError,
                ]}
              >
                <View style={styles.noticeHeader}>
                  <View style={styles.noticeTitleWrap}>
                    <Feather
                      name={promoNotice.type === 'success' ? 'check-circle' : 'alert-circle'}
                      size={18}
                      color={promoNotice.type === 'success' ? foodColors.success : foodColors.primary}
                    />
                    <Text style={styles.noticeTitle}>{promoNotice.title}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.noticeCloseButton}
                    onPress={dismissPromoNotice}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={16} color={foodColors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.noticeMessage}>{promoNotice.message}</Text>

                <TouchableOpacity
                  style={styles.noticeButton}
                  onPress={dismissPromoNotice}
                  activeOpacity={0.9}
                >
                  <Text style={styles.noticeButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  promoInputWrapError: { borderColor: foodColors.primary },
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
  promoErrorText: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
    flexShrink: 1,
  },

  summarySection: { marginBottom: 22 },
  noticeOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 88,
    zIndex: 20,
  },
  noticeCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
  },
  noticeSuccess: {
    backgroundColor: '#F1FFF7',
    borderColor: '#BFEBD0',
  },
  noticeError: {
    backgroundColor: '#FFF3F3',
    borderColor: '#F9C2C2',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noticeTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  noticeCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  noticeMessage: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    lineHeight: 18,
    color: foodColors.textSecondary,
    marginBottom: 12,
  },
  noticeButton: {
    alignSelf: 'flex-end',
    backgroundColor: foodColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  noticeButtonText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
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