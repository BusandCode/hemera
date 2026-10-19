// import { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   Animated,
//   Easing,
// } from 'react-native';
// import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { StatusBar } from 'expo-status-bar';
// import { useRouter } from 'expo-router';
// import { foodColors } from '../../src/constants/foodColors';
// import { fonts } from '../../src/constants/typography';
// import { FoodTabBar } from '../../src/components/food/FoodTabBar';
// import { useProfile } from '../../src/context/ProfileContext';
// import { useOrders } from '../../src/hooks/useOrders';
// import { useAuth } from '../../src/context/AuthContext';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const CARD_WIDTH = SCREEN_WIDTH - 40;
// const PROMO_GAP = 5;
// const PROMO_VISIBLE = 2.95;
// const PROMO_ROW_WIDTH = SCREEN_WIDTH - 20;
// const PROMO_CARD_WIDTH = (PROMO_ROW_WIDTH - PROMO_GAP * (Math.ceil(PROMO_VISIBLE) - 1)) / PROMO_VISIBLE;
// const PROMO_STEP = PROMO_CARD_WIDTH + PROMO_GAP;
// const SERVICE_GRID_GAP = 12;
// const SERVICE_COLUMNS = 4;
// const SERVICE_CARD_WIDTH =
//   (CARD_WIDTH - SERVICE_GRID_GAP * (SERVICE_COLUMNS - 1)) / SERVICE_COLUMNS;
// const SERVICE_CARD_INNER_WIDTH = SERVICE_CARD_WIDTH * 0.92;

// // How long each card rests, and how long the slide to the next card takes.
// const AUTO_SLIDE_MS = 2200;
// const SLIDE_DURATION_MS = 700;

// const BADGE_BLUE_DARK = '#1E3F82';

// type QuickService = {
//   id: string;
//   icon: keyof typeof Feather.glyphMap;
//   title: string;
//   subtitle: string;
//   bgColor: string;
//   route?: string;
// };

// const quickServices: QuickService[] = [
//   { id: 'echop',    icon: 'coffee',         title: 'E-Chop',          subtitle: 'Order food you love',      bgColor: foodColors.primary,     route: '/echop' },
//   { id: 'ewash',    icon: 'droplet',        title: 'E-Wash',          subtitle: 'Laundry & dry cleaning',   bgColor: foodColors.badgeBlue,   route: '/wash' },
//   { id: 'track',    icon: 'map-pin',        title: 'Track Order',     subtitle: 'Track your orders live',   bgColor: foodColors.forestGreen, route: '/track-order' },
//   { id: 'pickup',   icon: 'truck',          title: 'Pickup',  subtitle: 'Schedule a pickup',        bgColor: foodColors.primary,     route: '/request-pickup' },
//   { id: 'support',  icon: 'message-circle', title: 'Support',         subtitle: 'Get help anytime',         bgColor: foodColors.badgeBlue,   route: '/contact-support' },
//   { id: 'quality',  icon: 'shield',         title: 'Our Promise', subtitle: 'Top quality assurance',    bgColor: foodColors.primary,     route: '/quality-promise' },
//   { id: 'eplan',    icon: 'calendar',       title: 'E-Plan',          subtitle: 'Plan meals ahead',         bgColor: foodColors.forestGreen, route: '/e-plan' },
//   { id: 'offers',   icon: 'tag',            title: 'Offers',          subtitle: 'Exclusive deals for you',  bgColor: foodColors.badgeBlue,   route: '/offers' },
// ];

// type PromoCard = {
//   id: string;
//   label: string;
//   title: string;
//   subtitle: string;
//   bg: string;
//   iconBg: string;
//   image: string;
// };

