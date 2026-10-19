import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];
const MAX_DIGITS = 10;

// "1234567" -> "1,234,567"
const formatWithCommas = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function FundWalletAmountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Raw digits only (no commas); formatting is applied for display
  const [amount, setAmount] = useState('0');

  const numericAmount = parseInt(amount || '0', 10);
  const canContinue = numericAmount >= 100;

  const handleAmountChange = (text: string) => {
    // Strip commas and any non-digits, then drop leading zeros
    const digits = text.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, MAX_DIGITS);
    setAmount(digits === '' ? '0' : digits);
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    router.push({ pathname: '/fund-wallet-account', params: { amount: String(numericAmount) } } as any);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Fund Wallet</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Add money to your Hemera wallet via bank transfer.</Text>

        <View style={styles.infoCard}>
          <Feather name="info" size={ms(18)} color={foodColors.badgeBlue} />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>One-time Virtual Account</Text>
            <Text style={styles.infoSubtitle}>
              We'll generate a unique account for this payment. Transfer exactly the amount you enter to avoid delays.
            </Text>
          </View>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>How much would you like to fund?</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencySign}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={formatWithCommas(amount)}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              placeholder="0"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          <Text style={styles.amountHint}>Enter amount to fund your wallet</Text>

          <Text style={styles.quickLabel}>Quick amounts</Text>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q) => {
              const active = numericAmount === q;
              return (
                <TouchableOpacity
                  key={q}
                  style={[styles.quickPill, active && styles.quickPillActive]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setAmount(String(q));
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.quickPillText, active && styles.quickPillTextActive]}>
                    ₦{formatWithCommas(String(q))}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.secureCard}>
          <Feather name="shield" size={ms(18)} color={foodColors.success} />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>Secure & Automatic</Text>
            <Text style={styles.infoSubtitle}>Your wallet will be credited automatically once we confirm your payment.</Text>
          </View>
        </View>

        <View style={styles.secureCard}>
          <Feather name="file-text" size={ms(18)} color={foodColors.textSecondary} />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>Important</Text>
            <Text style={styles.infoSubtitle}>Transfer exactly the amount you enter. Payments above or below may be delayed.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Feather name="arrow-right" size={ms(16)} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(20) },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12), paddingHorizontal: ms(20), marginBottom: ms(16) },
  backBtn: {
    width: ms(38), height: ms(38), borderRadius: ms(19),
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  subtitle: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: ms(18) },

  infoCard: {
    flexDirection: 'row', gap: ms(12), backgroundColor: foodColors.surface,
    borderRadius: ms(16), padding: ms(14), marginBottom: ms(16),
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(3) },
  infoSubtitle: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: ms(16) },

  amountCard: {
    backgroundColor: foodColors.surface, borderRadius: ms(18), padding: ms(16), marginBottom: ms(16),
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  amountLabel: { fontSize: ms(13.5), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(12) },
  amountInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: ms(6),
    borderWidth: 1.5, borderColor: foodColors.border, borderRadius: ms(14),
    paddingHorizontal: ms(14), paddingVertical: ms(10),
  },
  currencySign: { fontSize: ms(26), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  amountInput: { flex: 1, fontSize: ms(26), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, padding: 0 },
  amountHint: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: ms(6), marginBottom: ms(16) },
  quickLabel: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary, marginBottom: ms(10) },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(8) },
  quickPill: {
    paddingHorizontal: ms(14), paddingVertical: ms(9), borderRadius: ms(12),
    borderWidth: 1.5, borderColor: foodColors.border,
  },
  quickPillActive: { borderColor: foodColors.badgeBlue, backgroundColor: 'rgba(46,90,172,0.06)' },
  quickPillText: { fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
  quickPillTextActive: { color: foodColors.badgeBlue },

  secureCard: {
    flexDirection: 'row', gap: ms(12), backgroundColor: foodColors.surface,
    borderRadius: ms(16), padding: ms(14), marginBottom: ms(12),
  },

  footer: {
    paddingHorizontal: ms(20), paddingTop: ms(14),
    borderTopWidth: 1, borderTopColor: foodColors.border,
    backgroundColor: foodColors.background,
  },
  continueButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(8),
    backgroundColor: '#0B1020', paddingVertical: ms(16), borderRadius: ms(26),
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});