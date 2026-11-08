// Small "Rate your experience" prompt for the customer's most recent delivered E-Chop / E-Wash order
// that hasn't been reviewed yet (last 7 days). Tapping it opens the order, where the review form is.
// "Not now" hides it for that order.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { orderDetailsRoute, useOrders } from '../../hooks/useOrders';
import { useMyReviews } from '../../hooks/useMyReviews';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

const DISMISSED_KEY = 'reviews:prompt-dismissed';
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function RatePrompt({ style }: { style?: object }) {
  const router = useRouter();
  const { orders } = useOrders(undefined, 'finished');
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((v) => setDismissed(v ? JSON.parse(v) : []))
      .catch(() => setDismissed([]));
  }, []);

  const recent = useMemo(
    () => orders.filter((o) =>
      (o.type === 'echop' || o.type === 'ewash') && o.status === 'Delivered' &&
      (!o.createdAt || Date.now() - new Date(o.createdAt).getTime() < WINDOW_MS)),
    [orders],
  );
  const { reviews, loaded } = useMyReviews(recent.map((o) => o.id));
  const target = loaded && dismissed ? recent.find((o) => !reviews.has(o.id) && !dismissed.includes(o.id)) : undefined;

  const dismiss = useCallback(() => {
    if (!target) return;
    const next = [...(dismissed ?? []), target.id].slice(-50);
    setDismissed(next);
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(next)).catch(() => {});
  }, [target, dismissed]);

  if (!target) return null;
  const partner = target.type === 'ewash' ? 'laundry partner' : 'restaurant';

  return (
    <TouchableOpacity style={[styles.card, style]} activeOpacity={0.85} onPress={() => router.push(orderDetailsRoute(target) as any)}>
      <View style={styles.icon}><Ionicons name="star" size={ms(16)} color="#F5A524" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>How was your order?</Text>
        <Text style={styles.text} numberOfLines={2}>{target.title} was delivered. Tap to rate the {partner}.</Text>
      </View>
      <Text style={styles.cta}>Rate now</Text>
      <TouchableOpacity onPress={dismiss} hitSlop={10} style={styles.close} accessibilityLabel="Not now">
        <Feather name="x" size={ms(14)} color={foodColors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: ms(10), backgroundColor: foodColors.surface, borderRadius: ms(14), padding: ms(12), borderWidth: 1, borderColor: foodColors.border },
  icon: { width: ms(34), height: ms(34), borderRadius: ms(17), backgroundColor: 'rgba(245,165,36,0.14)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  text: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  cta: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },
  close: { paddingLeft: ms(2) },
});
