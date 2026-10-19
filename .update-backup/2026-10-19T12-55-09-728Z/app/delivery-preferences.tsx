import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

const timeSlots = [
  'As soon as possible',
  'Morning (8am–12pm)',
  'Afternoon (12pm–4pm)',
  'Evening (4pm–8pm)',
];

export default function DeliveryPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const [defaultAddress, setDefaultAddress] = useState<'home' | 'work'>('home');
  const [instructions, setInstructions] = useState('Call when you arrive at the gate.');
  const [contactless, setContactless] = useState(true);
  const [slot, setSlot] = useState(timeSlots[0]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Delivery Preferences" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Default Delivery Address</Text>
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.addressRow}
            onPress={() => setDefaultAddress('home')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name="home" size={ms(16)} color={foodColors.primary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title}>Home</Text>
              <Text style={styles.subtitle}>14 Adekunle Fajuyi Road, GRA, Lokoja</Text>
            </View>
            {defaultAddress === 'home' && (
              <Feather name="check-circle" size={ms(18)} color={foodColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addressRow, styles.rowLast]}
            onPress={() => setDefaultAddress('work')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name="briefcase" size={ms(16)} color={foodColors.primary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title}>Work</Text>
              <Text style={styles.subtitle}>Suite 4B, Zenith Plaza, Murtala Way</Text>
            </View>
            {defaultAddress === 'work' && (
              <Feather name="check-circle" size={ms(18)} color={foodColors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Preferred Delivery Time</Text>
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
                <Feather name="check" size={ms(16)} color={foodColors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Delivery Instructions</Text>
        <TextInput
          style={styles.instructionsInput}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. Leave with the security guard"
          placeholderTextColor={foodColors.textMuted}
          multiline
        />

        <View style={styles.toggleRow}>
          <View style={styles.iconWrap}>
            <Feather name="shield" size={ms(16)} color={foodColors.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Contactless Delivery</Text>
            <Text style={styles.subtitle}>Rider leaves your order at the door</Text>
          </View>
          <Switch
            value={contactless}
            onValueChange={setContactless}
            trackColor={{ false: foodColors.border, true: foodColors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: ms(8),
    marginTop: ms(16),
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
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
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(14),
    paddingVertical: ms(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },

  instructionsInput: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    minHeight: ms(70),
    textAlignVertical: 'top',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(14),
    marginTop: ms(16),
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
  },
  saveButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});