import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';

export default function ConfirmPickupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Retrieve schedule info passed from the previous screen
  const pickupTime = params.pickupTime as string || 'Evening · 4 PM – 8 PM';
  const pickupSlotId = params.pickupSlotId as string || 'evening';
  const pickupAddress = params.pickupAddress as string || 'Life camp Abuja';

  // Mock data for the order breakdown. In a real app, this would come from your cart state or params.
  const orderItems = [
    { name: "Men's Shirt", qty: 3, price: 2100 },
    { name: "Men's Trousers", qty: 2, price: 1600 },
    { name: "Men's Native", qty: 1, price: 1200 },
    { name: "Men's T-shirt", qty: 1, price: 500 },
  ];

  const subtotal = orderItems.reduce((acc, item) => acc + item.price, 0);
  const deliveryFee = 2500;
  const total = subtotal + deliveryFee;

  const handlePay = () => {
    // Handle payment logic here
    console.log('Processing payment...');
    // router.push('/success');
  };

  // Helper to render the correct icon based on the slot
  const renderSlotIcon = () => {
    if (pickupSlotId === 'evening') {
      return <MaterialCommunityIcons name="weather-night" size={18} color={washColors.textPrimary} />;
    }
    return <Feather name="sun" size={18} color={washColors.textPrimary} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule pickup</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Selected Time Slot */}
        <View style={styles.selectedSlotCard}>
          {renderSlotIcon()}
          <Text style={styles.selectedSlotText}>{pickupTime}</Text>
          <View style={styles.radioCircleActive}>
            <View style={styles.radioInner} />
          </View>
        </View>

        {/* Pickup Address */}
        <View style={styles.addressHeader}>
          <Text style={styles.sectionTitle}>Pickup address</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addressCard}>
          <Feather name="map-pin" size={18} color={washColors.navySolid} />
          <Text style={styles.addressText}>
            {pickupAddress}
          </Text>
        </View>

        {/* Payment Breakdown */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment</Text>
        <View style={styles.paymentCard}>
          
          {orderItems.map((item, index) => (
            <View key={index} style={styles.paymentRow}>
              <Text style={styles.itemName}>{item.name} <Text style={styles.itemQty}>× {item.qty}</Text></Text>
              <Text style={styles.itemPrice}>₦{item.price.toLocaleString('en-US')}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₦{subtotal.toLocaleString('en-US')}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString('en-US')}</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.paymentRow, { marginTop: 4 }]}>
            <Text style={styles.totalLabel}>TOTAL TO PAY</Text>
            <Text style={styles.totalValue}>₦{total.toLocaleString('en-US')}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.payButton} onPress={handlePay} activeOpacity={0.85}>
          <Text style={styles.payButtonText}>Pay & confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16 },
  backBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary, marginBottom: 12 },

  // Selected Slot Display
  selectedSlotCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: washColors.surface, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: washColors.navySolid,
    marginBottom: 24 
  },
  selectedSlotText: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary },
  radioCircleActive: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: washColors.navySolid, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: washColors.navySolid },

  // Address
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editText: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: washColors.navySolid },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: washColors.surface, padding: 16, borderRadius: 16 },
  addressText: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },

  // Payment Card
  paymentCard: { backgroundColor: washColors.surface, borderRadius: 20, padding: 20 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  itemQty: { color: washColors.textMuted },
  itemPrice: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: washColors.navySolid },
  divider: { height: 1, backgroundColor: washColors.grayBorder, marginVertical: 12 },
  summaryLabel: { fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  summaryValue: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary },
  totalLabel: { fontSize: 14, fontFamily: fonts.poppins.bold, color: washColors.navySolid },
  totalValue: { fontSize: 18, fontFamily: fonts.poppins.bold, color: washColors.navySolid },

  bottomSpacer: { height: 40 },
  footer: { backgroundColor: washColors.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  payButton: { backgroundColor: washColors.navySolid, paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  payButtonText: { fontSize: 16, fontFamily: fonts.poppins.bold, color: '#fff' },
});