import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';
import { useOrders } from '../../src/hooks/useOrders';
import { ms, s, clamp } from '../../src/utils/responsive';

// How long each card rests, and how long the slide to the next card takes.
const AUTO_SLIDE_MS = 2200;
const SLIDE_DURATION_MS = 700;

const BADGE_BLUE_DARK = '#1E3F82';

// Stop text from blowing past the layout when the phone's system font size is large.
const MAX_FONT_SCALE = 1.2;

type QuickService = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  bgColor: string;
  route?: string;
};

const quickServices: QuickService[] = [
  { id: 'echop',    icon: 'coffee',         title: 'E-Chop',          subtitle: 'Order food you love',      bgColor: foodColors.primary,     route: '/echop' },
  { id: 'ewash',    icon: 'droplet',        title: 'E-Wash',          subtitle: 'Laundry & dry cleaning',   bgColor: foodColors.badgeBlue,   route: '/wash' },
  { id: 'track',    icon: 'map-pin',        title: 'Track Order',     subtitle: 'Track your orders live',   bgColor: foodColors.forestGreen, route: '/track-order' },
  { id: 'pickup',   icon: 'truck',          title: 'Request Pickup',  subtitle: 'Schedule a pickup',        bgColor: foodColors.primary,     route: '/request-pickup' },
  { id: 'support',  icon: 'message-circle', title: 'Support',         subtitle: 'Get help anytime',         bgColor: foodColors.badgeBlue,   route: '/contact-support' },
  { id: 'quality',  icon: 'shield',         title: 'Quality Promise', subtitle: 'Top quality assurance',    bgColor: foodColors.primary,     route: '/quality-promise' },
  { id: 'eplan',    icon: 'calendar',       title: 'E-Plan',          subtitle: 'Plan meals ahead',         bgColor: foodColors.forestGreen, route: '/e-plan' },
  { id: 'offers',   icon: 'tag',            title: 'Offers',          subtitle: 'Exclusive deals for you',  bgColor: foodColors.badgeBlue,   route: '/offers' },
];

type PromoCard = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  bg: string;
  iconBg: string;
  image: string;
};