// const promoCards: PromoCard[] = [
//   { id: 'echop-offer', label: 'E-Chop', title: 'Special Offers', subtitle: 'Up to 20% off', bg: '#FDEAE4', iconBg: foodColors.primary, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' },
//   { id: 'ewash-offer', label: 'E-Wash', title: 'Fresh & Clean', subtitle: '20% off this week', bg: '#E4ECFB', iconBg: foodColors.badgeBlue, image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200' },
//   { id: 'refer-offer', label: 'Refer & Earn', title: 'Invite & get', subtitle: 'amazing rewards', bg: '#E3F6E9', iconBg: foodColors.forestGreen, image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=200' },
//   { id: 'track-offer', label: 'Track Order', title: 'Live Tracking', subtitle: 'Know it in real-time', bg: '#FDEAE4', iconBg: foodColors.primary, image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200' },
//   { id: 'support-offer', label: 'Support', title: "We're here", subtitle: '24/7 assistance', bg: '#E4ECFB', iconBg: foodColors.badgeBlue, image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200' },
//   { id: 'quality-offer', label: 'Quality Promise', title: 'Verified Partners', subtitle: 'Trusted service', bg: '#E3F6E9', iconBg: foodColors.success, image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200' },
// ];

// // Two sets of cards back-to-back so the slide can loop seamlessly.
// const LOOPED_CARDS = [...promoCards, ...promoCards];
// const PROMO_TRACK_WIDTH = 20 + LOOPED_CARDS.length * PROMO_STEP;

// function firstName(fullName: string) {
//   if (!fullName.trim()) return '';
//   return fullName.trim().split(' ')[0];
// }

// export default function HomeScreen() {
//   const router = useRouter();
//   const { profile } = useProfile();
//   const { displayName } = useAuth();
//   const [activeDot, setActiveDot] = useState(0);
//   const { orders } = useOrders();
//   const latestOrder = orders[0] ?? null;

//   // The promo track is moved with a native-driven translateX, so the slide
//   // runs on the UI thread and stays smooth even while the JS thread is busy.
//   const translateX = useRef(new Animated.Value(0)).current;
//   const currentIndexRef = useRef(0);

//   useEffect(() => {
//     let cancelled = false;
//     let timer: ReturnType<typeof setTimeout>;

//     const slideToNext = () => {
//       const next = currentIndexRef.current + 1;
//       setActiveDot(next % promoCards.length);

//       Animated.timing(translateX, {
//         toValue: -next * PROMO_STEP,
//         duration: SLIDE_DURATION_MS,
//         easing: Easing.inOut(Easing.cubic),
//         useNativeDriver: true,
//       }).start(({ finished }) => {
//         if (!finished || cancelled) return;

//         // After the last card of the first set, the second set looks identical,
//         // so jump back to the start without the user seeing anything change.
//         currentIndexRef.current = next % promoCards.length;
//         if (next >= promoCards.length) {
//           translateX.setValue(-currentIndexRef.current * PROMO_STEP);
//         }

//         timer = setTimeout(slideToNext, AUTO_SLIDE_MS);
//       });
//     };

//     timer = setTimeout(slideToNext, AUTO_SLIDE_MS);

//     return () => {
//       cancelled = true;
//       clearTimeout(timer);
//       translateX.stopAnimation();
//     };
//   }, [translateX]);

//   // Profile name first; fall back to the name saved at sign-up so it never shows blank.
//   const greetingName = firstName(profile?.fullName ?? '') || firstName(displayName) || 'there';

