import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Pressable,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { allServices, QuickService, ServiceAction } from '../src/constants/quickServices';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD = 20;

// Pick a font size per platform: fs(iosSize, androidSize).
const IS_ANDROID = Platform.OS === 'android';
const fs = (ios: number, android: number) => (IS_ANDROID ? android : ios);

// Carousel: 3 banners visible at a time.
const BANNER_GAP = 8;
const BANNER_W = (SCREEN_WIDTH - PAD * 2 - BANNER_GAP * 2) / 3;
const BANNER_H = BANNER_W * 1.08;
const BANNER_STEP = BANNER_W + BANNER_GAP;
const BANNER_INTERVAL = 3000;
const BANNER_PAUSE_AFTER_TOUCH = 4000;

// Grid: 4 columns.
const GRID_GAP = 10;
const CELL_W = (SCREEN_WIDTH - PAD * 2 - GRID_GAP * 3) / 4;

// Footer slider: one full-width card at a time, auto-advancing.
const SLIDE_W = SCREEN_WIDTH - PAD * 2;
const SLIDE_H = 120;
const SLIDE_INTERVAL = 3500;

type Banner = { id: string; image: string; label: string };

const banners: Banner[] = [
  { id: 'food',    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', label: 'Fresh meals' },
  { id: 'laundry', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400', label: 'Clean laundry' },
  { id: 'promo',   image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', label: 'Save on E-Chop' },
  { id: 'deliver', image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400', label: 'Fast delivery' },
  { id: 'refer',   image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400', label: 'Refer & earn' },
];
const LAST_START = Math.max(0, banners.length - 3);

const LOCATIONS: { place: string; live: boolean }[] = [
  { place: 'Lokoja, Kogi State', live: true },
  { place: 'Keffi, Nasarawa State', live: false },
  { place: 'Warri, Delta State', live: false },
  { place: 'Sokoto State', live: false },
  { place: 'Kano State', live: false },
  { place: 'Niger State', live: false },
  { place: 'Benin City', live: false },
];

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  colors: [string, string];
  image: string;
};

// Partner advertisements (display only, not tappable).
const SLIDES: Slide[] = [
  {
    id: 'laundry', eyebrow: 'LAUNDRY PARTNER', title: 'Own a laundry?\nGet more orders', icon: 'droplet',
    colors: [foodColors.badgeBlue, '#1E3A8A'],
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300',
  },
  {
    id: 'food', eyebrow: 'FOOD VENDOR', title: 'Sell your meals\nto more people', icon: 'coffee',
    colors: [foodColors.primary, '#C2410C'],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300',
  },
  {
    id: 'rider', eyebrow: 'DISPATCH RIDER', title: 'Ride with Hemera,\nearn every trip', icon: 'truck',
    colors: [foodColors.forestGreen, '#14532D'],
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300',
  },
  {
    id: 'restaurant', eyebrow: 'RESTAURANT PARTNER', title: 'Grow your\nrestaurant with us', icon: 'home',
    colors: ['#1F2937', '#111827'],
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300',
  },
];
// First slide repeated at the end so the loop wraps seamlessly.
const LOOP_SLIDES = [...SLIDES, { ...SLIDES[0], id: `${SLIDES[0].id}-clone` }];

/* ---------------- Auto-sliding footer ---------------- */

function AutoSlider() {
  const ref = useRef<ScrollView>(null);
  const index = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      index.current += 1;
      ref.current?.scrollTo({ x: index.current * SLIDE_W, animated: true });

      // After landing on the clone, snap back to the real first slide.
      if (index.current === SLIDES.length) {
        setTimeout(() => {
          index.current = 0;
          ref.current?.scrollTo({ x: 0, animated: false });
        }, 450);
      }
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.sliderWrap}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {LOOP_SLIDES.map((s) => (
          <View key={s.id} style={{ width: SLIDE_W, height: SLIDE_H }}>
            <LinearGradient
              colors={s.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.slide}
            >
              <View style={styles.slideText}>
                <View style={styles.slideEyebrow}>
                  <Feather name={s.icon} size={11} color="#fff" />
                  <Text style={styles.slideEyebrowText}>{s.eyebrow}</Text>
                </View>
                <Text style={styles.slideTitle} numberOfLines={2}>{s.title}</Text>
                <View style={styles.slideCta}>
                  <Feather name="globe" size={11} color={foodColors.textPrimary} />
                  <Text style={styles.slideCtaText}>Apply at gethemera.app</Text>
                </View>
              </View>
              <Image source={{ uri: s.image }} style={styles.slideImg} />
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------------- Pop-up sheet ---------------- */

function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]} onPress={() => {}}>
          <View style={styles.handle} />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetBadge({ icon, color }: { icon: keyof typeof Feather.glyphMap; color: string }) {
  return (
    <View style={[styles.sheetBadge, { backgroundColor: `${color}1A` }]}>
      <Feather name={icon} size={26} color={color} />
    </View>
  );
}

function ProductsContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetBadge icon="shopping-bag" color={foodColors.forestGreen} />
      <View style={styles.soonPill}>
        <Feather name="clock" size={11} color={foodColors.primary} />
        <Text style={styles.soonPillText}>COMING SOON</Text>
      </View>
      <Text style={styles.sheetTitle}>Shop Hemera Laundry Equipment</Text>
      <Text style={styles.sheetBody}>
        Quality washing machines, dryers, irons and laundry essentials, available to buy
        straight from Hemera very soon. We'll let you know the moment the store opens.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onClose} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Got it</Text>
      </TouchableOpacity>
    </>
  );
}

function LocationsContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetBadge icon="map" color={foodColors.forestGreen} />
      <Text style={styles.sheetTitle}>Our Locations</Text>
      <Text style={styles.sheetBody}>Where Hemera is available, and where we're heading next.</Text>

      <View style={styles.locList}>
        {LOCATIONS.map((l, i) => (
          <View key={l.place} style={[styles.locRow, i === LOCATIONS.length - 1 && styles.locRowLast]}>
            <View style={[styles.locPin, l.live ? styles.locPinLive : styles.locPinSoon]}>
              <Feather name="map-pin" size={14} color={l.live ? foodColors.forestGreen : foodColors.textMuted} />
            </View>
            <Text style={styles.locPlace}>{l.place}</Text>
            <View style={[styles.locBadge, l.live ? styles.locBadgeLive : styles.locBadgeSoon]}>
              {l.live && <View style={styles.liveDot} />}
              <Text style={[styles.locBadgeText, l.live ? styles.locBadgeTextLive : styles.locBadgeTextSoon]}>
                {l.live ? 'Live' : 'Coming soon'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onClose} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Got it</Text>
      </TouchableOpacity>
    </>
  );
}

/* ---------------- Screen ---------------- */

export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerIndexRef = useRef(0);
  const lastTouch = useRef(0);
  const [sheet, setSheet] = useState<ServiceAction | null>(null);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(LAST_START, i));
    bannerIndexRef.current = next;
    scrollRef.current?.scrollTo({ x: next * BANNER_STEP, animated: true });
    setBannerIndex(next);
  };

  // Auto-advance the banners; wrap back to the start after the last position.
  useEffect(() => {
    if (LAST_START === 0) return;
    const timer = setInterval(() => {
      // Hold off while the user is interacting with the carousel.
      if (Date.now() - lastTouch.current < BANNER_PAUSE_AFTER_TOUCH) return;
      const next = bannerIndexRef.current >= LAST_START ? 0 : bannerIndexRef.current + 1;
      goTo(next);
    }, BANNER_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const markTouch = () => {
    lastTouch.current = Date.now();
  };

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(LAST_START, Math.round(e.nativeEvent.contentOffset.x / BANNER_STEP)));
    bannerIndexRef.current = i;
    setBannerIndex(i);
  };

  const open = (service: QuickService) => {
    if (service.action) {
      setSheet(service.action);
      return;
    }
    router.push((service.route ?? '/contact-support') as any);
  };

  const closeSheet = () => setSheet(null);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color={foodColors.textPrimary} />
        </TouchableOpacity>

        {/* Banner carousel (auto-sliding) */}
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={BANNER_STEP}
            decelerationRate="fast"
            onScrollBeginDrag={markTouch}
            onScrollEndDrag={markTouch}
            onMomentumScrollEnd={onBannerScroll}
            contentContainerStyle={styles.carouselTrack}
          >
            {banners.map((b) => (
              <View key={b.id} style={styles.banner}>
                <Image source={{ uri: b.image }} style={styles.bannerImg} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.bannerShade} />
                <Text style={styles.bannerLabel} numberOfLines={1}>{b.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: LAST_START + 1 }, (_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                markTouch();
                goTo(i);
              }}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <View style={[styles.dot, bannerIndex === i && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.pageTitle}>All Services</Text>

        {/* Grid */}
        <View style={styles.grid}>
          {allServices.map((s) => (
            <TouchableOpacity key={s.id} style={styles.cell} activeOpacity={0.8} onPress={() => open(s)}>
              <View style={[styles.cellIcon, { backgroundColor: s.bgColor }]}>
                {s.symbol ? (
                  <Text style={styles.cellSymbol} allowFontScaling={false}>{s.symbol}</Text>
                ) : (
                  <Feather name={s.icon} size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.cellTitle} numberOfLines={2} allowFontScaling={false}>
                {s.title}
              </Text>
              <Text style={styles.cellSub} numberOfLines={3} allowFontScaling={false}>
                {s.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer: auto-sliding promos */}
        <AutoSlider />
      </ScrollView>

      <Sheet visible={sheet !== null} onClose={closeSheet}>
        {sheet === 'products' && <ProductsContent onClose={closeSheet} />}
        {sheet === 'locations' && <LocationsContent onClose={closeSheet} />}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAD },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  // Carousel
  carouselWrap: { marginHorizontal: -PAD },
  carouselTrack: { paddingHorizontal: PAD, gap: BANNER_GAP },
  banner: { width: BANNER_W, height: BANNER_H, borderRadius: 14, overflow: 'hidden', backgroundColor: foodColors.surface },
  bannerImg: { width: '100%', height: '100%' },
  bannerShade: { ...StyleSheet.absoluteFill, top: '50%' },
  bannerLabel: {
    position: 'absolute', left: 8, right: 8, bottom: 8,
    fontSize: fs(11, 10), fontFamily: fonts.poppins.bold, color: '#fff',
  },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12, marginBottom: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: foodColors.border },
  dotActive: { backgroundColor: foodColors.badgeBlue },

  pageTitle: {
    fontSize: fs(24, 19),
    lineHeight: fs(32, 25),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 16,
  },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  cell: {
    width: CELL_W,
    minHeight: 128,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cellIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cellSymbol: {
    fontSize: fs(18, 16),
    lineHeight: fs(22, 20),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    textAlign: 'center',
    includeFontPadding: false,
  },
  cellTitle: {
    fontSize: fs(10.5, 9.5), lineHeight: fs(13, 12), fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary, textAlign: 'center', marginBottom: 3,
  },
  cellSub: {
    fontSize: fs(9, 8), lineHeight: fs(11.5, 10.5), fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary, textAlign: 'center', paddingHorizontal: 2,
  },

  // Footer slider
  sliderWrap: { marginTop: 24, borderRadius: 20, overflow: 'hidden' },
  slide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    overflow: 'hidden',
  },
  slideText: { flex: 1, paddingVertical: 14 },
  slideEyebrow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 6,
  },
  slideEyebrowText: { fontSize: fs(9.5, 8.5), fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.8 },
  slideTitle: {
    fontSize: fs(16, 13.5), lineHeight: fs(21, 18),
    fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 8,
  },
  slideCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  slideCtaText: { fontSize: fs(11, 10), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  slideImg: {
    width: SLIDE_H * 1.05,
    height: SLIDE_H * 1.05,
    borderRadius: SLIDE_H,
    marginRight: -SLIDE_H * 0.18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // Sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(11,16,32,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: foodColors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    alignItems: 'center',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: foodColors.border, marginBottom: 18 },
  sheetBadge: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  sheetTitle: {
    fontSize: fs(18, 15), lineHeight: fs(24, 20),
    fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, textAlign: 'center', marginBottom: 6,
  },
  sheetBody: {
    fontSize: fs(13, 12), lineHeight: fs(19, 17), fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary, textAlign: 'center', marginBottom: 18,
  },
  soonPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: foodColors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10,
  },
  soonPillText: { fontSize: fs(10, 9), fontFamily: fonts.poppins.bold, color: foodColors.primary, letterSpacing: 0.8 },

  primaryBtn: {
    width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: foodColors.primary, paddingVertical: 15, borderRadius: 26,
  },
  primaryBtnText: { fontSize: fs(14, 13), fontFamily: fonts.poppins.bold, color: '#fff' },

  // Locations
  locList: { width: '100%', backgroundColor: foodColors.surface, borderRadius: 16, marginBottom: 18, overflow: 'hidden' },
  locRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  locRowLast: { borderBottomWidth: 0 },
  locPin: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  locPinLive: { backgroundColor: 'rgba(52,199,89,0.14)' },
  locPinSoon: { backgroundColor: foodColors.background },
  locPlace: { flex: 1, fontSize: fs(13.5, 12), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  locBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  locBadgeLive: { backgroundColor: 'rgba(52,199,89,0.14)' },
  locBadgeSoon: { backgroundColor: foodColors.background },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759' },
  locBadgeText: { fontSize: fs(10.5, 9.5), fontFamily: fonts.poppins.bold },
  locBadgeTextLive: { color: foodColors.forestGreen },
  locBadgeTextSoon: { color: foodColors.textMuted },
});