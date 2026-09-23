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

const brandOptions: PaymentCard['brand'][] = ['Verve', 'Mastercard', 'Visa'];

function detectBrand(digits: string): PaymentCard['brand'] {
  if (digits.startsWith('506') || digits.startsWith('507') || digits.startsWith('650')) return 'Verve';
  if (digits.startsWith('5')) return 'Mastercard';
  return 'Visa';
}

export default function AddPaymentMethodScreen() {
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

      <View style={styles.footer}>
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
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  brandRow: { flexDirection: 'row', gap: 10 },
  brandPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: foodColors.surface,
  },
  brandPillActive: { backgroundColor: foodColors.primary },
  brandPillText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textSecondary,
  },
  brandPillTextActive: { color: '#fff' },

  input: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

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