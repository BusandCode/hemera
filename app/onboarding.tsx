// app/onboarding.tsx
import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
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
import { useOnboarding } from '../src/context/OnboardingContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'food',
    tag: 'E-CHOP',
    title: 'Great meals,\ndelivered fast.',
    body: 'Order from nearby kitchens and trusted bukas. Hot, fresh, and at your door in minutes.',
    icon: 'coffee' as const,
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
    accent: foodColors.primary,
  },
  {
    id: 'laundry',
    tag: 'E-WASH',
    title: 'Laundry picked up,\ndropped back clean.',
    body: 'Schedule a pickup, we handle wash and dry, and return everything folded — all on-demand.',
    icon: 'droplet' as const,
    image: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=800&q=80',
    accent: '#0B2472',
  },
  {
    id: 'refer',
    tag: 'REFER & EARN',
    title: 'Invite friends,\nearn real rewards.',
    body: 'Share your code and get ₦1,000 credit whenever a friend completes their first order.',
    icon: 'gift' as const,
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&q=80',
    accent: foodColors.forestGreen,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) setIndex(next);
  };

  const goNext = async () => {
    if (isLast) {
      await finish();
      return;
    }
    scrollRef.current?.scrollTo({
      x: SCREEN_WIDTH * (index + 1),
      animated: true,
    });
  };

  const finish = async () => {
    await completeOnboarding();
    router.replace('/auth' as any);
  };

  const skip = async () => {
    await completeOnboarding();
    router.replace('/auth' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: insets.top + 12 }]}
          onPress={skip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.slidesWrap}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.imageWrap}>
              <Image source={{ uri: slide.image }} style={styles.image} />
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.7)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.textBlock}>
              <View style={[styles.tagPill, { backgroundColor: slide.accent }]}>
                <Feather name={slide.icon} size={11} color="#fff" />
                <Text style={styles.tagText}>{slide.tag}</Text>
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideBody}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Feather name={isLast ? 'check' : 'arrow-right'} size={16} color="#fff" />
        </TouchableOpacity>

        {!isLast && <Text style={styles.hint}>Swipe to continue</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020' },

  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  skipText: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },

  slidesWrap: { flex: 1 },
  slide: { flex: 1 },
  imageWrap: { ...StyleSheet.absoluteFill },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },

  textBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 190,
  },
  tagPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 10,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 1,
    color: '#fff',
  },
  slideTitle: {
    fontSize: 30,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    lineHeight: 38,
    marginBottom: 12,
  },
  slideBody: {
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.82)',
    maxWidth: '92%',
  },

  bottom: {
    paddingHorizontal: 28,
    paddingTop: 20,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: { width: 22, backgroundColor: '#fff' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
});