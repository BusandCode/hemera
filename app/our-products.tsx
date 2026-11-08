// Our Products: Hemera's own shop. Only products added by Hemera (admin → Our Products) show here.
// Layout: centered title, search + Filter, banner, "All Products · Sort by", category chips,
// 3 products per row (price left, + right), dark basket bar at the bottom.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl, ScrollView, TextInput, Modal, Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';
import { fetchShopProducts, naira, shopCart, useShopCart, type ShopProduct } from '../src/lib/shopCart';
import { useDialog } from '../src/components/ui/DialogProvider';

const BLUE = foodColors.badgeBlue;          // Hemera blue for every button
const BLUE_SOFT = 'rgba(37,93,222,0.08)';
const RED = foodColors.primary;              // Hemera red
const LINE = foodColors.border;              // Hemera card borders
const PAGE = foodColors.background;          // Hemera background

type Sort = 'popular' | 'newest' | 'low' | 'high' | 'name';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'newest', label: 'Newest' },
  { key: 'low', label: 'Price: low to high' },
  { key: 'high', label: 'Price: high to low' },
  { key: 'name', label: 'Name (A–Z)' },
];

// A small icon for common category names; anything else gets a box.
function categoryIcon(c: string): keyof typeof Feather.glyphMap {
  const s = c.toLowerCase();
  if (s === 'all') return 'grid';
  if (/drink|water|juice|beverage/.test(s)) return 'coffee';
  if (/oil|fat/.test(s)) return 'droplet';
  if (/kitchen|cook|utensil/.test(s)) return 'tool';
  if (/beauty|care|cosmetic/.test(s)) return 'heart';
  if (/clean|wash|soap|detergent/.test(s)) return 'wind';
  if (/electr|gadget|phone/.test(s)) return 'zap';
  if (/fruit|veg|fresh/.test(s)) return 'sun';
  return 'package';
}