const promoCards: PromoCard[] = [
  { id: 'echop-offer', label: 'E-Chop', title: 'Special Offers', subtitle: 'Up to 20% off', bg: '#FDEAE4', iconBg: foodColors.primary, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' },
  { id: 'ewash-offer', label: 'E-Wash', title: 'Fresh & Clean', subtitle: '20% off this week', bg: '#E4ECFB', iconBg: foodColors.badgeBlue, image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200' },
  { id: 'refer-offer', label: 'Refer & Earn', title: 'Invite & get', subtitle: 'amazing rewards', bg: '#E3F6E9', iconBg: foodColors.forestGreen, image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=200' },
  { id: 'track-offer', label: 'Track Order', title: 'Live Tracking', subtitle: 'Know it in real-time', bg: '#FDEAE4', iconBg: foodColors.primary, image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200' },
  { id: 'support-offer', label: 'Support', title: "We're here", subtitle: '24/7 assistance', bg: '#E4ECFB', iconBg: foodColors.badgeBlue, image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200' },
  { id: 'quality-offer', label: 'Quality Promise', title: 'Verified Partners', subtitle: 'Trusted service', bg: '#E3F6E9', iconBg: foodColors.success, image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200' },
];

// Two sets of cards back-to-back so the slide can loop seamlessly.
const LOOPED_CARDS = [...promoCards, ...promoCards];

function firstName(fullName?: string | null) {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { displayName } = useAuth();
  const [activeDot, setActiveDot] = useState(0);
  const { orders } = useOrders();
  const latestOrder = orders[0] ?? null;

  // All width-dependent sizes are computed from the live window width,
  // so small phones, big phones and tablets each get a layout that fits.
  const layout = useMemo(() => {
    const hPad = width < 360 ? 14 : width >= 600 ? 28 : 18;
    const contentWidth = width - hPad * 2;

    // Promo carousel: fewer, wider cards on small screens so text stays readable.
    const promoVisible = width >= 600 ? 4.3 : width < 360 ? 2.2 : 2.5;
    const promoGap = 8;
    const promoCardWidth =
      (width - hPad - promoGap * Math.floor(promoVisible)) / promoVisible;
    const promoStep = promoCardWidth + promoGap;
    const promoHeight = clamp(Math.round(promoCardWidth * 0.62), 76, 110);

    // Quick services: always 4 per row, card width derived from the space.
    const serviceCols = 4;
    const serviceGap = width < 360 ? 8 : 10;
    const serviceCardWidth = (contentWidth - serviceGap * (serviceCols - 1)) / serviceCols;

    const heroImage = clamp(Math.round(width * 0.32), 96, 180);

    return {
      hPad,
      promoGap,
      promoCardWidth,
      promoStep,
      promoHeight,
      promoTrackWidth: hPad + LOOPED_CARDS.length * promoStep,
      serviceGap,
      serviceCardWidth,
      heroImage,
    };
  }, [width]);

  // The promo track is moved with a native-driven translateX, so the slide
  // runs on the UI thread and stays smooth even while the JS thread is busy.
  const translateX = useRef(new Animated.Value(0)).current;
  const currentIndexRef = useRef(0);
  const { promoStep } = layout;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    // Width changed (rotation / first measure) → restart from a clean position.
    currentIndexRef.current = 0;
    translateX.setValue(0);
    setActiveDot(0);

    const slideToNext = () => {
      const next = currentIndexRef.current + 1;
      setActiveDot(next % promoCards.length);

      Animated.timing(translateX, {
        toValue: -next * promoStep,
        duration: SLIDE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;

        // After the last card of the first set, the second set looks identical,
        // so jump back to the start without the user seeing anything change.
        currentIndexRef.current = next % promoCards.length;
        if (next >= promoCards.length) {
          translateX.setValue(-currentIndexRef.current * promoStep);
        }

        timer = setTimeout(slideToNext, AUTO_SLIDE_MS);
      });
    };

    timer = setTimeout(slideToNext, AUTO_SLIDE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      translateX.stopAnimation();
    };
  }, [translateX, promoStep]);

  // Profile name first; fall back to the name saved at sign-up.
  const greetingName = firstName(profile?.fullName) || firstName(displayName) || 'there';

  const handleServicePress = (service: QuickService) => {
    router.push((service.route ?? '/support') as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: layout.hPad, paddingTop: insets.top + ms(12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text
              style={styles.greeting}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              Welcome, {greetingName} 👋
            </Text>
            <Text
              style={styles.subGreeting}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              What would you like to do today?
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push('/notification' as any)}
            >
              <Feather name="bell" size={ms(18)} color={foodColors.textPrimary} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.referButton}
              onPress={() => router.push('/refer-earn' as any)}
            >
              <Feather name="gift" size={ms(14)} color="#fff" />
              <Text style={styles.referText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Refer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Banner */}
        <LinearGradient
          colors={[foodColors.badgeBlue, BADGE_BLUE_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTag}>
            <Text style={styles.heroTagText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Delicious. Reliable. Fast.
            </Text>
          </View>
          <Text style={styles.heroTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Great Meals,{'\n'}Delivered Fast
          </Text>
          <Text
            style={styles.heroSubtitle}
            numberOfLines={2}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            Your favorite meals, delivered to your door.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push('/echop' as any)}
          >
            <Text style={styles.heroButtonText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Order E-Chop
            </Text>
            <Feather name="arrow-right" size={ms(13)} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400' }}
            style={[
              styles.heroImage,
              {
                width: layout.heroImage,
                height: layout.heroImage,
                borderRadius: layout.heroImage / 2,
              },
            ]}
          />
        </LinearGradient>

        {/* Promo carousel (auto-sliding, seamless loop) */}
        <View
          style={[
            styles.promoViewport,
            { marginHorizontal: -layout.hPad, height: layout.promoHeight },
          ]}
        >
          <Animated.View
            style={[
              styles.promoTrack,
              {
                gap: layout.promoGap,
                paddingLeft: layout.hPad,
                width: layout.promoTrackWidth,
                transform: [{ translateX }],
              },
            ]}
          >
            {LOOPED_CARDS.map((card, i) => (
              <View
                key={`${card.id}-${i}`}
                style={[
                  styles.promoCard,
                  {
                    backgroundColor: card.bg,
                    width: layout.promoCardWidth,
                    height: layout.promoHeight,
                  },
                ]}
              >
                <Text
                  style={[styles.promoLabel, { color: card.iconBg }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                >
                  {card.label}
                </Text>
                <Text style={styles.promoTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {card.title}
                </Text>
                <Text style={styles.promoSubtitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {card.subtitle}
                </Text>
                <View style={[styles.promoIconCircle, { backgroundColor: card.iconBg }]}>
                  <Feather name="arrow-right" size={ms(12)} color="#fff" />
                </View>
                <Image source={{ uri: card.image }} style={styles.promoImage} />
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.dotsRow}>
          {promoCards.map((_, i) => (
            <View key={i} style={[styles.dot, activeDot === i && styles.dotActive]} />
          ))}
        </View>

        {/* Quick Services */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Quick Services
          </Text>
          <TouchableOpacity>
            <Text style={styles.seeAll} maxFontSizeMultiplier={MAX_FONT_SCALE}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.servicesGrid, { gap: layout.serviceGap }]}>
          {quickServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, { width: layout.serviceCardWidth }]}
              activeOpacity={0.8}
              onPress={() => handleServicePress(service)}
            >
              <View style={[styles.serviceIconWrap, { backgroundColor: service.bgColor }]}>
                <Feather name={service.icon} size={ms(16)} color="#fff" />
              </View>
              <Text
                style={styles.serviceTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {service.title}
              </Text>
              <Text
                style={styles.serviceSubtitle}
                numberOfLines={2}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {service.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {latestOrder && (
          <>
            <Text style={[styles.sectionTitle, styles.activityHeading]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Recent Activity
            </Text>

            <TouchableOpacity
              style={styles.activityCard}
              activeOpacity={0.8}
              onPress={() => router.push('/recent-activity' as any)}
            >
              <View style={styles.activityIconWrap}>
                {latestOrder.type === 'echop' ? (
                  <Feather name="coffee" size={ms(20)} color={foodColors.primary} />
                ) : (
                  <MaterialCommunityIcons name="washing-machine" size={ms(20)} color={foodColors.badgeBlue} />
                )}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {latestOrder.title}
                </Text>
                {!!latestOrder.meta && (
                  <Text style={styles.activitySubtitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {latestOrder.meta}
                  </Text>
                )}
                <View style={styles.activityDateRow}>
                  <Feather name="calendar" size={ms(12)} color={foodColors.textMuted} />
                  <Text style={styles.activityDate} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {latestOrder.date}
                  </Text>
                </View>
              </View>
              <View style={styles.activityRight}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {latestOrder.status === 'Delivered' ? 'Completed' : latestOrder.status}
                  </Text>
                </View>
                <Feather name="chevron-right" size={ms(16)} color={foodColors.textMuted} />
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FoodTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: ms(20) },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(16),
    gap: ms(10),
  },
  greetingBlock: { flex: 1, minWidth: 0 },
  greeting: { fontSize: ms(17), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  subGreeting: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  bellButton: {
    width: ms(40), height: ms(40), borderRadius: ms(12),
    backgroundColor: foodColors.surface,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  bellDot: {
    position: 'absolute', top: ms(8), right: ms(9),
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: foodColors.primary,
    borderWidth: 1.5, borderColor: foodColors.surface,
  },
  referButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: foodColors.badgeBlue,
    paddingHorizontal: ms(12), height: ms(40),
    borderRadius: ms(12),
  },
  referText: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: '#fff' },

  heroCard: {
    borderRadius: ms(20),
    paddingHorizontal: ms(16),
    paddingVertical: ms(16),
    marginBottom: ms(16),
    overflow: 'hidden',
    minHeight: s(140),
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: foodColors.primary,
    paddingHorizontal: ms(8), paddingVertical: 3,
    borderRadius: 6,
    marginBottom: ms(8),
  },
  heroTagText: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: '#fff' },
  heroTitle: {
    fontSize: ms(20),
    lineHeight: ms(25),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: ms(4),
    maxWidth: '65%',
  },
  heroSubtitle: {
    fontSize: ms(12),
    lineHeight: ms(16),
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: '60%',
    marginBottom: ms(12),
  },
  heroButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: ms(12), paddingVertical: ms(8),
    borderRadius: ms(10),
  },
  heroButtonText: { fontSize: ms(12), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  heroImage: {
    position: 'absolute',
    right: -8, bottom: -8,
  },

  promoViewport: {
    marginBottom: ms(10),
    overflow: 'hidden',
  },
  promoTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promoCard: {
    borderRadius: ms(14),
    padding: ms(10),
    overflow: 'hidden',
  },
  promoLabel: { fontSize: ms(10.5), fontFamily: fonts.poppins.bold, marginBottom: 1 },
  promoTitle: { fontSize: ms(11.5), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  promoSubtitle: { fontSize: ms(10), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  promoIconCircle: {
    position: 'absolute', bottom: ms(8), left: ms(10),
    width: ms(22), height: ms(22), borderRadius: ms(11),
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2,
  },
  promoImage: {
    position: 'absolute',
    bottom: -6, right: -6,
    width: ms(56), height: ms(56),
    borderRadius: ms(28),
  },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: ms(18) },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: foodColors.border },
  dotActive: { backgroundColor: foodColors.badgeBlue, width: 12 },

  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: ms(10),
  },
  sectionTitle: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  seeAll: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.badgeBlue },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: ms(20),
  },
  serviceCard: {
    minHeight: ms(100),
    backgroundColor: '#fff',
    borderRadius: ms(14),
    paddingVertical: ms(12),
    paddingHorizontal: ms(4),
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  serviceIconWrap: {
    width: ms(32), height: ms(32), borderRadius: ms(10),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: ms(8),
  },
  serviceTitle: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  serviceSubtitle: {
    fontSize: ms(9.5),
    lineHeight: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
  },

  activityHeading: { marginBottom: ms(10) },
  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(14), gap: ms(12),
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  activityIconWrap: {
    width: ms(44), height: ms(44), borderRadius: ms(22),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  activityInfo: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  activitySubtitle: { fontSize: ms(12), fontFamily: fonts.poppins.medium, color: foodColors.badgeBlue, marginTop: 1 },
  activityDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  activityDate: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  activityRight: { alignItems: 'flex-end', gap: 8 },
  statusPill: {
    backgroundColor: 'rgba(46,90,172,0.1)',
    paddingHorizontal: ms(10), paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: foodColors.badgeBlue },

  bottomSpacer: { height: ms(20) },
});