import { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
// Assuming your StateData file is located here. Adjust the path if needed.
import { NIGERIAN_STATES, getLGAsForState } from '../src/constants/nigerianStatesLGAs'; 

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
      fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    });
  }
  return dates;
};

export default function SchedulePickupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const availableDates = useMemo(() => generateDates(30), []);
  const [selectedDateId, setSelectedDateId] = useState(availableDates[0].id);
  const [selectedSlot, setSelectedSlot] = useState('evening');

  // Address State
  const [selectedState, setSelectedState] = useState('FCT');
  const [selectedLGA, setSelectedLGA] = useState('Municipal Area Council');
  const [landmark, setLandmark] = useState('Life camp');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<'state' | 'lga'>('state');

  const availableLGAs = useMemo(() => getLGAsForState(selectedState), [selectedState]);

  const handleContinue = () => {
    const dateObj = availableDates.find(d => d.id === selectedDateId);
    const slotObj = timeSlots.find(s => s.id === selectedSlot);
    const fullAddress = `${landmark}, ${selectedLGA}, ${selectedState}`;

    router.push({
      pathname: '/confirm-pickup',
      params: {
        ...params,
        pickupDate: dateObj?.fullDate,
        pickupTime: `${slotObj?.label} · ${slotObj?.time}`,
        pickupSlotId: slotObj?.id,
        pickupAddress: fullAddress,
      }
    });
  };

  const openAddressModal = () => {
    setModalStep('state');
    setModalVisible(true);
  };

  const handleSelectState = (state: string) => {
    setSelectedState(state);
    const lgas = getLGAsForState(state);
    setSelectedLGA(lgas[0] || '');
    setModalStep('lga');
  };

  const handleSelectLGA = (lga: string) => {
    setSelectedLGA(lga);
    setModalVisible(false);
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
        
        {/* Date Selection */}
        <Text style={styles.sectionTitle}>Pickup date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll} contentContainerStyle={styles.datesContent}>
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

        {/* Time Slot Selection */}
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

        {/* Pickup Address */}
        <View style={styles.addressHeader}>
          <Text style={styles.sectionTitle}>Pickup address</Text>
          <TouchableOpacity onPress={openAddressModal}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.addressCard} onPress={openAddressModal} activeOpacity={0.7}>
          <Feather name="map-pin" size={18} color={washColors.navySolid} />
          <Text style={styles.addressText} numberOfLines={2}>
            {landmark ? `${landmark}, ${selectedLGA}, ${selectedState}` : 'Select pickup address'}
          </Text>
          <Feather name="chevron-right" size={18} color={washColors.textMuted} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueButtonText}>Continue to pay</Text>
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => modalVisible && setModalVisible(false)}>
                <Feather name="x" size={24} color={washColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {modalStep === 'state' ? 'Select State' : 'Select LGA'}
              </Text>
              <View style={{ width: 24 }} /> {/* Spacer for centering */}
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {modalStep === 'state' ? (
                <FlatList
                  data={NIGERIAN_STATES}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.listItem, selectedState === item && styles.listItemActive]} 
                      onPress={() => handleSelectState(item)}
                    >
                      <Text style={[styles.listItemText, selectedState === item && styles.listItemTextActive]}>
                        {item}
                      </Text>
                      {selectedState === item && <Feather name="check" size={18} color={washColors.navySolid} />}
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <>
                  <View style={styles.landmarkInputContainer}>
                    <Feather name="home" size={18} color={washColors.textSecondary} />
                    <TextInput
                      style={styles.landmarkInput}
                      placeholder="Enter street, city or landmark (e.g. Life Camp)"
                      placeholderTextColor={washColors.textMuted}
                      value={landmark}
                      onChangeText={setLandmark}
                    />
                  </View>
                  <Text style={styles.modalSubtitle}>Select Local Government Area</Text>
                  <FlatList
                    data={availableLGAs}
                    keyExtractor={(item) => item}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={[styles.listItem, selectedLGA === item && styles.listItemActive]} 
                        onPress={() => handleSelectLGA(item)}
                      >
                        <Text style={[styles.listItemText, selectedLGA === item && styles.listItemTextActive]}>
                          {item}
                        </Text>
                        {selectedLGA === item && <Feather name="check" size={18} color={washColors.navySolid} />}
                      </TouchableOpacity>
                    )}
                  />
                </>
              )}
            </View>

            {/* Modal Footer (Save button for LGA step) */}
            {modalStep === 'lga' && (
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.saveButton, !landmark && styles.saveButtonDisabled]} 
                  onPress={() => setModalVisible(false)}
                  disabled={!landmark}
                >
                  <Text style={styles.saveButtonText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  
  // Dates
  datesScroll: { marginBottom: 24, marginHorizontal: -20 },
  datesContent: { paddingHorizontal: 20, gap: 12 },
  dateCard: { width: 76, paddingVertical: 14, borderRadius: 16, backgroundColor: washColors.surface, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  dateCardActive: { borderColor: washColors.navySolid },
  dateDay: { fontSize: 11, fontFamily: fonts.poppins.semiBold, color: washColors.textSecondary, marginBottom: 4 },
  dateNumber: { fontSize: 20, fontFamily: fonts.poppins.bold, color: washColors.textPrimary, marginBottom: 2 },
  dateMonth: { fontSize: 12, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  dateTextActive: { color: washColors.navySolid },

  // Time Slots
  timeSlotsList: { gap: 12, marginBottom: 24 },
  slotCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: washColors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  slotCardActive: { borderColor: washColors.navySolid },
  slotIconWrap: { width: 24, alignItems: 'center' },
  slotText: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textPrimary },
  slotLabel: { fontFamily: fonts.poppins.semiBold },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: washColors.grayBorder, justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: washColors.navySolid },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: washColors.navySolid },

  // Address
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editText: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: washColors.navySolid },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: washColors.surface, padding: 16, borderRadius: 16 },
  addressText: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },

  bottomSpacer: { height: 40 },
  footer: { backgroundColor: washColors.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  continueButton: { backgroundColor: washColors.navySolid, paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  continueButtonText: { fontSize: 16, fontFamily: fonts.poppins.bold, color: '#fff' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: washColors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: washColors.grayBorder },
  modalTitle: { fontSize: 18, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  modalSubtitle: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: washColors.textSecondary, marginTop: 20, marginBottom: 10 },
  
  // List Items
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: washColors.coveredBg },
  listItemActive: { backgroundColor: washColors.coveredBg },
  listItemText: { fontSize: 15, fontFamily: fonts.poppins.regular, color: washColors.textPrimary },
  listItemTextActive: { fontFamily: fonts.poppins.semiBold, color: washColors.navySolid },

  // Landmark Input
  landmarkInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: washColors.background, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  landmarkInput: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.regular, color: washColors.textPrimary },
  
  // Modal Footer
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: washColors.grayBorder },
  saveButton: { backgroundColor: washColors.navySolid, paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: washColors.grayBorder },
  saveButtonText: { fontSize: 16, fontFamily: fonts.poppins.bold, color: '#fff' },
});