//   const handleServicePress = (service: QuickService) => {
//     if (service.route) {
//       router.push(service.route as any);
//     } else {
//       router.push('/support' as any);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar style="dark" />

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.content}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <View style={styles.greetingBlock}>
//             <Text style={styles.greeting}>Welcome, {greetingName} 👋</Text>
//             <Text style={styles.subGreeting}>What would you like to do today?</Text>
//           </View>
//           <View style={styles.headerActions}>
//             <TouchableOpacity
//               style={styles.bellButton}
//               onPress={() => router.push('/notification')}
//             >
//               <Feather name="bell" size={18} color={foodColors.textPrimary} />
//               <View style={styles.bellDot} />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.referButton}
//               onPress={() => router.push('/refer-earn' as any)}
//             >
//               <Feather name="gift" size={15} color="#fff" />
//               <Text style={styles.referText}>Refer</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Hero Banner */}
//         <LinearGradient
//           colors={[foodColors.badgeBlue, BADGE_BLUE_DARK]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.heroCard}
//         >
//           <View style={styles.heroTag}>
//             <Text style={styles.heroTagText}>Delicious. Reliable. Fast.</Text>
//           </View>
//           <Text style={styles.heroTitle}>Great Meals,{'\n'}Delivered Fast</Text>
//           <Text style={styles.heroSubtitle}>Your favorite meals, delivered to your door.</Text>
//           <TouchableOpacity
//             style={styles.heroButton}
//             onPress={() => router.push('/echop')}
//           >
//             <Text style={styles.heroButtonText}>Order E-Chop</Text>
//             <Feather name="arrow-right" size={13} color={foodColors.textPrimary} />
//           </TouchableOpacity>
//           <Image
//             source={{ uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400' }}
//             style={styles.heroImage}
//           />
//         </LinearGradient>

//         {/* Promo carousel (auto-sliding, seamless loop) */}
//         <View style={styles.promoViewport}>
//           <Animated.View
//             style={[styles.promoTrack, { transform: [{ translateX }] }]}
//           >
//             {LOOPED_CARDS.map((card, i) => (
//               <View
//                 key={`${card.id}-${i}`}
//                 style={[styles.promoCard, { backgroundColor: card.bg }]}
//               >
//                 <Text style={[styles.promoLabel, { color: card.iconBg }]} numberOfLines={1}>
//                   {card.label}
//                 </Text>
//                 <Text style={styles.promoTitle} numberOfLines={1}>{card.title}</Text>
//                 <Text style={styles.promoSubtitle} numberOfLines={1}>{card.subtitle}</Text>
//                 <View style={[styles.promoIconCircle, { backgroundColor: card.iconBg }]}>
//                   <Feather name="arrow-right" size={12} color="#fff" />
//                 </View>
//                 <Image source={{ uri: card.image }} style={styles.promoImage} />
//               </View>
//             ))}
//           </Animated.View>
//         </View>

//         <View style={styles.dotsRow}>
//           {promoCards.map((_, i) => (
//             <View key={i} style={[styles.dot, activeDot === i && styles.dotActive]} />
//           ))}
//         </View>

//         {/* Quick Services */}
//         <View style={styles.sectionHeaderRow}>
//           <Text style={styles.sectionTitle}>Quick Services</Text>
//           <TouchableOpacity>
//             <Text style={styles.seeAll}>See all</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.servicesGrid}>
//           {quickServices.map((service) => (
//             <View key={service.id} style={styles.serviceSlot}>
//               <TouchableOpacity
//                 style={styles.serviceCard}
//                 activeOpacity={0.8}
//                 onPress={() => handleServicePress(service)}
//               >
//                 <View style={[styles.serviceIconWrap, { backgroundColor: service.bgColor }]}>
//                   <Feather name={service.icon} size={16} color="#fff" />
//                 </View>
//                 <Text style={styles.serviceTitle} numberOfLines={1}>{service.title}</Text>
//                 <Text style={styles.serviceSubtitle} numberOfLines={2}>{service.subtitle}</Text>
//               </TouchableOpacity>
//             </View>
//           ))}
//         </View>

//         {latestOrder && (
//           <>
//             <Text style={styles.sectionTitle}>Recent Activity</Text>

