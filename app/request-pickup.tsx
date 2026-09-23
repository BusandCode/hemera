import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData } from '../src/context/AppDataContext';

const timeSlots = ['Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)'];
const loadSizes = [
  { id: 'small', label: 'Small', hint: 'Up to 8 items' },
  { id: 'medium', label: 'Medium', hint: '9–15 items' },
  { id: 'large', label: 'Large', hint: '16+ items' },
] as const;

export default function RequestPickupScreen() {
  const router = useRouter();
  const { addresses } = useAppData();

  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  );
  const [loadSize, setLoadSize] = useState<(typeof loadSizes)[number]['id']>('small');
  const [slot, setSlot] = useState(timeSlots[0]);
  const [notes, setNotes] = useState('');

  const canSubmit = addressId.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Request Pickup" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Pickup Address</Text>
        <View style={styles.group}>
          {addresses.map((address, index) => {
            const isActive = address.id === addressId;
            return (
              <TouchableOpacity
                key={address.id}
                style={[styles.addressRow, index === addresses.length - 1 && styles.rowLast]}
                onPress={() => setAddressId(address.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  <Feather name={address.icon} size={16} color={washColors.navySolid} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.title}>{address.label}</Text>
                  <Text style={styles.subtitle}>
                    {address.line}, {address.details}
                  </Text>
                </View>
                {isActive && (
                  <Feather name="check-circle" size={18} color={washColors.navySolid} />
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.addressRow, styles.rowLast]}
            onPress={() => router.push('/add-address')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name="plus" size={16} color={washColors.navySolid} />
            </View>
            <Text style={styles.title}>Add New Address</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Estimated Load Size</Text>
        <View style={styles.loadRow}>
          {loadSizes.map((size) => {
            const isActive = size.id === loadSize;
            return (
              <TouchableOpacity
                key={size.id}
                style={[styles.loadCard, isActive && styles.loadCardActive]}
                onPress={() => setLoadSize(size.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.loadLabel, isActive && styles.loadLabelActive]}>
                  {size.label}
                </Text>
                <Text style={[styles.loadHint, isActive && styles.loadHintActive]}>
                  {size.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Preferred Pickup Time</Text>
        <View style={styles.group}>
          {timeSlots.map((item, index) => (
            <TouchableOpacity
              key={item}
              style={[styles.slotRow, index === timeSlots.length - 1 && styles.rowLast]}
              onPress={() => setSlot(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.title}>{item}</Text>
              {slot === item && (
                <Feather name="check" size={16} color={washColors.navySolid} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Pickup Instructions (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Bag is by the front gate"
          placeholderTextColor={washColors.textMuted}
          multiline
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>Confirm Pickup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: washColors.textMuted,
    marginBottom: 8,
    marginTop: 18,
  },
  group: {
    backgroundColor: washColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 2,
  },

  loadRow: { flexDirection: 'row', gap: 10 },
  loadCard: {
    flex: 1,
    backgroundColor: washColors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  loadCardActive: {
    backgroundColor: washColors.navySolid,
    borderColor: washColors.navySolid,
  },
  loadLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  loadLabelActive: { color: '#fff' },
  loadHint: {
    fontSize: 10.5,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 3,
  },
  loadHintActive: { color: 'rgba(255,255,255,0.8)' },

  notesInput: {
    backgroundColor: washColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: washColors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  bottomSpacer: { height: 90 },

  footer: {
    backgroundColor: washColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  submitButton: {
    backgroundColor: washColors.red,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});