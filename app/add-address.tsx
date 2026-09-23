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

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData, Address } from '../src/context/AppDataContext';

const labelOptions: { label: string; icon: Address['icon'] }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Work', icon: 'briefcase' },
  { label: 'Other', icon: 'map-pin' },
];

export default function AddAddressScreen() {
  const router = useRouter();
  const { addAddress } = useAppData();

  const [label, setLabel] = useState(labelOptions[0].label);
  const [icon, setIcon] = useState<Address['icon']>(labelOptions[0].icon);
  const [line, setLine] = useState('');
  const [details, setDetails] = useState('');

  const canSave = line.trim().length > 0 && details.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addAddress({ label, icon, line: line.trim(), details: details.trim() });
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Add New Address" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.fieldLabel}>Address Type</Text>
        <View style={styles.labelRow}>
          {labelOptions.map((option) => {
            const isActive = option.label === label;
            return (
              <TouchableOpacity
                key={option.label}
                style={[styles.labelPill, isActive && styles.labelPillActive]}
                onPress={() => {
                  setLabel(option.label);
                  setIcon(option.icon);
                }}
                activeOpacity={0.8}
              >
                <Feather
                  name={option.icon}
                  size={14}
                  color={isActive ? '#fff' : foodColors.textSecondary}
                />
                <Text style={[styles.labelPillText, isActive && styles.labelPillTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Street Address</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 14 Adekunle Fajuyi Road, GRA"
          placeholderTextColor={foodColors.textMuted}
          value={line}
          onChangeText={setLine}
        />

        <Text style={styles.fieldLabel}>City & State</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lokoja, Kogi State"
          placeholderTextColor={foodColors.textMuted}
          value={details}
          onChangeText={setDetails}
        />

        <Text style={styles.hint}>
          This address will be available to choose from when checking out an E-Chop order or
          booking an E-Wash pickup.
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>Save Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  labelRow: { flexDirection: 'row', gap: 10 },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: foodColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  labelPillActive: { backgroundColor: foodColors.primary },
  labelPillText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textSecondary,
  },
  labelPillTextActive: { color: '#fff' },

  input: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },

  hint: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    lineHeight: 17,
    color: foodColors.textMuted,
    marginTop: 18,
  },

  bottomSpacer: { height: 90 },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  saveButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});