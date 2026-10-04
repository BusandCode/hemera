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
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { useAppData } from '../src/context/AppDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);

  const availableDates = useMemo(() => generateDates(30), []);
  const [selectedDateId, setSelectedDateId] = useState(availableDates[0].id);
  const [selectedSlot, setSelectedSlot] = useState('evening');
  const { addresses, defaultAddress, addressesLoading } = useAppData();
  const [editing, setEditing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // With a default address saved, the pickup address starts as that address and the
  // person can switch to another saved address or type a different one. Without a
  // default, they simply type the address.
  const hasDefault = !!defaultAddress;
  const chosenSaved =
    (selectedAddressId ? addresses.find((a) => a.id === selectedAddressId) : undefined) ??
    defaultAddress;
  const usingCustom = !hasDefault || useCustom;
  const formatAddress = (a: { line: string; details: string }) =>
    a.details ? `${a.line}, ${a.details}` : a.line;
  const pickupAddress = usingCustom
    ? customAddress.trim()
    : chosenSaved
      ? formatAddress(chosenSaved)
      : '';
  const canContinue = pickupAddress.length > 0;

  const showingCustom = useCustom && customAddress.trim().length > 0;
  const shown = showingCustom
    ? { label: 'Another address', line: customAddress.trim(), details: '', isDefault: false }
    : chosenSaved
      ? {
          label: chosenSaved.label,
          line: chosenSaved.line,
          details: chosenSaved.details,
          isDefault: !!chosenSaved.isDefault,
        }
      : null;

  const handleDoneEditing = () => {
    if (useCustom && customAddress.trim().length === 0) setUseCustom(false);
    Keyboard.dismiss();
    setEditing(false);
  };

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
        pickupDateId: dateObj?.id,
        pickupTime: `${slotObj?.label} · ${slotObj?.time}`,
        pickupSlotId: slotObj?.id,
        pickupAddress,
      },
    });
  };

  const customInput = (
    <View style={styles.addressCard}>
      <Feather name="map-pin" size={ms(18)} color={washColors.navySolid} style={styles.addressIcon} />
      <TextInput
        style={styles.addressInput}
        placeholder="Enter your house address or another person's address"
        placeholderTextColor={washColors.textMuted}
        value={customAddress}
        onChangeText={setCustomAddress}
        onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
        multiline
        textAlignVertical="top"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // iOS: lift the whole screen by the keyboard height.
      // Android: handled natively by "softwareKeyboardLayoutMode": "pan" in app.json.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={ms(22)} color={washColors.textPrimary} />
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
                    <Feather name={slot.icon as any} size={ms(18)} color={washColors.textPrimary} />
                  ) : (
                    <MaterialCommunityIcons name={slot.icon as any} size={ms(18)} color={washColors.textPrimary} />
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
        {addressesLoading ? (
          <View style={[styles.addressCard, styles.addressLoading]}>
            <ActivityIndicator color={washColors.navySolid} />
          </View>
        ) : !hasDefault ? (
          customInput
        ) : !editing ? (
          <View style={styles.addressCard}>
            <Feather name="map-pin" size={ms(18)} color={washColors.navySolid} style={styles.addressIcon} />
            <View style={styles.addressTextBlock}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.addressLabel}>{shown?.label}</Text>
                {shown?.isDefault && (
                  <View style={styles.defaultPill}>
                    <Text style={styles.defaultPillText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressLine}>{shown?.line}</Text>
              {!!shown?.details && <Text style={styles.addressDetails}>{shown.details}</Text>}
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditing(true)}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={ms(13)} color={washColors.navySolid} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.addressOptions}>
              {addresses.map((a) => {
                const selected = !useCustom && chosenSaved?.id === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.slotCard, selected && styles.slotCardActive]}
                    onPress={() => {
                      setUseCustom(false);
                      setSelectedAddressId(a.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addressTextBlock}>
                      <View style={styles.addressLabelRow}>
                        <Text style={styles.addressLabel}>{a.label}</Text>
                        {a.isDefault && (
                          <View style={styles.defaultPill}>
                            <Text style={styles.defaultPillText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressLine}>{a.line}</Text>
                      {!!a.details && <Text style={styles.addressDetails}>{a.details}</Text>}
                    </View>
                    <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.slotCard, useCustom && styles.slotCardActive]}
                onPress={() => setUseCustom(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addressTextBlock}>
                  <Text style={styles.addressLabel}>Another address</Text>
                  <Text style={styles.addressDetails}>Type a different pickup address</Text>
                </View>
                <View style={[styles.radioCircle, useCustom && styles.radioCircleActive]}>
                  {useCustom && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>

            {useCustom && customInput}

            <TouchableOpacity style={styles.doneBtn} onPress={handleDoneEditing} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer steps aside while typing so it never sits on top of the keyboard */}
      {!keyboardVisible && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: ms(16), paddingHorizontal: ms(20), paddingBottom: ms(16) },
  backBtn: { width: ms(28), height: ms(28), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: ms(22), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(16) },
  sectionTitle: { fontSize: ms(16), fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary, marginBottom: ms(12) },

  datesScroll: { marginBottom: ms(24), marginHorizontal: -20 },
  datesContent: { paddingHorizontal: ms(20), gap: ms(12) },
  dateCard: { width: ms(76), paddingVertical: ms(14), borderRadius: ms(16), backgroundColor: washColors.surface, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  dateCardActive: { borderColor: washColors.navySolid },
  dateDay: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: washColors.textSecondary, marginBottom: ms(4) },
  dateNumber: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: washColors.textPrimary, marginBottom: ms(2) },
  dateMonth: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  dateTextActive: { color: washColors.navySolid },

  timeSlotsList: { gap: ms(12), marginBottom: ms(24) },
  slotCard: { flexDirection: 'row', alignItems: 'center', gap: ms(12), backgroundColor: washColors.surface, padding: ms(16), borderRadius: ms(16), borderWidth: 1, borderColor: 'transparent' },
  slotCardActive: { borderColor: washColors.navySolid },
  slotIconWrap: { width: ms(24), alignItems: 'center' },
  slotText: { flex: 1, fontSize: ms(14), fontFamily: fonts.poppins.regular, color: washColors.textPrimary },
  slotLabel: { fontFamily: fonts.poppins.semiBold },
  radioCircle: { width: ms(22), height: ms(22), borderRadius: ms(11), borderWidth: 1.5, borderColor: washColors.grayBorder, justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: washColors.navySolid },
  radioInner: { width: ms(12), height: ms(12), borderRadius: ms(6), backgroundColor: washColors.navySolid },

  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(12), backgroundColor: washColors.surface, padding: ms(16), borderRadius: ms(16) },
  addressIcon: { marginTop: ms(2) },
  addressInput: { flex: 1, minHeight: ms(64), maxHeight: 140, padding: 0, fontSize: ms(14), fontFamily: fonts.poppins.regular, color: washColors.textPrimary },

  addressLoading: { justifyContent: 'center', alignItems: 'center', minHeight: ms(64) },
  addressTextBlock: { flex: 1, minWidth: 0 },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8), marginBottom: ms(2) },
  addressLabel: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: washColors.textPrimary },
  addressLine: { fontSize: ms(13.5), lineHeight: ms(19), fontFamily: fonts.poppins.regular, color: washColors.textPrimary },
  addressDetails: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: washColors.textSecondary, marginTop: ms(2) },
  defaultPill: { backgroundColor: washColors.coveredBg, paddingHorizontal: ms(8), paddingVertical: ms(2), borderRadius: ms(8) },
  defaultPillText: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: washColors.coveredText },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: ms(5), paddingHorizontal: ms(10), paddingVertical: ms(6), borderRadius: ms(14), backgroundColor: washColors.coveredBg },
  editBtnText: { fontSize: ms(12), fontFamily: fonts.poppins.bold, color: washColors.navySolid },
  addressOptions: { gap: ms(12), marginBottom: ms(12) },
  doneBtn: { alignSelf: 'flex-end', marginTop: ms(12), paddingHorizontal: ms(18), paddingVertical: ms(9), borderRadius: ms(18), backgroundColor: washColors.navySolid },
  doneBtnText: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: '#fff' },

  bottomSpacer: { height: ms(40) },
  footer: { backgroundColor: washColors.surface, paddingHorizontal: ms(20), paddingTop: ms(16), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  continueButton: { backgroundColor: washColors.navySolid, paddingVertical: ms(16), borderRadius: ms(28), alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: washColors.grayBorder },
  continueButtonText: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: '#fff' },
});