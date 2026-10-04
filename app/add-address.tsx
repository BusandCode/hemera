import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { NIGERIAN_STATES, getLGAsForState } from '../src/constants/nigerianStatesLGAs';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData, Address } from '../src/context/AppDataContext';
import { useLocation } from '../src/context/LocationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

const labelOptions: { label: string; icon: Address['icon'] }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Work', icon: 'briefcase' },
  { label: 'Other', icon: 'map-pin' },
];

function OptionPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o}
            style={styles.optionList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {item}
                  </Text>
                  {isSelected && <Feather name="check" size={ms(16)} color={foodColors.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AddAddressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addAddress } = useAppData();
  const { location } = useLocation();

  const [label, setLabel] = useState(labelOptions[0].label);
  const [icon, setIcon] = useState<Address['icon']>(labelOptions[0].icon);
  const [line, setLine] = useState('');

  // Start from the delivery location currently chosen in the app.
  const [stateName, setStateName] = useState(
    NIGERIAN_STATES.includes(location.state) ? location.state : ''
  );
  const [lga, setLga] = useState(
    getLGAsForState(location.state).includes(location.lga) ? location.lga : ''
  );

  const [picker, setPicker] = useState<'state' | 'lga' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = line.trim().length > 0 && !!stateName && !!lga && !saving;

  const handlePickState = (value: string) => {
    if (value !== stateName) {
      setStateName(value);
      setLga('');
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await addAddress({
        label,
        icon,
        line: line.trim(),
        details: `${lga}, ${stateName}`,
        state: stateName,
        lga,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Could not save this address. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Add New Address" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                  size={ms(14)}
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

        <Text style={styles.fieldLabel}>State</Text>
        <TouchableOpacity
          style={styles.selectField}
          onPress={() => setPicker('state')}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectText, !stateName && styles.selectPlaceholder]}>
            {stateName || 'Select state'}
          </Text>
          <Feather name="chevron-down" size={ms(16)} color={foodColors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Local Government Area</Text>
        <TouchableOpacity
          style={[styles.selectField, !stateName && styles.selectDisabled]}
          onPress={() => stateName && setPicker('lga')}
          disabled={!stateName}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectText, !lga && styles.selectPlaceholder]}>
            {lga || (stateName ? 'Select LGA' : 'Select a state first')}
          </Text>
          <Feather name="chevron-down" size={ms(16)} color={foodColors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.hint}>
          This address will be available when checking out an E-Chop order or booking an
          E-Wash pickup. If it's your default address, your delivery location updates to
          match it.
        </Text>

        {error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={ms(13)} color={foodColors.primary} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>

      <OptionPicker
        visible={picker === 'state'}
        title="Select state"
        options={NIGERIAN_STATES}
        selected={stateName}
        onSelect={handlePickState}
        onClose={() => setPicker(null)}
      />
      <OptionPicker
        visible={picker === 'lga'}
        title={`Select LGA${stateName ? ` in ${stateName}` : ''}`}
        options={getLGAsForState(stateName)}
        selected={lga}
        onSelect={setLga}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  fieldLabel: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: ms(8),
    marginTop: ms(16),
  },
  labelRow: { flexDirection: 'row', gap: ms(10) },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: foodColors.surface,
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
    borderRadius: ms(20),
  },
  labelPillActive: { backgroundColor: foodColors.primary },
  labelPillText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textSecondary,
  },
  labelPillTextActive: { color: '#fff' },

  input: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(13) : ms(10),
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(14) : ms(12),
  },
  selectDisabled: { opacity: 0.5 },
  selectText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  selectPlaceholder: { color: foodColors.textMuted },

  hint: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(17),
    color: foodColors.textMuted,
    marginTop: ms(18),
  },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(6), marginTop: ms(14) },
  errorText: {
    flex: 1,
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },

  bottomSpacer: { height: ms(90) },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: ms(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  saveButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ms(50),
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: foodColors.surface,
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    paddingHorizontal: ms(22),
    paddingTop: ms(10),
    paddingBottom: ms(28),
    maxHeight: '70%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: ms(40),
    height: 4,
    borderRadius: ms(2),
    backgroundColor: foodColors.border,
    marginBottom: ms(14),
  },
  modalTitle: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(8),
  },
  optionList: { flexGrow: 0 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  optionText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  optionTextSelected: { fontFamily: fonts.poppins.bold, color: foodColors.primary },
});