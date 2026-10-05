// src/components/SplashScreenView.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export function SplashScreenView() {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.stagger(
        150,
        dotAnims.map((anim) =>
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ])
        )
      )
    );
    loop.start();

    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Text style={styles.logo}>
          Hem<Text style={styles.logoAccent}>era</Text>
        </Text>
      </Animated.View>
      <Text style={styles.tagline}>Food. Laundry. Sorted.</Text>

      <View style={styles.dotsRow}>
        {dotAnims.map((anim, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: serif,
    fontWeight: '700',
    fontSize: 44,
    color: '#fff',
  },
  logoAccent: {
    color: '#E23A2E',
    fontStyle: 'italic',
  },
  tagline: {
    marginTop: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 70,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E23A2E',
  },
});