// Tap feedback when moving to another screen: a small "Loading…" pill appears at the top the
// moment something is tapped, and goes away as soon as the new screen is shown.
// It works for every router.push / replace / navigate in the app, so no screen needs changing.
import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../constants/foodColors';
import { fonts } from '../constants/typography';

type Listener = () => void;
const listeners = new Set<Listener>();
let installed = false;

/** Wraps the router once: show the pill, let it draw, then navigate on the next frame. */
function install() {
  if (installed) return;
  installed = true;
  const r = router as any;
  for (const method of ['push', 'replace', 'navigate', 'dismissTo'] as const) {
    const original = r[method];
    if (typeof original !== 'function') continue;
    r[method] = (...args: unknown[]) => {
      listeners.forEach((l) => l());
      requestAnimationFrame(() => original.apply(r, args));
    };
  }
}
install();

const MAX_MS = 2500;

export function NavLoading() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = () => {
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), MAX_MS);   // never stays stuck
    };
    listeners.add(show);
    return () => {
      listeners.delete(show);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // The new screen is shown → hide.
  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.pill}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.text}>Loading…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', zIndex: 999, elevation: 999 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: foodColors.textPrimary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, opacity: 0.92,
  },
  text: { color: '#fff', fontSize: 12.5, fontFamily: fonts.poppins.semiBold },
});
