import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

function formatNaira(value: string | number) {
  const n = typeof value === 'string' ? Number(value) : value;
  return `₦${n.toLocaleString()}`;
}

type Spark = {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
};

const SPARKS: Spark[] = [
  { id: 's1', x: 0, y: -62, size: 10, opacity: 0.9 },
  { id: 's2', x: 44, y: -44, size: 7, opacity: 0.7 },
  { id: 's3', x: 62, y: 0, size: 12, opacity: 0.95 },
  { id: 's4', x: 44, y: 44, size: 8, opacity: 0.7 },
  { id: 's5', x: 0, y: 62, size: 10, opacity: 0.9 },
  { id: 's6', x: -44, y: 44, size: 7, opacity: 0.7 },
  { id: 's7', x: -62, y: 0, size: 12, opacity: 0.95 },
  { id: 's8', x: -44, y: -44, size: 8, opacity: 0.7 },
  { id: 's9', x: 22, y: -58, size: 5, opacity: 0.6 },
  { id: 's10', x: 58, y: -22, size: 5, opacity: 0.6 },
  { id: 's11', x: 58, y: 22, size: 5, opacity: 0.6 },
  { id: 's12', x: 22, y: 58, size: 5, opacity: 0.6 },
  { id: 's13', x: -22, y: 58, size: 5, opacity: 0.6 },
  { id: 's14', x: -58, y: 22, size: 5, opacity: 0.6 },
  { id: 's15', x: -58, y: -22, size: 5, opacity: 0.6 },
  { id: 's16', x: -22, y: -58, size: 5, opacity: 0.6 },
];

function Sparkle({ spark, anim }: { spark: Spark; anim: Animated.Value }) {
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spark.opacity],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.2, 1.15, 1],
  });

  return (
    <Animated.View
      style={[
        styles.sparkleWrap,
        {
          transform: [{ translateX: spark.x }, { translateY: spark.y }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Feather name="star" size={spark.size} color={foodColors.primary} />
    </Animated.View>
  );
}

export default function OrderSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    orderId?: string;
    total?: string;
    items?: string;
    slot?: string;
  }>();

  const orderId = params.orderId ?? '#000000';
  const total = params.total ?? '0';
  const items = params.items ?? '0';
  const slot = params.slot ?? 'As soon as possible';

  // Entrance + ambient animation values
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(16)).current;
  const sparkleAnims = useRef(SPARKS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Slow ambient rotation of the sparkle ring, runs the whole time
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(checkRotate, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.stagger(
          45,
          sparkleAnims.map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              friction: 6,
              tension: 80,
              useNativeDriver: true,
            })
          )
        ),
      ]),
    ]).start(() => {
      // One-shot ripple once the check has popped in
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Gentle breathing glow, loops for as long as the screen is open
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowPulse, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    Animated.timing(contentFade, {
      toValue: 1,
      duration: 420,
      delay: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    Animated.timing(contentSlide, {
      toValue: 0,
      duration: 420,
      delay: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkRotateDeg = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-14deg', '0deg'],
  });
  const ringRotateDeg = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const rippleScaleOut = rippleScale.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });
  const glowOuterScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const glowInnerScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style="dark" />

      <View style={styles.body}>
        <View style={styles.circleStage}>
          <Animated.View style={[styles.glowOuter, { transform: [{ scale: glowOuterScale }] }]} />
          <Animated.View style={[styles.glowInner, { transform: [{ scale: glowInnerScale }] }]} />

          <Animated.View style={[styles.sparkleRing, { transform: [{ rotate: ringRotateDeg }] }]}>
            {SPARKS.map((s, i) => (
              <Sparkle key={s.id} spark={s} anim={sparkleAnims[i]} />
            ))}
          </Animated.View>

          <Animated.View
            style={[
              styles.rippleRing,
              { transform: [{ scale: rippleScaleOut }], opacity: rippleOpacity },
            ]}
            pointerEvents="none"
          />

          <Animated.View
            style={[
              styles.checkCircle,
              { transform: [{ scale: checkScale }, { rotate: checkRotateDeg }] },
            ]}
          >
            <Feather name="check" size={44} color="#fff" />
          </Animated.View>
        </View>

        <Animated.View
          style={{ opacity: contentFade, transform: [{ translateY: contentSlide }], width: '100%', alignItems: 'center' }}
        >
          <Text style={styles.title}>Order placed!</Text>
          <Text style={styles.subtitle}>
            Your order is confirmed and being prepared. We'll let you know when the rider is on the way.
          </Text>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Order ID</Text>
              <Text style={styles.cardValue}>{orderId}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Items</Text>
              <Text style={styles.cardValue}>{items}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Delivery</Text>
              <Text style={styles.cardValue}>{slot}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.totalLabel}>Total paid</Text>
              <Text style={styles.totalValue}>{formatNaira(total)}</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.actions, { opacity: contentFade }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => router.replace('/my-orders' as any)}
        >
          <Feather name="package" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Track Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background, paddingHorizontal: 24 },

  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  circleStage: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  glowOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(226,58,46,0.08)',
  },
  glowInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(226,58,46,0.15)',
  },

  sparkleRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleWrap: {
    position: 'absolute',
  },

  rippleRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: foodColors.primary,
  },

  checkCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: foodColors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  title: {
    fontSize: 24,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 8,
    marginTop: 18,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 320,
  },

  card: {
    width: '100%',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cardLabel: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  cardValue: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: foodColors.border,
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },

  actions: { gap: 10 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
  },
  primaryBtnText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: foodColors.border,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
});