import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export default function FundWalletAmountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // const [amount, setAmount] = useState('20000');
  const [amount, setAmount] = useState('0');

  const numericAmount = parseInt(amount || '0', 10);
  const canContinue = numericAmount >= 100;

  const handleContinue = () => {
    Keyboard.dismiss();
    router.push({ pathname: '/fund-wallet-account', params: { amount: String(numericAmount) } } as any);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <StatusBar style="dark" />

        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Fund Wallet</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Add money to your Hemera wallet via bank transfer.</Text>

          <View style={styles.infoCard}>
            <Feather name="info" size={18} color={foodColors.badgeBlue} />
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
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
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
                      ₦{q.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.secureCard}>
            <Feather name="shield" size={18} color={foodColors.success} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>Secure & Automatic</Text>
              <Text style={styles.infoSubtitle}>Your wallet will be credited automatically once we confirm your payment.</Text>
            </View>
          </View>

          <View style={styles.secureCard}>
            <Feather name="file-text" size={18} color={foodColors.textSecondary} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>Important</Text>
              <Text style={styles.infoSubtitle}>Transfer exactly the amount you enter. Payments above or below may be delayed.</Text>
            </View>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            activeOpacity={0.85}
            disabled={!canContinue}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  content: { flex: 1, paddingHorizontal: 20 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 20, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  subtitle: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: 18 },

  infoCard: {
    flexDirection: 'row', gap: 12, backgroundColor: foodColors.surface,
    borderRadius: 16, padding: 14, marginBottom: 16,
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 3 },
  infoSubtitle: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16 },

  amountCard: {
    backgroundColor: foodColors.surface, borderRadius: 18, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  amountLabel: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 12 },
  amountInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: foodColors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  currencySign: { fontSize: 26, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  amountInput: { flex: 1, fontSize: 26, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, padding: 0 },
  amountHint: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: 6, marginBottom: 16 },
  quickLabel: { fontSize: 12, fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary, marginBottom: 10 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickPill: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    borderWidth: 1.5, borderColor: foodColors.border,
  },
  quickPillActive: { borderColor: foodColors.badgeBlue, backgroundColor: 'rgba(46,90,172,0.06)' },
  quickPillText: { fontSize: 12.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
  quickPillTextActive: { color: foodColors.badgeBlue },

  secureCard: {
    flexDirection: 'row', gap: 12, backgroundColor: foodColors.surface,
    borderRadius: 16, padding: 14, marginBottom: 12,
  },

  footer: {
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: foodColors.border,
  },
  continueButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0B1020', paddingVertical: 16, borderRadius: 26,
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});