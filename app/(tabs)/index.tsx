// app/(tabs)/index.tsx
import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const PROMO_GAP = 2;
const PROMO_VISIBLE = 2.95;
const PROMO_ROW_WIDTH = SCREEN_WIDTH - 20;
const PROMO_CARD_WIDTH = (PROMO_ROW_WIDTH - PROMO_GAP * (Math.ceil(PROMO_VISIBLE) - 1)) / PROMO_VISIBLE;
const SERVICE_GRID_GAP = 12;
const SERVICE_COLUMNS = 4;
const SERVICE_CARD_WIDTH =
  (CARD_WIDTH - SERVICE_GRID_GAP * (SERVICE_COLUMNS - 1)) / SERVICE_COLUMNS;
const SERVICE_CARD_INNER_WIDTH = SERVICE_CARD_WIDTH * 0.92;

const BADGE_BLUE_DARK = '#1E3F82';

type QuickService = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  bgColor: string;
  route?: string;
};

const quickServices: QuickService[] = [
  { id: 'echop', icon: 'coffee', title: 'E-Chop', subtitle: 'Order food you love', bgColor: foodColors.primary, route: '/echop' },
  { id: 'ewash', icon: 'droplet', title: 'E-Wash', subtitle: 'Laundry & dry cleaning', bgColor: foodColors.badgeBlue, route: '/wash' },
  { id: 'track', icon: 'map-pin', title: 'Track Order', subtitle: 'Track your orders live', bgColor: foodColors.forestGreen },
  { id: 'refer', icon: 'user-plus', title: 'Refer & Earn', subtitle: 'Invite friends & earn', bgColor: foodColors.primary, route: '/refer-earn' },
  { id: 'support', icon: 'message-circle', title: 'Support', subtitle: 'Get help anytime', bgColor: foodColors.badgeBlue },
  { id: 'quality', icon: 'shield', title: 'Quality Promise', subtitle: 'Top quality assurance', bgColor: foodColors.primary },
  { id: 'schedule', icon: 'clock', title: 'Schedule', subtitle: 'Pick a time that suits you', bgColor: foodColors.forestGreen },
  { id: 'offers', icon: 'tag', title: 'Offers', subtitle: 'Exclusive deals for you', bgColor: foodColors.badgeBlue },
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
  { id: 'ewash-offer', label: 'E-Wash', title: 'Fresh & Clean', subtitle: '20% off this week', bg: '#E4ECFB', iconBg: foodColors.badgeBlue, image: 'https://images.unsplash.com/photo-1washer-1523293182086-7651a899d37f?w=200' },
  { id: 'refer-offer', label: 'Refer & Earn', title: 'Invite & get', subtitle: 'amazing rewards', bg: '#E3F6E9', iconBg: foodColors.forestGreen, image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=200' },
  { id: 'track-offer', label: 'Track Order', title: 'Live Tracking', subtitle: 'Know it in real-time', bg: '#FDEAE4', iconBg: foodColors.primary, image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200' },
  { id: 'support-offer', label: 'Support', title: "We're here", subtitle: '24/7 assistance', bg: '#E4ECFB', iconBg: foodColors.badgeBlue, image: 'https://images.unsplash.com/photo-1553775282-20af80779df7?w=200' },
  { id: 'quality-offer', label: 'Quality Promise', title: 'Verified Partners', subtitle: 'Trusted service', bg: '#E3F6E9', iconBg: foodColors.success, image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=200' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeDot, setActiveDot] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (PROMO_CARD_WIDTH + PROMO_GAP));
    setActiveDot(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Welcome, Suleiman 👋</Text>
            <Text style={styles.subGreeting}>What would you like to do today?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push('/notification')}
            >
              <Feather name="bell" size={18} color={foodColors.textPrimary} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.referButton}
              onPress={() => router.push('/refer-earn' as any)}
            >
              <Feather name="gift" size={15} color="#fff" />
              <Text style={styles.referText}>Refer</Text>
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
            <Text style={styles.heroTagText}>Delicious. Reliable. Fast.</Text>
          </View>
          <Text style={styles.heroTitle}>Great Meals,{'\n'}Delivered Fast</Text>
          <Text style={styles.heroSubtitle}>Your favorite meals, delivered to your door.</Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push('/echop')}
          >
            <Text style={styles.heroButtonText}>Order E-Chop</Text>
            <Feather name="arrow-right" size={15} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400' }}
            style={styles.heroImage}
          />
        </LinearGradient>

        {/* Promo carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          snapToInterval={PROMO_CARD_WIDTH + PROMO_GAP}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.promoScroll}
          contentContainerStyle={styles.promoScrollContent}
        >
          {promoCards.map((card) => (
            <View key={card.id} style={[styles.promoCard, { backgroundColor: card.bg }]}>
              <Text style={[styles.promoLabel, { color: card.iconBg }]} numberOfLines={1}>{card.label}</Text>
              <Text style={styles.promoTitle} numberOfLines={1}>{card.title}</Text>
              <Text style={styles.promoSubtitle} numberOfLines={1}>{card.subtitle}</Text>
              <View style={[styles.promoIconCircle, { backgroundColor: card.iconBg }]}>
                <Feather name="arrow-right" size={12} color="#fff" />
              </View>
              <Image source={{ uri: card.image }} style={styles.promoImage} />
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotsRow}>
          {promoCards.map((_, i) => (
            <View key={i} style={[styles.dot, activeDot === i && styles.dotActive]} />
          ))}
        </View>

        {/* Quick Services */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {quickServices.map((service) => (
            <View key={service.id} style={styles.serviceSlot}>
              <TouchableOpacity
                style={styles.serviceCard}
                activeOpacity={0.8}
                onPress={() => service.route && router.push(service.route as any)}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: service.bgColor }]}>
                  <Feather name={service.icon} size={16} color="#fff" />
                </View>
                <Text style={styles.serviceTitle} numberOfLines={1}>{service.title}</Text>
                <Text style={styles.serviceSubtitle} numberOfLines={2}>{service.subtitle}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {/* <TouchableOpacity style={styles.activityCard} activeOpacity={0.8}> */}
        <TouchableOpacity
          style={styles.activityCard}
          activeOpacity={0.8}
          onPress={() => router.push('/recent-activity')}
        >
          <View style={styles.activityIconWrap}>
            <MaterialCommunityIcons name="washing-machine" size={20} color={foodColors.badgeBlue} />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>E-Wash Order</Text>
            <Text style={styles.activitySubtitle}>Pickup scheduled</Text>
            <View style={styles.activityDateRow}>
              <Feather name="calendar" size={12} color={foodColors.textMuted} />
              <Text style={styles.activityDate}>Today, 10:30 AM</Text>
            </View>
          </View>
          <View style={styles.activityRight}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>In progress</Text>
            </View>
            <Feather name="chevron-right" size={16} color={foodColors.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FoodTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background,marginTop:16 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 46, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 16, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  subGreeting: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: foodColors.surface,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  bellDot: {
    position: 'absolute', top: 8, right: 9,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: foodColors.primary,
    borderWidth: 1.5, borderColor: foodColors.surface,
  },
  referButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: foodColors.badgeBlue,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 12,
  },
  referText: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },

  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 190,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: foodColors.primary,
    paddingHorizontal: 4, paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  heroTagText: { fontSize: 8, fontFamily: fonts.poppins.bold, color: '#fff' },
  heroTitle: { fontSize: 22, fontFamily: fonts.poppins.bold, color: '#fff', lineHeight: 27, marginBottom: 8, maxWidth: '65%' },
  heroSubtitle: { fontSize: 12, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.8)', maxWidth: '60%', marginBottom: 16 },
  heroButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 8, paddingVertical: 9,
    borderRadius: 12,
  },
  heroButtonText: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  heroImage: {
    position: 'absolute',
    right: -10, bottom: -10,
    width: 160, height: 160,
    borderRadius: 80,
  },

  promoScroll: { marginBottom: 8, marginHorizontal: -20 },
  promoScrollContent: { gap: PROMO_GAP, paddingLeft: 20, paddingRight: 0 },
  promoCard: {
    width: PROMO_CARD_WIDTH,
    height: 80,
    borderRadius: 14,
    padding: 8,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  promoLabel: { fontSize: 9, fontFamily: fonts.poppins.bold, marginBottom: 2 },
  promoTitle: { fontSize: 7, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  promoSubtitle: { fontSize: 8, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 1 },
  promoIconCircle: {
    position: 'absolute', bottom: 8, left: 8,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2,
  },
  promoImage: {
    position: 'absolute',
    bottom: -6, right: -6,
    width: 56, height: 56,
    borderRadius: 28,
  },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: foodColors.border },
  dotActive: { backgroundColor: foodColors.badgeBlue },

  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
    marginTop:-10
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.poppins.bold,marginBottom:5,color: foodColors.textPrimary },
  seeAll: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: foodColors.badgeBlue },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SERVICE_GRID_GAP,
    marginBottom: 8,
  },
  serviceSlot: {
    width: SERVICE_CARD_WIDTH,
    alignItems: 'center',
  },
  serviceCard: {
    width: SERVICE_CARD_INNER_WIDTH,
    height: 104,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  serviceIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  serviceTitle: { fontSize: 8, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginBottom: 2, textAlign: 'center' },
  serviceSubtitle: { fontSize: 9, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 11, textAlign: 'center',paddingRight:5,paddingLeft:5 },

  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  activityIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  activitySubtitle: { fontSize: 12, fontFamily: fonts.poppins.medium, color: foodColors.badgeBlue, marginTop: 1 },
  activityDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  activityDate: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  activityRight: { alignItems: 'flex-end', gap: 8 },
  statusPill: {
    backgroundColor: 'rgba(46,90,172,0.1)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: { fontSize: 11, fontFamily: fonts.poppins.semiBold, color: foodColors.badgeBlue },

  bottomSpacer: { height: 20 },
});