//             <TouchableOpacity
//               style={styles.activityCard}
//               activeOpacity={0.8}
//               onPress={() => router.push('/recent-activity')}
//             >
//               <View style={styles.activityIconWrap}>
//                 {latestOrder.type === 'echop' ? (
//                   <Feather name="coffee" size={20} color={foodColors.primary} />
//                 ) : (
//                   <MaterialCommunityIcons name="washing-machine" size={20} color={foodColors.badgeBlue} />
//                 )}
//               </View>
//               <View style={styles.activityInfo}>
//                 <Text style={styles.activityTitle}>{latestOrder.title}</Text>
//                 {!!latestOrder.meta && (
//                   <Text style={styles.activitySubtitle}>{latestOrder.meta}</Text>
//                 )}
//                 <View style={styles.activityDateRow}>
//                   <Feather name="calendar" size={12} color={foodColors.textMuted} />
//                   <Text style={styles.activityDate}>{latestOrder.date}</Text>
//                 </View>
//               </View>
//               <View style={styles.activityRight}>
//                 <View style={styles.statusPill}>
//                   <Text style={styles.statusPillText}>
//                     {latestOrder.status === 'Delivered' ? 'Completed' : latestOrder.status}
//                   </Text>
//                 </View>
//                 <Feather name="chevron-right" size={16} color={foodColors.textMuted} />
//               </View>
//             </TouchableOpacity>
//           </>
//         )}

//         <View style={styles.bottomSpacer} />
//       </ScrollView>

//       <FoodTabBar />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: foodColors.background, marginTop: 16 },
//   scroll: { flex: 1 },
//   content: { paddingHorizontal: 20, paddingTop: 46, paddingBottom: 20 },

//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//   },
//   greetingBlock: { flex: 1 },
//   greeting: { fontSize: 14.4, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
//   subGreeting: { fontSize: 9.9, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 2 },
//   headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   bellButton: {
//     width: 40, height: 40, borderRadius: 12,
//     backgroundColor: foodColors.surface,
//     justifyContent: 'center', alignItems: 'center',
//     shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
//   },
//   bellDot: {
//     position: 'absolute', top: 8, right: 9,
//     width: 7, height: 7, borderRadius: 4,
//     backgroundColor: foodColors.primary,
//     borderWidth: 1.5, borderColor: foodColors.surface,
//   },
//   referButton: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     backgroundColor: foodColors.badgeBlue,
//     paddingHorizontal: 14, paddingVertical: 11,
//     borderRadius: 12,
//   },
//   referText: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },

//   heroCard: {
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     marginBottom: 16,
//     overflow: 'hidden',
//     minHeight: 128,
//   },
//   heroTag: {
//     alignSelf: 'flex-start',
//     backgroundColor: foodColors.primary,
//     paddingHorizontal: 8, paddingVertical: 3,
//     borderRadius: 6,
//     marginBottom: 8,
//   },
//   heroTagText: { fontSize: 9, fontFamily: fonts.poppins.bold, color: '#fff' },
//   heroTitle: {
//     fontSize: 19,
//     fontFamily: fonts.poppins.bold,
//     color: '#fff',
//     lineHeight: 23,
//     marginBottom: 4,
//     maxWidth: '68%',
//   },
//   heroSubtitle: {
//     fontSize: 11,
//     fontFamily: fonts.poppins.regular,
//     color: 'rgba(255,255,255,0.8)',
//     maxWidth: '60%',
//     marginBottom: 12,
//   },
//   heroButton: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     alignSelf: 'flex-start',
//     backgroundColor: '#fff',
//     paddingHorizontal: 12, paddingVertical: 8,
//     borderRadius: 10,
//   },
//   heroButtonText: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
//   heroImage: {
//     position: 'absolute',
//     right: -8, bottom: -8,
//     width: 130, height: 130,
//     borderRadius: 65,
//   },

//   promoViewport: {
//     marginBottom: 8,
//     marginHorizontal: -20,
//     height: 80,
//     overflow: 'hidden',
//   },
//   promoTrack: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: PROMO_GAP,
//     paddingLeft: 20,
//     width: PROMO_TRACK_WIDTH,
//   },
//   promoCard: {
//     width: PROMO_CARD_WIDTH,
//     height: 80,
//     borderRadius: 14,
//     padding: 8,
//     justifyContent: 'flex-start',
//     overflow: 'hidden',
//   },
//   promoLabel: { fontSize: 9, fontFamily: fonts.poppins.bold, marginBottom: 2 },
//   promoTitle: { fontSize: 7, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
//   promoSubtitle: { fontSize: 8, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 1 },
//   promoIconCircle: {
//     position: 'absolute', bottom: 8, left: 8,
//     width: 20, height: 20, borderRadius: 10,
//     justifyContent: 'center', alignItems: 'center',
//     zIndex: 2,
//   },
//   promoImage: {
//     position: 'absolute',
//     bottom: -6, right: -6,
//     width: 56, height: 56,
//     borderRadius: 28,
//   },

