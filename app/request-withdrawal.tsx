import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useAuth } from '../src/context/AuthContext';
import { useWalletBalance } from '../src/hooks/useWalletBalance';
import { supabase } from '../src/lib/supabase';

const WALLET_BLUE = '#0032C1';
const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];
const MIN_WITHDRAWAL = 1000;

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function maskAccount(num: string) {
  return `•••• ${num.slice(-4)}`;
}

export default function RequestWithdrawalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { balanceNaira } = useWalletBalance();

  const [amount, setAmount] = useState('10000');
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!session?.user.id) return;
        setLoadingAccount(true);
        const { data } = await supabase
          .from('bank_accounts')
          .select('id, bank_name, account_name, account_number')
          .eq('user_id', session.user.id)
          .eq('is_default', true)
          .maybeSingle();
        setBankAccount(data);
        setLoadingAccount(false);
      })();
    }, [session?.user.id])
  );

  const numericAmount = parseInt(amount || '0', 10);
  const canContinue = numericAmount >= MIN_WITHDRAWAL && numericAmount <= balanceNaira && !!bankAccount;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Request Withdrawal</Text>
        <Text style={styles.subtitle}>Withdraw your available balance to your linked bank account.</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceValue}>{formatNaira(balanceNaira)}</Text>
          <Text style={styles.balanceHint}>This is your available balance for withdrawal.</Text>
        </View>

        <Text style={styles.sectionLabel}>Amount to withdraw</Text>
        <View style={styles.amountInputRow}>
          <Text style={styles.currencySign}>₦</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
          />
        </View>
        <Text style={styles.amountHint}>
          Minimum withdrawal amount is {formatNaira(MIN_WITHDRAWAL)}
          {numericAmount > balanceNaira ? ' • Exceeds available balance' : ''}
        </Text>

        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((q) => {
            const active = numericAmount === q;
            return (
              <TouchableOpacity
                key={q}
                style={[styles.quickPill, active && styles.quickPillActive]}
                onPress={() => setAmount(String(q))}
                activeOpacity={0.85}
              >
                <Text style={[styles.quickPillText, active && styles.quickPillTextActive]}>
                  {formatNaira(q)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Withdraw to</Text>
        {loadingAccount ? (
          <ActivityIndicator color={WALLET_BLUE} style={{ marginVertical: 14 }} />
        ) : bankAccount ? (
          <TouchableOpacity
            style={styles.bankCard}
            activeOpacity={0.85}
            onPress={() => router.push('/add-bank-account' as any)}
          >
            <View style={styles.bankLogo}>
              <Feather name="credit-card" size={18} color="#fff" />
            </View>
            <View style={styles.bankInfo}>
              <Text style={styles.bankName}>{bankAccount.bank_name}</Text>
              <Text style={styles.bankSub}>{bankAccount.account_name}</Text>
              <Text style={styles.bankSub}>{maskAccount(bankAccount.account_number)}</Text>
            </View>
            <Text style={styles.changeLink}>Change</Text>
            <Feather name="chevron-right" size={16} color={foodColors.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addBankCard}
            activeOpacity={0.85}
            onPress={() => router.push('/add-bank-account' as any)}
          >
            <Feather name="plus-circle" size={18} color={WALLET_BLUE} />
            <Text style={styles.addBankText}>Add a bank account to withdraw</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Feather name="info" size={18} color={WALLET_BLUE} />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>Withdrawal Information</Text>
            <Text style={styles.infoSubtitle}>Withdrawals are usually processed within 24 hours on business days.</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Withdrawal Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to withdraw</Text>
            <Text style={styles.summaryValue}>{formatNaira(numericAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Withdrawal fee</Text>
            <Text style={styles.summaryFree}>Free</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>You will receive</Text>
            <Text style={styles.summaryValueBold}>{formatNaira(numericAmount)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={() =>
            router.push({
              pathname: '/confirm-withdrawal',
              params: { amount: String(numericAmount), bankAccountId: bankAccount!.id },
            } as any)
          }
        >
          <Text style={styles.continueButtonText}>Request Withdrawal</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  content: { flex: 1, paddingHorizontal: 20 },

  titleRow: { paddingHorizontal: 20, marginBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },

  title: { fontSize: 28, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: 10, marginBottom: 6 },
  subtitle: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 18, marginBottom: 18 },

  balanceCard: { backgroundColor: WALLET_BLUE, borderRadius: 20, padding: 18, marginBottom: 20 },
  balanceLabel: { fontSize: 10.5, fontFamily: fonts.poppins.bold, letterSpacing: 0.8, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  balanceValue: { fontSize: 28, fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 6 },
  balanceHint: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.85)' },

  sectionLabel: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 10 },
  sectionSpacing: { marginTop: 22 },

  amountInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: foodColors.surface, borderWidth: 1.5, borderColor: foodColors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  currencySign: { fontSize: 24, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  amountInput: { flex: 1, fontSize: 24, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, padding: 0 },
  amountHint: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: 6, marginBottom: 12 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: foodColors.border },
  quickPillActive: { borderColor: WALLET_BLUE, backgroundColor: 'rgba(0,50,193,0.06)' },
  quickPillText: { fontSize: 12.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
  quickPillTextActive: { color: WALLET_BLUE },

  bankCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: foodColors.surface,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  bankLogo: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E4342D', justifyContent: 'center', alignItems: 'center' },
  bankInfo: { flex: 1, minWidth: 0 },
  bankName: { fontSize: 14, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  bankSub: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 1 },
  changeLink: { fontSize: 12.5, fontFamily: fonts.poppins.bold, color: WALLET_BLUE },

  addBankCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,50,193,0.06)',
    borderRadius: 16, padding: 16, justifyContent: 'center',
  },
  addBankText: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: WALLET_BLUE },

  infoCard: {
    flexDirection: 'row', gap: 12, backgroundColor: 'rgba(0,50,193,0.06)',
    borderRadius: 16, padding: 14, marginTop: 18, marginBottom: 18,
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 3 },
  infoSubtitle: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16 },

  summaryCard: {
    backgroundColor: foodColors.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  summaryTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  summaryValue: { fontSize: 12.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  summaryFree: { fontSize: 12.5, fontFamily: fonts.poppins.bold, color: foodColors.success },
  summaryDivider: { height: 1, backgroundColor: foodColors.border, marginVertical: 8 },
  summaryLabelBold: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  summaryValueBold: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: WALLET_BLUE },

  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: foodColors.border },
  continueButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0B1020', paddingVertical: 16, borderRadius: 26,
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});