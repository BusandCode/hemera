// Store order details (Our Products): status, tracking with the time of each step, items, address.
// Opened from My Orders / Order History (Store orders).
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';
import { supabase } from '../src/lib/supabase';
import { useLiveRefresh } from '../src/hooks/useLiveRefresh';
import { naira } from '../src/lib/shopCart';

type ShopOrder = {
  id: string;
  ref: string;
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: { id: string; name: string; price_kobo: number; qty: number; image_url: string | null }[];
  item_count: number;
  total_kobo: number;
  address: string;
  status_note: string | null;
  refunded_kobo: number;
  created_at: string;
  processing_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
};

/** "1 Nov 2026, 3:42 PM" */
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

/** The steps of an order with the time each one happened (null = not yet). */
function steps(o: ShopOrder) {
  if (o.status === 'cancelled') {
    return [
      { label: 'Order placed & paid', at: o.created_at as string | null },
      { label: 'Cancelled', at: o.cancelled_at ?? null, bad: true },
    ];
  }
  return [
    { label: 'Order placed & paid', at: o.created_at as string | null },
    { label: 'Preparing', at: o.processing_at ?? null },
    { label: 'On the way', at: o.shipped_at ?? null },
    { label: 'Delivered', at: o.delivered_at ?? null },
  ];
}

const STATUS: Record<ShopOrder['status'], { label: string; color: string; bg: string; icon: any }> = {
  paid: { label: 'Paid', color: '#255DDE', bg: 'rgba(37,93,222,0.10)', icon: 'check' },
  processing: { label: 'Preparing', color: '#B45309', bg: 'rgba(245,158,11,0.14)', icon: 'clock' },
  shipped: { label: 'On the way', color: '#7A3FF2', bg: 'rgba(122,63,242,0.10)', icon: 'truck' },
  delivered: { label: 'Delivered', color: foodColors.forestGreen, bg: 'rgba(31,107,79,0.12)', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: foodColors.primary, bg: 'rgba(226,58,46,0.10)', icon: 'x-circle' },
};

export default function StoreOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [o, setO] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    const { data } = await supabase.from('shop_orders').select('*').eq('id', id).maybeSingle();
    setO(data ? ({ ...(data as any), total_kobo: Number((data as any).total_kobo), refunded_kobo: Number((data as any).refunded_kobo ?? 0) }) : null);
    setLoading(false);
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useLiveRefresh(load, ['shop_orders']);

  const st = o ? STATUS[o.status] ?? STATUS.paid : null;
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Order</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={foodColors.badgeBlue} style={{ marginTop: ms(40) }} />
      ) : !o || !st ? (
        <View style={styles.empty}>
          <Feather name="package" size={ms(30)} color={foodColors.textMuted} />
          <Text style={styles.emptyTitle}>Order not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: insets.bottom + ms(24) }}>
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ref}>#{o.ref}</Text>
                <Text style={styles.meta}>Store · {when(o.created_at)}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: st.bg }]}>
                <Feather name={st.icon} size={ms(11)} color={st.color} />
                <Text style={[styles.pillText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>

            <View style={styles.details}>
              <Text style={[styles.detailLabel, { marginTop: 0, marginBottom: ms(6) }]}>Tracking</Text>
              {steps(o).map((s, i, arr) => {
                const done = !!s.at;
                const color = (s as any).bad ? foodColors.primary : done ? foodColors.badgeBlue : foodColors.textMuted;
                return (
                  <View key={s.label} style={styles.stepRow}>
                    <View style={styles.stepRail}>
                      <View style={[styles.stepDot, { backgroundColor: done ? color : 'transparent', borderColor: color }]} />
                      {i < arr.length - 1 && <View style={[styles.stepLine, { backgroundColor: arr[i + 1].at ? foodColors.badgeBlue : foodColors.border }]} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: ms(10) }}>
                      <Text style={[styles.stepLabel, !done && { color: foodColors.textMuted }]}>{s.label}</Text>
                      <Text style={styles.stepTime}>{s.at ? when(s.at) : 'Not yet'}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.details}>
              <Text style={[styles.detailLabel, { marginTop: 0, marginBottom: ms(8) }]}>Items</Text>
              {o.items.map((i) => (
                <View key={i.id} style={styles.itemRow}>
                  {i.image_url ? <Image source={{ uri: i.image_url }} style={styles.thumb} /> : <View style={styles.thumb} />}
                  <Text style={styles.itemName} numberOfLines={2}>{i.qty}× {i.name}</Text>
                  <Text style={styles.itemPrice}>{naira(i.price_kobo * i.qty)}</Text>
                </View>
              ))}
              <View style={styles.cardFoot}>
                <Text style={styles.detailLabel}>Total (paid by transfer)</Text>
                <Text style={styles.total}>{naira(o.total_kobo)}</Text>
              </View>
            </View>

            <View style={styles.details}>
              <Text style={[styles.detailLabel, { marginTop: 0 }]}>Delivery address</Text>
              <Text style={styles.detailText}>{o.address}</Text>
              {o.status === 'cancelled' && (
                <Text style={[styles.detailText, { color: foodColors.primary, marginTop: ms(8) }]}>
                  {o.status_note ? `Reason: ${o.status_note}. ` : ''}
                  {o.refunded_kobo > 0 ? `${naira(o.refunded_kobo)} was refunded to your wallet.` : ''}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: ms(10), paddingHorizontal: ms(16), paddingBottom: ms(10) },
  iconBtn: { width: ms(38), height: ms(38), borderRadius: ms(19), backgroundColor: foodColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: foodColors.border },
  headerTitle: { flex: 1, fontSize: ms(17), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  card: { backgroundColor: foodColors.surface, borderRadius: ms(16), padding: ms(14), borderWidth: 1, borderColor: foodColors.border, marginBottom: ms(10) },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  ref: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  meta: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  pill: { flexDirection: 'row', alignItems: 'center', gap: ms(4), borderRadius: ms(20), paddingHorizontal: ms(9), paddingVertical: ms(4) },
  pillText: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold },
  items: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(8) },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: ms(8) },
  total: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  details: { borderTopWidth: 1, borderColor: foodColors.border, marginTop: ms(10), paddingTop: ms(10) },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10), marginBottom: ms(8) },
  thumb: { width: ms(34), height: ms(34), borderRadius: ms(8), backgroundColor: '#EFEAE3' },
  itemName: { flex: 1, fontSize: ms(12.5), fontFamily: fonts.poppins.medium, color: foodColors.textPrimary },
  itemPrice: { fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  stepRow: { flexDirection: 'row', gap: ms(10) },
  stepRail: { alignItems: 'center', width: ms(14) },
  stepDot: { width: ms(12), height: ms(12), borderRadius: ms(6), borderWidth: 2, marginTop: ms(3) },
  stepLine: { width: 2, flex: 1, marginTop: ms(2) },
  stepLabel: { fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  stepTime: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  detailLabel: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: foodColors.textMuted, marginTop: ms(6) },
  detailText: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, marginTop: ms(2) },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ms(24), gap: ms(6) },
  emptyTitle: { fontSize: ms(16), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  emptyText: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: ms(10) },
  primary: { backgroundColor: foodColors.badgeBlue, borderRadius: ms(14), paddingVertical: ms(14), paddingHorizontal: ms(20), alignItems: 'center' },
  primaryText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});