export default function OurProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useShopCart();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const load = useCallback(async (mode: 'first' | 'refresh' = 'first') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const list = await fetchShopProducts();
      setProducts(list);
      shopCart.refresh(list);
      setError('');
    } catch (e: any) {
      setError(e?.message ?? 'Could not load products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category?.trim()).filter(Boolean) as string[]);
    return set.size ? ['All', ...set] : [];
  }, [products]);

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => {
    const list = products.filter(
      (p) =>
        (category === 'All' || p.category?.trim() === category) &&
        (!inStockOnly || (p.in_stock && (p.stock_qty === null || p.stock_qty > 0))) &&
        (!q || [p.name, p.description, p.category].some((v) => String(v ?? '').toLowerCase().includes(q))),
    );
    const sorted = [...list];
    if (sort === 'low') sorted.sort((a, b) => a.price_kobo - b.price_kobo);
    if (sort === 'high') sorted.sort((a, b) => b.price_kobo - a.price_kobo);
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'newest') sorted.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
    return sorted;
  }, [products, category, inStockOnly, q, sort]);

  const filtersOn = sort !== 'popular' || inStockOnly;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={ms(22)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>All Products</Text>
          <Text style={styles.headerSub} numberOfLines={1}>Quality products, delivered to you.</Text>
        </View>
        <TouchableOpacity style={styles.roundBtn} onPress={() => router.push('/our-products-cart' as any)} hitSlop={8}>
          <Feather name="shopping-cart" size={ms(19)} color={foodColors.textPrimary} />
          {cart.itemCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{cart.itemCount > 99 ? '99+' : cart.itemCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {loading && products.length === 0 ? (
        <ActivityIndicator color={BLUE} style={{ marginTop: ms(40) }} />
      ) : error && products.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="alert-circle" size={ms(28)} color={foodColors.textMuted} />
          <Text style={styles.emptyTitle}>Couldn't load products</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: ms(16), paddingBottom: insets.bottom + ms(cart.itemCount ? 110 : 24) }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={BLUE} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search + Filter */}
          <View style={styles.searchRow}>
            <View style={styles.search}>
              <Feather name="search" size={ms(17)} color={foodColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search for products..."
                placeholderTextColor={foodColors.textMuted}
                returnKeyType="search"
                autoCorrect={false}
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
                  <Feather name="x-circle" size={ms(16)} color={foodColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={[styles.filterBtn, filtersOn && { borderColor: BLUE }]} onPress={() => setFilterOpen(true)} activeOpacity={0.85}>
              <Feather name="filter" size={ms(16)} color={filtersOn ? BLUE : foodColors.textPrimary} />
              <Text style={[styles.filterText, filtersOn && { color: BLUE }]}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Banner (same as E-Chop) */}
          {!q && (
            <View style={styles.banner}>
              <BannerSlider products={products} />
            </View>
          )}

          {/* All Products · Sort by */}
          <View style={styles.listHead}>
            <Text style={styles.listTitle}>All Products</Text>
            <TouchableOpacity onPress={() => setFilterOpen(true)} hitSlop={8}>
              <Text style={styles.sortText}>
                Sort by: <Text style={styles.sortValue}>{SORTS.find((s) => s.key === sort)?.label.replace('Price: ', '')}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Categories */}
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((c) => {
                const on = category === c;
                return (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, on && styles.chipOn]} activeOpacity={0.85}>
                    {c !== 'All' && <Feather name={categoryIcon(c)} size={ms(14)} color={on ? BLUE : foodColors.textPrimary} />}
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {shown.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="shopping-bag" size={ms(28)} color={foodColors.textMuted} />
              <Text style={styles.emptyTitle}>{q || filtersOn || category !== 'All' ? 'No products match' : 'No products yet'}</Text>
              <Text style={styles.emptyText}>{q || filtersOn || category !== 'All' ? 'Try a different word or filter.' : "Hemera's products will show here soon."}</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {shown.map((p) => <ProductCard key={p.id} product={p} qty={cart.qtyOf(p.id)} />)}
              {/* keep the last row aligned left */}
              {Array.from({ length: (3 - (shown.length % 3)) % 3 }).map((_, i) => <View key={`gap-${i}`} style={styles.cardGap} />)}
            </View>
          )}

        </ScrollView>
      )}

      {/* Basket bar */}
      {cart.itemCount > 0 && (
        <View style={[styles.basketWrap, { paddingBottom: insets.bottom + ms(10) }]}>
          <View style={styles.basket}>
            <View style={styles.basketIcon}>
              <Feather name="shopping-bag" size={ms(18)} color="#fff" />
              <View style={styles.basketBadge}><Text style={styles.badgeText}>{cart.itemCount > 99 ? '99+' : cart.itemCount}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.basketTitle} numberOfLines={1}>
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.basketTotal} numberOfLines={1}>Total: {naira(cart.totalKobo)}</Text>
            </View>
            <TouchableOpacity style={styles.basketBtn} onPress={() => router.push('/our-products-cart' as any)} activeOpacity={0.9}>
              <Text style={styles.basketBtnText} numberOfLines={1}>View Basket</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter / sort sheet */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + ms(16) }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sort by</Text>
            {SORTS.map((s) => {
              const on = sort === s.key;
              return (
                <TouchableOpacity key={s.key} style={styles.sheetRow} onPress={() => setSort(s.key)}>
                  <Text style={[styles.sheetRowText, on && { color: BLUE, fontFamily: fonts.poppins.semiBold }]}>{s.label}</Text>
                  <Feather name={on ? 'check-circle' : 'circle'} size={ms(18)} color={on ? BLUE : foodColors.textMuted} />
                </TouchableOpacity>
              );
            })}
            <Text style={[styles.sheetTitle, { marginTop: ms(12) }]}>Show</Text>
            <TouchableOpacity style={styles.sheetRow} onPress={() => setInStockOnly(!inStockOnly)}>
              <Text style={styles.sheetRowText}>In stock only</Text>
              <Feather name={inStockOnly ? 'check-square' : 'square'} size={ms(18)} color={inStockOnly ? BLUE : foodColors.textMuted} />
            </TouchableOpacity>
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetReset} onPress={() => { setSort('popular'); setInStockOnly(false); }}>
                <Text style={styles.sheetResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetApply} onPress={() => setFilterOpen(false)}>
                <Text style={styles.sheetApplyText}>Show results</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Banner that slides by itself (every 3.5 s) and can be swiped: the E-Chop banner, two Hemera cards,