//   dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
//   dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: foodColors.border },
//   dotActive: { backgroundColor: foodColors.badgeBlue },

//   sectionHeaderRow: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     marginBottom: 14,
//     marginTop: -10,
//   },
//   sectionTitle: { fontSize: 16, fontFamily: fonts.poppins.bold, marginBottom: 5, color: foodColors.textPrimary },
//   seeAll: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: foodColors.badgeBlue },

//   servicesGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: SERVICE_GRID_GAP,
//     marginBottom: 8,
//   },
//   serviceSlot: {
//     width: SERVICE_CARD_WIDTH,
//     alignItems: 'center',
//   },
//   serviceCard: {
//     width: SERVICE_CARD_INNER_WIDTH,
//     height: 104,
//     backgroundColor: '#fff',
//     borderRadius: 14,
//     paddingVertical: 14,
//     paddingHorizontal: 2,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
//   },
//   serviceIconWrap: {
//     width: 26, height: 26, borderRadius: 8,
//     justifyContent: 'center', alignItems: 'center',
//     marginBottom: 6,
//   },
//   serviceTitle: { fontSize: 8, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginBottom: 2, textAlign: 'center' },
//   serviceSubtitle: { fontSize: 9, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 11, textAlign: 'center', paddingRight: 5, paddingLeft: 5 },

//   activityCard: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: foodColors.surface,
//     borderRadius: 16,
//     padding: 14, gap: 12,
//     shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
//   },
//   activityIconWrap: {
//     width: 44, height: 44, borderRadius: 22,
//     backgroundColor: foodColors.primaryLight,
//     justifyContent: 'center', alignItems: 'center',
//   },
//   activityInfo: { flex: 1 },
//   activityTitle: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
//   activitySubtitle: { fontSize: 12, fontFamily: fonts.poppins.medium, color: foodColors.badgeBlue, marginTop: 1 },
//   activityDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
//   activityDate: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
//   activityRight: { alignItems: 'flex-end', gap: 8 },
//   statusPill: {
//     backgroundColor: 'rgba(46,90,172,0.1)',
//     paddingHorizontal: 10, paddingVertical: 4,
//     borderRadius: 10,
//   },
//   statusPillText: { fontSize: 11, fontFamily: fonts.poppins.semiBold, color: foodColors.badgeBlue },

//   bottomSpacer: { height: 20 },
// });

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';
import { useProfile } from '../../src/context/ProfileContext';
import { useOrders } from '../../src/hooks/useOrders';
import { useAuth } from '../../src/context/AuthContext';
import { quickServices, QuickService } from '../../src/constants/quickServices';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_ANDROID = Platform.OS === 'android';
const CARD_WIDTH = SCREEN_WIDTH - 40;
const PROMO_GAP = 5;
const PROMO_VISIBLE = 2.95;
const PROMO_ROW_WIDTH = SCREEN_WIDTH - 20;
const PROMO_CARD_WIDTH = (PROMO_ROW_WIDTH - PROMO_GAP * (Math.ceil(PROMO_VISIBLE) - 1)) / PROMO_VISIBLE;
const PROMO_STEP = PROMO_CARD_WIDTH + PROMO_GAP;
const SERVICE_GRID_GAP = IS_ANDROID ? 6 : 12;
const SERVICE_COLUMNS = 4;
const SERVICE_CARD_WIDTH =
  (CARD_WIDTH - SERVICE_GRID_GAP * (SERVICE_COLUMNS - 1)) / SERVICE_COLUMNS;
