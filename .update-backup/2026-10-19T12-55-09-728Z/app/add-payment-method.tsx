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
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData, PaymentCard } from '../src/context/AppDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

const brandOptions: PaymentCard['brand'][] = ['Verve', 'Mastercard', 'Visa'];

function detectBrand(digits: string): PaymentCard['brand'] {
  if (digits.startsWith('506') || digits.startsWith('507') || digits.startsWith('650')) return 'Verve';
  if (digits.startsWith('5')) return 'Mastercard';
  return 'Visa';
}

export default function AddPaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addCard } = useAppData();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [brand, setBrand] = useState<PaymentCard['brand']>('Verve');

  const digits = cardNumber.replace(/\D/g, '');
  const canSave = digits.length >= 12 && expiry.trim().length >= 4 && cvv.trim().length >= 3;

  const handleSave = () => {
    if (!canSave) return;
    addCard({
      brand,
      last4: digits.slice(-4),
      expiry: expiry.trim(),
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Add Payment Method" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.fieldLabel}>Card Type</Text>
        <View style={styles.brandRow}>
          {brandOptions.map((option) => {
            const isActive = option === brand;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.brandPill, isActive && styles.brandPillActive]}
                onPress={() => setBrand(option)}
                activeOpacity={0.8}
              >
                <Text style={[styles.brandPillText, isActive && styles.brandPillTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Card Number</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={foodColors.textMuted}
          value={cardNumber}
          onChangeText={(text) => {
            setCardNumber(text);
            const onlyDigits = text.replace(/\D/g, '');
            if (onlyDigits.length >= 1) setBrand(detectBrand(onlyDigits));
          }}
          keyboardType="number-pad"
          maxLength={19}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Expiry (MM/YY)</Text>
            <TextInput
              style={styles.input}
              placeholder="09/28"
              placeholderTextColor={foodColors.textMuted}
              value={expiry}
              onChangeText={setExpiry}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>CVV</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              placeholderTextColor={foodColors.textMuted}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        <Text style={styles.hint}>
          This card will be used for both E-Chop food orders and E-Wash laundry payments.
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>Add Card</Text>
        </TouchableOpacity>
      </View>
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
  brandRow: { flexDirection: 'row', gap: ms(10) },
  brandPill: {
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: ms(20),
    backgroundColor: foodColors.surface,
  },
  brandPillActive: { backgroundColor: foodColors.primary },
  brandPillText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textSecondary,
  },
  brandPillTextActive: { color: '#fff' },

  input: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(13) : ms(10),
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  row: { flexDirection: 'row', gap: ms(12) },
  halfField: { flex: 1 },

  hint: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(17),
    color: foodColors.textMuted,
    marginTop: ms(18),
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
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});