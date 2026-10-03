import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';

type TimeSlot = {
  id: string;
  label: string;
  time: string;
  icon: string;
  iconLib: 'feather' | 'mci';
};

const timeSlots: TimeSlot[] = [
  { id: 'morning', label: 'Morning', time: '8 AM – 12 PM', icon: 'sun', iconLib: 'feather' },
  { id: 'afternoon', label: 'Afternoon', time: '12 PM – 4 PM', icon: 'sun', iconLib: 'feather' },
  { id: 'evening', label: 'Evening', time: '4 PM – 8 PM', icon: 'weather-night', iconLib: 'mci' },
];

const generateDates = (numDays: number) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      id: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: d.getDate().toString(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return dates;
};

export default function SchedulePickupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);

  const availableDates = useMemo(() => generateDates(30), []);
  const [selectedDateId, setSelectedDateId] = useState(availableDates[0].id);
  const [selectedSlot, setSelectedSlot] = useState('evening');
  const [address, setAddress] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const canContinue = address.trim().length > 0;

  // Track the keyboard so the footer can step aside and the address field
  // is always scrolled into view above the keyboard.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleContinue = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    const dateObj = availableDates.find((d) => d.id === selectedDateId);
    const slotObj = timeSlots.find((s) => s.id === selectedSlot);

    router.push({
      pathname: '/confirm-pickup',
      params: {
        ...params,
        pickupDate: dateObj?.fullDate,
        pickupTime: `${slotObj?.label} · ${slotObj?.time}`,
        pickupSlotId: slotObj?.id,
        pickupAddress: address.trim(),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // iOS: lift the whole screen by the keyboard height.
      // Android: handled natively by "softwareKeyboardLayoutMode": "pan" in app.json.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule pickup</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <Text style={styles.sectionTitle}>Pickup date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.datesScroll}
          contentContainerStyle={styles.datesContent}
          keyboardShouldPersistTaps="handled"
        >
          {availableDates.map((item) => {
            const isSelected = selectedDateId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => setSelectedDateId(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{item.day}</Text>
                <Text style={[styles.dateNumber, isSelected && styles.dateTextActive]}>{item.date}</Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateTextActive]}>{item.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Time slot</Text>
        <View style={styles.timeSlotsList}>
          {timeSlots.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotCard, isSelected && styles.slotCardActive]}
                onPress={() => setSelectedSlot(slot.id)}
                activeOpacity={0.8}
              >
                <View style={styles.slotIconWrap}>
                  {slot.iconLib === 'feather' ? (
                    <Feather name={slot.icon as any} size={18} color={washColors.textPrimary} />
                  ) : (
                    <MaterialCommunityIcons name={slot.icon as any} size={18} color={washColors.textPrimary} />
                  )}
                </View>
                <Text style={styles.slotText}>
                  <Text style={styles.slotLabel}>{slot.label}</Text> · {slot.time}
                </Text>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Pickup address</Text>
        <View style={styles.addressCard}>
          <Feather name="map-pin" size={18} color={washColors.navySolid} style={styles.addressIcon} />
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your house address or another person's address"
            placeholderTextColor={washColors.textMuted}
            value={address}
            onChangeText={setAddress}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer steps aside while typing so it never sits on top of the keyboard */}
      {!keyboardVisible && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue to pay</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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

  datesScroll: { marginBottom: 24, marginHorizontal: -20 },
  datesContent: { paddingHorizontal: 20, gap: 12 },
  dateCard: { width: 76, paddingVertical: 14, borderRadius: 16, backgroundColor: washColors.surface, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  dateCardActive: { borderColor: washColors.navySolid },
  dateDay: { fontSize: 11, fontFamily: fonts.poppins.semiBold, color: washColors.textSecondary, marginBottom: 4 },
  dateNumber: { fontSize: 20, fontFamily: fonts.poppins.bold, color: washColors.textPrimary, marginBottom: 2 },
  dateMonth: { fontSize: 12, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  dateTextActive: { color: washColors.navySolid },

  timeSlotsList: { gap: 12, marginBottom: 24 },
  slotCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: washColors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  slotCardActive: { borderColor: washColors.navySolid },
  slotIconWrap: { width: 24, alignItems: 'center' },
  slotText: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textPrimary },
  slotLabel: { fontFamily: fonts.poppins.semiBold },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: washColors.grayBorder, justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: washColors.navySolid },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: washColors.navySolid },

  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: washColors.surface, padding: 16, borderRadius: 16 },
  addressIcon: { marginTop: 2 },
  addressInput: { flex: 1, minHeight: 64, maxHeight: 140, padding: 0, fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textPrimary },

  bottomSpacer: { height: 40 },
  footer: { backgroundColor: washColors.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  continueButton: { backgroundColor: washColors.navySolid, paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: washColors.grayBorder },
  continueButtonText: { fontSize: 16, fontFamily: fonts.poppins.bold, color: '#fff' },
});