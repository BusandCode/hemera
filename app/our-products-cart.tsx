// Our Products cart: change quantities, choose where to deliver (default address or somewhere else),
// then pay by bank transfer on the payment screen. The wallet is never used for these orders.
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';
import { useAppData } from '../src/context/AppDataContext';
import { useDialog } from '../src/components/ui/DialogProvider';
import { naira, useShopCart } from '../src/lib/shopCart';
import { supabase } from '../src/lib/supabase';

// Our Products delivery fee (admin: Pricing → Our Products). ₦2,100 until it loads.
const DEFAULT_DELIVERY_KOBO = 210000;

const BLUE = foodColors.badgeBlue;   // Hemera blue for every button

export default function OurProductsCartScreen() {
  const router = useRouter();
  const dialog = useDialog();
  const askRemove = (message: string) => dialog.confirm({
    title: 'Remove item?', message, confirmText: 'Remove', cancelText: 'Cancel', destructive: true, icon: 'trash-2',
  });
  // Minus on the last one / trash: confirm first.
  const lower = async (id: string, qty: number) => {
    if (qty <= 1 && !(await askRemove('Are you sure you want to remove this item from your basket?'))) return;
    cart.setQty(id, qty - 1);
  };
  const insets = useSafeAreaInsets();
  const cart = useShopCart();
  const { addresses } = useAppData();
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  // Two choices: the default address, or somewhere else (typed in).
  const [where, setWhere] = useState<'default' | 'other'>('default');
  const [otherAddress, setOtherAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Delivery fee: set by Hemera, added to the amount to transfer (the database checks it too).
  const [deliveryKobo, setDeliveryKobo] = useState(DEFAULT_DELIVERY_KOBO);
  useEffect(() => {
    let on = true;
    supabase.rpc('hemera_shop_delivery_fee').then(({ data, error }: { data: any; error: any }) => {
      if (on && !error && data !== null && Number.isFinite(Number(data))) setDeliveryKobo(Number(data));
    });
    return () => { on = false; };
  }, []);
  const itemsKobo = cart.totalKobo;
  const total = itemsKobo + deliveryKobo;
  const useDefault = where === 'default' && !!defaultAddress;
  const addressText = useDefault
    ? [defaultAddress!.line, defaultAddress!.details].filter(Boolean).join(', ')
    : otherAddress.trim();
  const canPay = cart.lines.length > 0 && addressText.length >= 5;

  const draft = useMemo(
    () => JSON.stringify({ kind: 'shop', lines: cart.lines.map((l) => ({ id: l.product.id, qty: l.qty })), address: addressText, notes: notes.trim() }),
    [cart.lines, addressText, notes],
  );

  function pay() {
    if (!canPay) return;
    router.push({
      pathname: '/fund-wallet-account',
      params: { amount: String(Math.round(total / 100)), service: 'shop', order: draft },
    } as any);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Products Cart</Text>
        {cart.lines.length > 0 ? (
          <TouchableOpacity onPress={async () => { if (await askRemove('Remove all items from your basket?')) cart.clear(); }} hitSlop={8}><Text style={styles.clear}>Clear</Text></TouchableOpacity>
        ) : <View style={{ width: ms(38) }} />}
      </View>

      {cart.lines.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="shopping-cart" size={ms(30)} color={foodColors.textMuted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add Hemera products to see them here.</Text>
          <TouchableOpacity style={styles.primary} onPress={() => router.replace('/our-products' as any)}>
            <Text style={styles.primaryText}>Browse Our Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(180) + insets.bottom }} keyboardShouldPersistTaps="handled">
            {cart.lines.map(({ product: p, qty }) => {
              const atMax = p.stock_qty !== null && qty >= p.stock_qty;
              return (
                <View key={p.id} style={styles.line}>
                  {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.thumb} /> : (
                    <View style={[styles.thumb, styles.thumbEmpty]}><Feather name="shopping-bag" size={ms(18)} color={foodColors.textMuted} /></View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineName} numberOfLines={2}>{p.name}</Text>
                    <Text style={styles.linePrice}>{naira(p.price_kobo)}</Text>
                  </View>
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => lower(p.id, qty)} hitSlop={6}>
                      <Feather name={qty === 1 ? 'trash-2' : 'minus'} size={ms(13)} color={BLUE} />
                    </TouchableOpacity>
                    <Text style={styles.stepQty}>{qty}</Text>
                    <TouchableOpacity style={[styles.stepBtn, atMax && { opacity: 0.35 }]} disabled={atMax} onPress={() => cart.add(p)} hitSlop={6}>
                      <Feather name="plus" size={ms(13)} color={BLUE} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <Text style={styles.section}>Deliver to</Text>
            <TouchableOpacity
              style={[styles.addrCard, where === 'default' && styles.addrOn]}
              onPress={() => (defaultAddress ? setWhere('default') : router.push('/add-address' as any))}
              activeOpacity={0.85}
            >
              <Feather name={where === 'default' && defaultAddress ? 'check-circle' : 'circle'} size={ms(18)} color={where === 'default' && defaultAddress ? BLUE : foodColors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addrLabel}>My default address</Text>
                <Text style={styles.addrLine} numberOfLines={2}>
                  {defaultAddress ? [defaultAddress.line, defaultAddress.details].filter(Boolean).join(', ') : 'No saved address yet. Tap to add one.'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addrCard, where === 'other' && styles.addrOn]} onPress={() => setWhere('other')} activeOpacity={0.85}>
              <Feather name={where === 'other' ? 'check-circle' : 'circle'} size={ms(18)} color={where === 'other' ? BLUE : foodColors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addrLabel}>Somewhere else</Text>
                <Text style={styles.addrLine}>Type the address where it should go</Text>
              </View>
            </TouchableOpacity>
            {where === 'other' && (
              <TextInput
                style={styles.notes}
                value={otherAddress}
                onChangeText={setOtherAddress}
                placeholder="Full delivery address (street, area, city)"
                placeholderTextColor={foodColors.textMuted}
                maxLength={250}
                multiline
                autoFocus
              />
            )}

            <Text style={styles.section}>Note (optional)</Text>
            <TextInput
              style={styles.notes}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Call me when you arrive"
              placeholderTextColor={foodColors.textMuted}
              maxLength={200}
              multiline
            />
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + ms(12) }]}>
            <Row label={`Items (${cart.itemCount})`} value={naira(itemsKobo)} />
            <Row label="Delivery" value={deliveryKobo > 0 ? naira(deliveryKobo) : 'Free'} />
            <Row label="Total" value={naira(total)} bold />
            <Text style={styles.walletNote}>You'll pay by bank transfer on the next screen.</Text>
            <TouchableOpacity style={[styles.primary, !canPay && { opacity: 0.5 }]} disabled={!canPay} onPress={pay} activeOpacity={0.9}>
              <Text style={styles.primaryText}>
                {addressText.length < 5 ? (where === 'other' ? 'Type the delivery address' : 'Add a delivery address') : `Pay ${naira(total)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: ms(10), paddingHorizontal: ms(16), paddingBottom: ms(10) },
  iconBtn: { width: ms(38), height: ms(38), borderRadius: ms(19), backgroundColor: foodColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: foodColors.border },
  headerTitle: { flex: 1, fontSize: ms(17), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  clear: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },
  line: { flexDirection: 'row', alignItems: 'center', gap: ms(12), backgroundColor: foodColors.surface, borderRadius: ms(14), padding: ms(10), borderWidth: 1, borderColor: foodColors.border, marginBottom: ms(10) },
  thumb: { width: ms(56), height: ms(56), borderRadius: ms(10), backgroundColor: '#EFEAE3' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  lineName: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  linePrice: { fontSize: ms(12.5), fontFamily: fonts.poppins.bold, color: BLUE, marginTop: ms(2) },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: foodColors.border, borderRadius: ms(16), height: ms(32), paddingHorizontal: ms(4) },
  stepBtn: { width: ms(24), height: ms(24), alignItems: 'center', justifyContent: 'center' },
  stepQty: { minWidth: ms(20), textAlign: 'center', fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  section: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: ms(14), marginBottom: ms(8) },
  addrCard: { flexDirection: 'row', alignItems: 'center', gap: ms(10), backgroundColor: foodColors.surface, borderRadius: ms(14), padding: ms(12), borderWidth: 1, borderColor: foodColors.border, marginBottom: ms(8) },
  addrOn: { borderColor: BLUE },
  addrLabel: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  addrLine: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  notes: { backgroundColor: foodColors.surface, borderRadius: ms(14), borderWidth: 1, borderColor: foodColors.border, padding: ms(12), minHeight: ms(60), fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, textAlignVertical: 'top' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: foodColors.surface, borderTopLeftRadius: ms(20), borderTopRightRadius: ms(20), paddingHorizontal: ms(16), paddingTop: ms(14), borderTopWidth: 1, borderColor: foodColors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ms(6) },
  rowLabel: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  rowValue: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  rowBold: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  walletNote: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: ms(10) },
  primary: { backgroundColor: BLUE, borderRadius: ms(14), paddingVertical: ms(15), alignItems: 'center', marginTop: ms(4), paddingHorizontal: ms(18) },
  primaryText: { fontSize: ms(14.5), fontFamily: fonts.poppins.bold, color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ms(24), gap: ms(6) },
  emptyTitle: { fontSize: ms(16), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  emptyText: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: ms(10) },
});