const SERVICE_CARD_INNER_WIDTH = IS_ANDROID ? SERVICE_CARD_WIDTH : SERVICE_CARD_WIDTH * 0.92;

// How long each card rests, and how long the slide to the next card takes.
const AUTO_SLIDE_MS = 2200;
const SLIDE_DURATION_MS = 700;

const BADGE_BLUE_DARK = '#1E3F82';

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
const PROMO_TRACK_WIDTH = 20 + LOOPED_CARDS.length * PROMO_STEP;

function firstName(fullName: string) {
  if (!fullName.trim()) return '';
  return fullName.trim().split(' ')[0];
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { displayName } = useAuth();
  const [activeDot, setActiveDot] = useState(0);
  const { orders } = useOrders();
  const latestOrder = orders[0] ?? null;

  // The promo track is moved with a native-driven translateX, so the slide
  // runs on the UI thread and stays smooth even while the JS thread is busy.
  const translateX = useRef(new Animated.Value(0)).current;
  const currentIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const slideToNext = () => {
      const next = currentIndexRef.current + 1;
      setActiveDot(next % promoCards.length);

      Animated.timing(translateX, {
        toValue: -next * PROMO_STEP,
        duration: SLIDE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;

        // After the last card of the first set, the second set looks identical,
        // so jump back to the start without the user seeing anything change.
        currentIndexRef.current = next % promoCards.length;
        if (next >= promoCards.length) {
          translateX.setValue(-currentIndexRef.current * PROMO_STEP);
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
  }, [translateX]);

  // Profile name first; fall back to the name saved at sign-up so it never shows blank.
  const greetingName = firstName(profile?.fullName ?? '') || firstName(displayName) || 'there';

  const handleServicePress = (service: QuickService) => {
    if (service.route) {
      router.push(service.route as any);
    } else {
      router.push('/support' as any);
    }
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
            <Text
              style={styles.greeting}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              allowFontScaling={false}
            >
              Welcome, {greetingName} 👋
            </Text>
            <Text style={styles.subGreeting} numberOfLines={1} allowFontScaling={false}>
              What would you like to do today?
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push('/notification')}
            >
              <Feather name="bell" size={IS_ANDROID ? 16 : 18} color={foodColors.textPrimary} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.referButton}
              onPress={() => router.push('/refer-earn' as any)}
            >
              <Feather name="gift" size={IS_ANDROID ? 13 : 15} color="#fff" />
              <Text style={styles.referText} allowFontScaling={false}>Refer</Text>
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
            <Feather name="arrow-right" size={13} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400' }}
            style={styles.heroImage}
          />
        </LinearGradient>

        {/* Promo carousel (auto-sliding, seamless loop) */}
        <View style={styles.promoViewport}>
          <Animated.View
            style={[styles.promoTrack, { transform: [{ translateX }] }]}
          >
            {LOOPED_CARDS.map((card, i) => (
              <View
                key={`${card.id}-${i}`}
                style={[styles.promoCard, { backgroundColor: card.bg }]}
              >
                <Text style={[styles.promoLabel, { color: card.iconBg }]} numberOfLines={1}>
                  {card.label}
                </Text>
                <Text style={styles.promoTitle} numberOfLines={1}>{card.title}</Text>
                <Text style={styles.promoSubtitle} numberOfLines={1}>{card.subtitle}</Text>
                <View style={[styles.promoIconCircle, { backgroundColor: card.iconBg }]}>
                  <Feather name="arrow-right" size={12} color="#fff" />
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
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <TouchableOpacity onPress={() => router.push('/services' as any)}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {quickServices.map((service) => (
            <View key={service.id} style={styles.serviceSlot}>
              <TouchableOpacity
                style={styles.serviceCard}
                activeOpacity={0.8}
                onPress={() => handleServicePress(service)}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: service.bgColor }]}>
                  <Feather name={service.icon} size={16} color="#fff" />
                </View>
                <Text style={styles.serviceTitle} numberOfLines={1} allowFontScaling={false}>
                  {service.title}
                </Text>
                <Text style={styles.serviceSubtitle} numberOfLines={3} allowFontScaling={false}>
                  {service.subtitle}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {latestOrder && (
          <>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            <TouchableOpacity
              style={styles.activityCard}
              activeOpacity={0.8}
              onPress={() => router.push('/recent-activity')}
            >
              <View style={styles.activityIconWrap}>
                {latestOrder.type === 'echop' ? (
                  <Feather name="coffee" size={20} color={foodColors.primary} />
                ) : (
                  <MaterialCommunityIcons name="washing-machine" size={20} color={foodColors.badgeBlue} />
                )}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{latestOrder.title}</Text>
                {!!latestOrder.meta && (
                  <Text style={styles.activitySubtitle}>{latestOrder.meta}</Text>
                )}
                <View style={styles.activityDateRow}>
                  <Feather name="calendar" size={12} color={foodColors.textMuted} />
                  <Text style={styles.activityDate}>{latestOrder.date}</Text>
                </View>
              </View>
              <View style={styles.activityRight}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {latestOrder.status === 'Delivered' ? 'Completed' : latestOrder.status}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={foodColors.textMuted} />
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
  container: { flex: 1, backgroundColor: foodColors.background, marginTop: 16 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 46, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingBlock: { flex: 1, marginRight: IS_ANDROID ? 8 : 0 },
  greeting: { fontSize: IS_ANDROID ? 12.5 : 14.4, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  subGreeting: { fontSize: IS_ANDROID ? 9 : 9.9, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: IS_ANDROID ? 8 : 10 },
  bellButton: {
    width: IS_ANDROID ? 34 : 40, height: IS_ANDROID ? 34 : 40, borderRadius: IS_ANDROID ? 10 : 12,
    backgroundColor: foodColors.surface,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  bellDot: {
    position: 'absolute', top: IS_ANDROID ? 6 : 8, right: IS_ANDROID ? 7 : 9,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: foodColors.primary,
    borderWidth: 1.5, borderColor: foodColors.surface,
  },
  referButton: {
    flexDirection: 'row', alignItems: 'center', gap: IS_ANDROID ? 5 : 6,
    backgroundColor: foodColors.badgeBlue,
    paddingHorizontal: IS_ANDROID ? 11 : 14, paddingVertical: IS_ANDROID ? 8 : 11,
    borderRadius: IS_ANDROID ? 10 : 12,
  },
  referText: { fontSize: IS_ANDROID ? 11 : 13, fontFamily: fonts.poppins.bold, color: '#fff' },

  heroCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 128,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: foodColors.primary,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroTagText: { fontSize: 9, fontFamily: fonts.poppins.bold, color: '#fff' },
  heroTitle: {
    fontSize: 19,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    lineHeight: 23,
    marginBottom: 4,
    maxWidth: '68%',
  },
  heroSubtitle: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.8)',
    maxWidth: '60%',
    marginBottom: 12,
  },
  heroButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  heroButtonText: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  heroImage: {
    position: 'absolute',
    right: -8, bottom: -8,
    width: 130, height: 130,
    borderRadius: 65,
  },

  promoViewport: {
    marginBottom: 8,
    marginHorizontal: -20,
    height: 80,
    overflow: 'hidden',
  },
  promoTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: PROMO_GAP,
    paddingLeft: 20,
    width: PROMO_TRACK_WIDTH,
  },
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
    marginTop: -10,
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.poppins.bold, marginBottom: 5, color: foodColors.textPrimary },
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
    height: IS_ANDROID ? 112 : 104,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
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
  serviceSubtitle: {
    fontSize: IS_ANDROID ? 8 : 9,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: IS_ANDROID ? 10 : 11,
    textAlign: 'center',
    paddingHorizontal: IS_ANDROID ? 3 : 5,
  },

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