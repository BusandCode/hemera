import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD = 20;
const WEBSITE = 'https://www.gethemera.app/partner';

// Pick a font size per platform: fs(iosSize, androidSize).
const IS_ANDROID = Platform.OS === 'android';
const fs = (ios: number, android: number) => (IS_ANDROID ? android : ios);

// Hero ad slider: one full-width banner at a time, auto-advancing.
const AD_W = SCREEN_WIDTH - PAD * 2;
const AD_H = 170;
const AD_INTERVAL = 3500;

type Ad = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: keyof typeof Feather.glyphMap;
  colors: [string, string];
  image: string;
};

const ADS: Ad[] = [
  {
    id: 'laundry', eyebrow: 'LAUNDRY PARTNER', icon: 'droplet',
    title: 'Own a laundry?\nGet more orders',
    body: 'Customers near you are booking pickups every day.',
    colors: [foodColors.badgeBlue, '#1E3A8A'],
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400',
  },
  {
    id: 'food', eyebrow: 'FOOD VENDOR', icon: 'coffee',
    title: 'Sell your meals\nto more people',
    body: 'Reach hungry customers across town on E-Chop.',
    colors: [foodColors.primary, '#C2410C'],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  },
  {
    id: 'rider', eyebrow: 'DISPATCH RIDER', icon: 'truck',
    title: 'Ride with Hemera,\nearn every trip',
    body: 'Flexible hours delivering food and laundry.',
    colors: [foodColors.forestGreen, '#14532D'],
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400',
  },
  {
    id: 'restaurant', eyebrow: 'RESTAURANT PARTNER', icon: 'home',
    title: 'Grow your\nrestaurant with us',
    body: 'More orders, zero delivery headaches.',
    colors: ['#1F2937', '#111827'],
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
  },
];
// First ad repeated at the end so the loop wraps seamlessly.
const LOOP_ADS = [...ADS, { ...ADS[0], id: `${ADS[0].id}-clone` }];

const PARTNER_TYPES: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  desc: string;
  color: string;
}[] = [
  { icon: 'droplet', title: 'Laundry Partner',    desc: 'Wash, dry and iron for Hemera customers near you.', color: foodColors.badgeBlue },
  { icon: 'coffee',  title: 'Food Vendor',        desc: 'Sell your meals to hungry customers on E-Chop.',    color: foodColors.primary },
  { icon: 'truck',   title: 'Dispatch Rider',     desc: 'Deliver food and laundry orders and earn per trip.', color: foodColors.forestGreen },
  { icon: 'home',    title: 'Restaurant Partner', desc: 'List your restaurant and reach more customers.',    color: foodColors.primary },
];

const STEPS = [
  { title: 'Download the Hemera Partner App', body: 'Get the Hemera Partner App and sign up with your details.' },
  { title: 'Or register on our website', body: 'Visit www.gethemera.app and go to the Partner section to register.' },
  { title: 'Get verified & start earning', body: 'Our team reviews your application and gets you set up.' },
];

/* ---------------- Auto-sliding partner ads (display only) ---------------- */

function PartnerAdSlider() {
  const ref = useRef<ScrollView>(null);
  const index = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      index.current += 1;
      ref.current?.scrollTo({ x: index.current * AD_W, animated: true });

      // After landing on the clone, snap back to the real first ad.
      if (index.current === ADS.length) {
        setTimeout(() => {
          index.current = 0;
          ref.current?.scrollTo({ x: 0, animated: false });
        }, 450);
      }
    }, AD_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.adWrap}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {LOOP_ADS.map((a) => (
          <LinearGradient
            key={a.id}
            colors={a.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ad}
          >
            <View style={styles.adText}>
              <View style={styles.adEyebrow}>
                <Feather name={a.icon} size={11} color="#fff" />
                <Text style={styles.adEyebrowText}>{a.eyebrow}</Text>
              </View>
              <Text style={styles.adTitle} numberOfLines={2}>{a.title}</Text>
              <Text style={styles.adBody} numberOfLines={2}>{a.body}</Text>
            </View>
            <Image source={{ uri: a.image }} style={styles.adImg} />
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------------- Screen ---------------- */

export default function VendorPartnerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openSite = () => Linking.openURL(WEBSITE).catch(() => {});

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: PAD }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color={foodColors.textPrimary} />
        </TouchableOpacity>

        {/* Partner ads */}
        <PartnerAdSlider />

        {/* Partner types */}
        <Text style={styles.sectionTitle}>Apply to join as a</Text>
        <View style={styles.typeList}>
          {PARTNER_TYPES.map((p) => (
            <View key={p.title} style={styles.typeCard}>
              <View style={[styles.typeIcon, { backgroundColor: p.color }]}>
                <Feather name={p.icon} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeTitle}>{p.title}</Text>
                <Text style={styles.typeDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* How to apply */}
        <Text style={styles.sectionTitle}>How to apply</Text>
        <View style={styles.stepsBox}>
          {STEPS.map((s, i) => (
            <View key={s.title} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepBody}>
                  {i === 1 ? (
                    <>
                      Visit <Text style={styles.link} onPress={openSite}>www.gethemera.app</Text> and go to the
                      Partner section to register.
                    </>
                  ) : (
                    s.body
                  )}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={openSite} activeOpacity={0.85}>
          <Feather name="external-link" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Register on gethemera.app</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: foodColors.surface,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  // Ad slider (header swiper)
  adWrap: { borderRadius: 22, overflow: 'hidden', marginBottom: 24 },
  ad: {
    width: AD_W,
    height: AD_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    overflow: 'hidden',
  },
  adText: { flex: 1, paddingVertical: 16, paddingRight: 8 },
  adEyebrow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 8,
  },
  adEyebrowText: { fontSize: fs(9.5, 8), fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.8 },
  adTitle: {
    fontSize: fs(19, 14), lineHeight: fs(24, 18),
    fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 6,
  },
  adBody: {
    fontSize: fs(12, 10.5), lineHeight: fs(17, 14.5),
    fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.88)',
  },
  adImg: {
    width: AD_H * 0.95,
    height: AD_H * 0.95,
    borderRadius: AD_H,
    marginRight: -AD_H * 0.22,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  sectionTitle: { fontSize: 16, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 12 },

  typeList: { gap: 10, marginBottom: 26 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  typeIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeTitle: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginBottom: 2 },
  typeDesc: { fontSize: 12, lineHeight: 17, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },

  stepsBox: { backgroundColor: foodColors.primaryLight, borderRadius: 18, padding: 16 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center' },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: foodColors.primary, color: '#fff',
    textAlign: 'center', lineHeight: 26,
    fontSize: 12, fontFamily: fonts.poppins.bold, overflow: 'hidden',
  },
  stepLine: { width: 2, flex: 1, backgroundColor: foodColors.primary, opacity: 0.25, marginVertical: 4 },
  stepTextWrap: { flex: 1, paddingBottom: 16 },
  stepTitle: { fontSize: 13.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginBottom: 2 },
  stepBody: { fontSize: 12.5, lineHeight: 18, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  link: { fontFamily: fonts.poppins.semiBold, color: foodColors.primary },

  ctaBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: PAD, paddingTop: 12,
    backgroundColor: foodColors.background,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  primaryBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: foodColors.primary, paddingVertical: 15, borderRadius: 26,
  },
  primaryBtnText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});