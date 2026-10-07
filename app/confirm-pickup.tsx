import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';
import { supabase } from '../src/lib/supabase';
import { planErrorMessage } from '../src/lib/planLimits';
import { AppDialog } from '../src/components/AppDialog';

export default function ConfirmPickupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const pickupTime = (params.pickupTime as string) ?? '';
  const pickupDate = (params.pickupDate as string) ?? '';
  const pickupDateId = (params.pickupDateId as string) ?? '';
  const pickupSlotId = (params.pickupSlotId as string) ?? '';
  const pickupAddress = (params.pickupAddress as string) ?? '';
  const express = params.express === '1';
  const covered = params.covered === '1';
  const notes = (params.notes as string) ?? '';
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  let orderItems: { name: string; qty: number; price: number }[] = [];
  try {
    const parsed = JSON.parse((params.items as string) ?? '[]');
    if (Array.isArray(parsed)) orderItems = parsed;
  } catch {}

  const subtotal = covered ? 0 : orderItems.reduce((acc, item) => acc + item.price, 0);
  const deliveryFee = covered ? 0 : 2500;
  const serviceCharge = covered ? 0 : 500;
  const expressFee = express ? 1500 : 0;
  const total = subtotal + deliveryFee + serviceCharge + expressFee;

  const callSchedule = (dryRun: boolean) =>
    supabase.rpc('schedule_plan_pickup', {
      p_items: orderItems.map((i) => ({ id: (i as any).id, name: i.name, qty: i.qty })),
      p_express: express,
      p_pickup_date_id: pickupDateId,
      p_pickup_time: pickupTime,
      p_address: pickupAddress,
      p_notes: notes || null,
      p_dry_run: dryRun,
    });

  const scheduleCoveredPickup = async () => {
    setSubmitting(true);
    const { data, error } = await callSchedule(false);
    setSubmitting(false);

    if (error) {
      Alert.alert('Could not schedule pickup', planErrorMessage(error.message));
      return;
    }

    setSuccessRef(String((data as any)?.ref ?? ''));
  };

  const handlePay = async () => {
    if (submitting || orderItems.length === 0 || !pickupAddress) return;

    if (covered && total === 0) {
      scheduleCoveredPickup();
      return;
    }

    if (covered) {
      setSubmitting(true);
      const { error } = await callSchedule(true);
      setSubmitting(false);
      if (error) {
        Alert.alert('Could not schedule pickup', planErrorMessage(error.message));
        return;
      }
    }

    router.push({
      pathname: '/fund-wallet-account',
      params: {
        amount: String(total),
        service: 'ewash',
        order: JSON.stringify({
          covered,
          notes,
          lines: orderItems,
          express,
          subtotal,
          deliveryFee,
          serviceCharge,
          pickupDate,
          pickupDateId,
          pickupTime,
          pickupAddress,
        }),
      },
    } as any);
  };

  const renderSlotIcon = () => {
    if (pickupSlotId === 'evening') {
      return <MaterialCommunityIcons name="weather-night" size={ms(18)} color={washColors.textPrimary} />;
    }
    return <Feather name="sun" size={ms(18)} color={washColors.textPrimary} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={ms(22)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule pickup</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.selectedSlotCard}>
          {renderSlotIcon()}
          <Text style={styles.selectedSlotText}>{pickupTime}</Text>
          <View style={styles.radioCircleActive}>
            <View style={styles.radioInner} />
          </View>
        </View>

        <View style={styles.addressHeader}>
          <Text style={styles.sectionTitle}>Pickup address</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addressCard}>
          <Feather name="map-pin" size={ms(18)} color={washColors.navySolid} />
          <Text style={styles.addressText}>
            {pickupAddress}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment</Text>
        <View style={styles.paymentCard}>

          {orderItems.map((item, index) => (
            <View key={index} style={styles.paymentRow}>
              <Text style={[styles.itemName, styles.rowLabel]}>{item.name} <Text style={styles.itemQty}>× {item.qty}</Text></Text>
              <Text style={[styles.itemPrice, styles.rowValue]}>
                {covered ? 'Included' : `₦${item.price.toLocaleString('en-US')}`}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          {covered ? (
            <View style={styles.paymentRow}>
              <Text style={[styles.summaryLabel, styles.rowLabel]}>Pickup, delivery &{'\n'}processing</Text>
              <Text style={[styles.summaryValue, styles.rowValue]}>Covered by plan</Text>
            </View>
          ) : (
            <>
              <View style={styles.paymentRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₦{subtotal.toLocaleString('en-US')}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.summaryLabel}>Delivery fee</Text>
                <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString('en-US')}</Text>
              </View>
            </>
          )}
          {express && (
            <View style={styles.paymentRow}>
              <Text style={styles.summaryLabel}>Express delivery</Text>
              <Text style={styles.summaryValue}>₦{expressFee.toLocaleString('en-US')}</Text>
            </View>
          )}
          {!covered && (
            <View style={styles.paymentRow}>
              <Text style={styles.summaryLabel}>Service charge</Text>
              <Text style={styles.summaryValue}>₦{serviceCharge.toLocaleString('en-US')}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={[styles.paymentRow, { marginTop: 4 }]}>
            <Text style={styles.totalLabel}>{covered && total === 0 ? 'COVERED BY PLAN' : 'TOTAL TO PAY'}</Text>
            <Text style={styles.totalValue}>₦{total.toLocaleString('en-US')}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity
          style={[styles.payButton, submitting && { opacity: 0.7 }]}
          onPress={handlePay}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {covered && total === 0 ? 'Confirm pickup' : 'Pay & confirm'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {successRef !== null && (
        <AppDialog
          visible
          tone="success"
          title="Pickup scheduled"
          message={`Order #${successRef} has been confirmed. We'll pick up your laundry at the scheduled time.`}
          primaryLabel="OK"
          onPrimary={() => {
            setSuccessRef(null);
            router.replace('/wash' as any);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: ms(16), paddingHorizontal: ms(20), paddingBottom: ms(16) },
  backBtn: { width: ms(28), height: ms(28), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: ms(22), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(16) },
  sectionTitle: { fontSize: ms(16), fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary, marginBottom: ms(12) },

  selectedSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: washColors.surface,
    padding: ms(16),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: washColors.navySolid,
    marginBottom: ms(24)
  },
  selectedSlotText: { flex: 1, fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary },
  radioCircleActive: { width: ms(22), height: ms(22), borderRadius: ms(11), borderWidth: 1.5, borderColor: washColors.navySolid, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: ms(12), height: ms(12), borderRadius: ms(6), backgroundColor: washColors.navySolid },

  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(12) },
  editText: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: washColors.navySolid },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: ms(12), backgroundColor: washColors.surface, padding: ms(16), borderRadius: ms(16) },
  addressText: { flex: 1, fontSize: ms(14), fontFamily: fonts.poppins.regular, color: washColors.textSecondary },

  paymentCard: { backgroundColor: washColors.surface, borderRadius: ms(20), padding: ms(20) },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(12) },
  rowLabel: { flex: 1, paddingRight: ms(16) },
  rowValue: { flexShrink: 0, textAlign: 'right' },
  itemName: { fontSize: ms(14), fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  itemQty: { color: washColors.textMuted },
  itemPrice: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: washColors.navySolid },
  divider: { height: 1, backgroundColor: washColors.grayBorder, marginVertical: ms(12) },
  summaryLabel: { fontSize: ms(14), fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  summaryValue: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary },
  totalLabel: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: washColors.navySolid },
  totalValue: { fontSize: ms(18), fontFamily: fonts.poppins.bold, color: washColors.navySolid },

  bottomSpacer: { height: ms(40) },
  footer: { backgroundColor: washColors.surface, paddingHorizontal: ms(20), paddingTop: ms(16), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  payButton: { backgroundColor: washColors.navySolid, paddingVertical: ms(16), borderRadius: ms(28), alignItems: 'center' },
  payButtonText: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: '#fff' },
});