// and up to 3 newest products with photos.
type Slide =
  | { kind: 'promo' }
  | { kind: 'info'; icon: keyof typeof Feather.glyphMap; title: string; text: string; bg: string; fg: string }
  | { kind: 'product'; product: ShopProduct };

const PROMO = require('../assets/promo.png');
const PROMO_RATIO = (() => {
  try { const s = Image.resolveAssetSource(PROMO); return s?.width && s?.height ? s.width / s.height : 2.4; } catch { return 2.4; }
})();

function BannerSlider({ products }: { products: ShopProduct[] }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);
  const touching = useRef(false);

  const slides: Slide[] = useMemo(() => {
    const newest = [...products]
      .filter((p) => p.image_url)
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
      .slice(0, 3)
      .map((product) => ({ kind: 'product' as const, product }));
    return [
      { kind: 'promo' },
      { kind: 'info', icon: 'shopping-bag', title: 'Shop quality products', text: 'Hand-picked by Hemera, at fair prices.', bg: '#EAF0FF', fg: BLUE },
      ...newest,
      { kind: 'info', icon: 'truck', title: 'Delivered to you', text: 'Pay by bank transfer and track your order.', bg: foodColors.primaryLight, fg: RED },
    ];
  }, [products]);

  useEffect(() => {
    if (!width || slides.length < 2) return;
    const t = setInterval(() => {
      if (touching.current) return;
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        ref.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, [width, slides.length]);

  // Same height as the E-Chop banner, so it shows in full.
  const height = width ? Math.round(width / PROMO_RATIO) : 0;
  return (
    <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {width > 0 && (
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => { touching.current = true; }}
          onMomentumScrollEnd={(e) => {
            touching.current = false;
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          style={{ borderRadius: ms(16) }}
        >
          {slides.map((s, i) => (
            <View key={i} style={{ width, height, borderRadius: ms(16), overflow: 'hidden' }}>
              {s.kind === 'promo' ? (
                <Image source={PROMO} style={{ width, height }} resizeMode="cover" />
              ) : s.kind === 'info' ? (
                <View style={[styles.slideInfo, { backgroundColor: s.bg }]}>
                  <View style={[styles.slideIcon, { backgroundColor: s.fg }]}>
                    <Feather name={s.icon} size={ms(20)} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.slideTitle, { color: s.fg }]} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.slideText} numberOfLines={2}>{s.text}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.slideProduct}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slideTag}>NEW IN</Text>
                    <Text style={styles.slideTitle} numberOfLines={2}>{s.product.name}</Text>
                    <Text style={styles.slidePrice}>{naira(s.product.price_kobo)}</Text>
                  </View>
                  <Image source={{ uri: s.product.image_url! }} style={styles.slideImage} resizeMode="contain" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => <View key={i} style={[styles.dot, i === index && styles.dotOn]} />)}
        </View>
      )}
    </View>
  );
}

function ProductCard({ product: p, qty }: { product: ShopProduct; qty: number }) {
  const dialog = useDialog();
  const soldOut = !p.in_stock || (p.stock_qty !== null && p.stock_qty <= 0);
  const added = qty > 0;

  // One button: tap to add, tap again to remove (after confirming). Quantity is changed in the basket.
  async function toggle() {
    if (!added) { shopCart.add(p); return; }
    const ok = await dialog.confirm({
      title: 'Remove item?',
      message: 'Are you sure you want to remove this item from your basket?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      destructive: true,
      icon: 'trash-2',
    });
    if (ok) shopCart.setQty(p.id, 0);
  }

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {p.image_url ? (
          <Image source={{ uri: p.image_url }} style={styles.image} resizeMode="contain" />
        ) : (
          <Feather name="shopping-bag" size={ms(24)} color={foodColors.textMuted} />
        )}
        {soldOut && <View style={styles.soldOut}><Text style={styles.soldOutText}>Sold out</Text></View>}
      </View>
      <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
      <Text style={styles.sub} numberOfLines={1}>{p.category || p.description || ' '}</Text>
      <View style={styles.cardFoot}>
        <Text style={styles.price} numberOfLines={1} adjustsFontSizeToFit>{naira(p.price_kobo)}</Text>
        <TouchableOpacity
          style={[styles.addBtn, added && styles.addBtnOn, soldOut && !added && { borderColor: foodColors.textMuted }]}
          disabled={soldOut && !added}
          onPress={toggle}
          activeOpacity={0.8}
          hitSlop={6}
          accessibilityLabel={added ? `Remove ${p.name} from basket` : `Add ${p.name} to basket`}
        >
          <Feather name={added ? 'check' : 'plus'} size={ms(14)} color={added ? '#fff' : soldOut ? foodColors.textMuted : BLUE} />
          {qty > 1 && <View style={styles.qtyBadge}><Text style={styles.qtyBadgeText}>{qty}</Text></View>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAGE },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(16), paddingBottom: ms(14) },
  roundBtn: { width: ms(44), height: ms(44), borderRadius: ms(22), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LINE },
  headerMid: { flex: 1, alignItems: 'center', paddingHorizontal: ms(8) },
  headerTitle: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  headerSub: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(2) },
  badge: { position: 'absolute', top: -ms(4), right: -ms(4), minWidth: ms(18), height: ms(18), borderRadius: ms(9), backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(4) },
  badgeText: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: '#fff' },

  searchRow: { flexDirection: 'row', gap: ms(10), marginBottom: ms(16) },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: ms(10), backgroundColor: '#FFFFFF', borderRadius: ms(14), paddingHorizontal: ms(14), height: ms(50), borderWidth: 1, borderColor: LINE },
  searchInput: { flex: 1, fontSize: ms(14), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, paddingVertical: 0 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: ms(6), backgroundColor: '#FFFFFF', borderRadius: ms(14), paddingHorizontal: ms(14), height: ms(50), borderWidth: 1, borderColor: LINE },
  filterText: { fontSize: ms(14), fontFamily: fonts.poppins.medium, color: foodColors.textPrimary },

  banner: { marginBottom: ms(16) },

  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ms(12) },
  listTitle: { fontSize: ms(13.5), fontFamily: fonts.poppins.medium, color: foodColors.textSecondary },
  sortText: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  sortValue: { fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },

  chips: { gap: ms(10), paddingBottom: ms(16) },
  chip: { flexDirection: 'row', alignItems: 'center', gap: ms(6), paddingHorizontal: ms(16), height: ms(42), borderRadius: ms(12), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  chipOn: { borderColor: BLUE, backgroundColor: BLUE_SOFT },
  chipText: { fontSize: ms(13.5), fontFamily: fonts.poppins.medium, color: foodColors.textPrimary },
  chipTextOn: { color: BLUE },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: ms(10) },
  card: { width: '31.8%', backgroundColor: '#FFFFFF', borderRadius: ms(14), padding: ms(8), borderWidth: 1, borderColor: LINE },
  cardGap: { width: '31.8%' },
  imageWrap: { width: '100%', aspectRatio: 1, borderRadius: ms(10), backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: ms(6) },
  image: { width: '92%', height: '92%' },
  soldOut: { position: 'absolute', top: ms(4), left: ms(4), backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: ms(6), paddingHorizontal: ms(6), paddingVertical: ms(2) },
  soldOutText: { fontSize: ms(9), fontFamily: fonts.poppins.semiBold, color: '#fff' },
  name: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  sub: { fontSize: ms(10.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(1) },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: ms(8), gap: ms(4) },
  price: { flex: 1, fontSize: ms(12.5), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  addBtn: { width: ms(24), height: ms(24), borderRadius: ms(6), borderWidth: 1.5, borderColor: BLUE, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  addBtnOn: { backgroundColor: BLUE },
  qtyBadge: { position: 'absolute', top: -ms(7), right: -ms(7), minWidth: ms(15), height: ms(15), borderRadius: ms(8), backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(3), borderWidth: 1, borderColor: '#fff' },
  qtyBadgeText: { fontSize: ms(9), fontFamily: fonts.poppins.bold, color: '#fff' },


  empty: { alignItems: 'center', paddingVertical: ms(50), gap: ms(6) },
  emptyTitle: { fontSize: ms(15), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  emptyText: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center' },
  retry: { marginTop: ms(8), backgroundColor: BLUE, borderRadius: ms(12), paddingHorizontal: ms(18), paddingVertical: ms(10) },
  retryText: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: '#fff' },

  slideInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: ms(14), paddingHorizontal: ms(18) },
  slideIcon: { width: ms(44), height: ms(44), borderRadius: ms(14), alignItems: 'center', justifyContent: 'center' },
  slideTitle: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  slideText: { fontSize: ms(12), lineHeight: ms(17), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(2) },
  slideProduct: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: ms(10), backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, borderRadius: ms(16), paddingLeft: ms(18), paddingRight: ms(10) },
  slideTag: { fontSize: ms(10), fontFamily: fonts.poppins.bold, letterSpacing: 1, color: BLUE, marginBottom: ms(2) },
  slidePrice: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: BLUE, marginTop: ms(4) },
  slideImage: { width: '40%', height: '86%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: ms(5), marginTop: ms(8) },
  dot: { width: ms(6), height: ms(6), borderRadius: ms(3), backgroundColor: foodColors.textMuted },
  dotOn: { width: ms(16), backgroundColor: BLUE },
  basketWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: ms(14), paddingTop: ms(8) },
  basket: { flexDirection: 'row', alignItems: 'center', gap: ms(10), backgroundColor: RED, borderRadius: ms(16), paddingVertical: ms(10), paddingLeft: ms(12), paddingRight: ms(10) },
  basketIcon: { width: ms(38), height: ms(38), borderRadius: ms(19), backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  basketBadge: { position: 'absolute', top: -ms(2), left: -ms(2), minWidth: ms(18), height: ms(18), borderRadius: ms(9), backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(4), borderWidth: 1.5, borderColor: '#fff' },
  basketTitle: { fontSize: ms(12), fontFamily: fonts.poppins.medium, color: 'rgba(255,255,255,0.85)' },
  basketTotal: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff', marginTop: ms(1) },
  basketBtn: { flexShrink: 0, backgroundColor: '#fff', borderRadius: ms(11), paddingHorizontal: ms(14), paddingVertical: ms(10) },
  basketBtnText: { fontSize: ms(12.5), fontFamily: fonts.poppins.bold, color: RED },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: ms(22), borderTopRightRadius: ms(22), paddingHorizontal: ms(20), paddingTop: ms(10) },
  sheetHandle: { alignSelf: 'center', width: ms(40), height: ms(4), borderRadius: ms(2), backgroundColor: LINE, marginBottom: ms(12) },
  sheetTitle: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(4) },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: ms(11) },
  sheetRowText: { fontSize: ms(14), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary },
  sheetActions: { flexDirection: 'row', gap: ms(10), marginTop: ms(14) },
  sheetReset: { flex: 1, borderRadius: ms(12), borderWidth: 1, borderColor: LINE, paddingVertical: ms(14), alignItems: 'center' },
  sheetResetText: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  sheetApply: { flex: 2, borderRadius: ms(12), backgroundColor: BLUE, paddingVertical: ms(14), alignItems: 'center' },
  sheetApplyText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});
