import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useAuth } from '../src/context/AuthContext';
import { useWalletBalance } from '../src/hooks/useWalletBalance';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

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
  const balance = balanceNaira ?? 0;

  const [amount, setAmount] = useState('10000');
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const userId = session?.user.id;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (!userId) {
          // No session yet: don't leave the spinner running forever.
          // This effect re-runs when the session arrives.
          setBankAccount(null);
          setLoadingAccount(false);
          return;
        }

        setLoadingAccount(true);
        setAccountError(false);

        try {
          const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, bank_name, account_name, account_number')
            .eq('user_id', userId)
            .eq('is_default', true)
            .limit(1)
            .maybeSingle();

          if (cancelled) return;

          if (error) {
            console.warn('Failed to load bank account:', error.message);
            setBankAccount(null);
            setAccountError(true);
          } else {
            setBankAccount(data);
          }
        } catch (e) {
          if (cancelled) return;
          console.warn('Failed to load bank account:', e);
          setBankAccount(null);
          setAccountError(true);
        } finally {
          if (!cancelled) setLoadingAccount(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [userId, reloadKey])
  );

  const numericAmount = parseInt(amount || '0', 10);
  const canContinue = numericAmount >= MIN_WITHDRAWAL && numericAmount <= balance && !!bankAccount;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <StatusBar style="dark" />

        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Request Withdrawal</Text>
          <Text style={styles.subtitle}>Withdraw your available balance to your linked bank account.</Text>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceValue}>{formatNaira(balance)}</Text>
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
              returnKeyType="done"
            />
          </View>
          <Text style={styles.amountHint}>
            Minimum withdrawal amount is {formatNaira(MIN_WITHDRAWAL)}
            {numericAmount > balance ? ' • Exceeds available balance' : ''}
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
          ) : accountError ? (
            <TouchableOpacity
              style={styles.addBankCard}
              activeOpacity={0.85}
              onPress={() => setReloadKey((k) => k + 1)}
            >
              <Feather name="refresh-cw" size={ms(16)} color={WALLET_BLUE} />
              <Text style={styles.addBankText}>Couldn't load your bank account. Tap to retry</Text>
            </TouchableOpacity>
          ) : bankAccount ? (
            <TouchableOpacity
              style={styles.bankCard}
              activeOpacity={0.85}
              onPress={() => router.push('/add-bank-account' as any)}
            >
              <View style={styles.bankLogo}>
                <Feather name="credit-card" size={ms(18)} color="#fff" />
              </View>
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{bankAccount.bank_name}</Text>
                <Text style={styles.bankSub}>{bankAccount.account_name}</Text>
                <Text style={styles.bankSub}>{maskAccount(bankAccount.account_number)}</Text>
              </View>
              <Text style={styles.changeLink}>Change</Text>
              <Feather name="chevron-right" size={ms(16)} color={foodColors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addBankCard}
              activeOpacity={0.85}
              onPress={() => router.push('/add-bank-account' as any)}
            >
              <Feather name="plus-circle" size={ms(18)} color={WALLET_BLUE} />
              <Text style={styles.addBankText}>Add a bank account to withdraw</Text>
            </TouchableOpacity>
          )}

          <View style={styles.infoCard}>
            <Feather name="info" size={ms(18)} color={WALLET_BLUE} />
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
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            activeOpacity={0.85}
            disabled={!canContinue}
            onPress={() => {
              if (!bankAccount) return;
              router.push({
                pathname: '/confirm-withdrawal',
                params: { amount: String(numericAmount), bankAccountId: bankAccount.id },
              } as any);
            }}
          >
            <Text style={styles.continueButtonText}>Request Withdrawal</Text>
            <Feather name="arrow-right" size={ms(16)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: foodColors.background },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(24) },

  titleRow: { paddingHorizontal: ms(20), marginBottom: ms(4) },
  backBtn: {
    width: ms(38), height: ms(38), borderRadius: ms(19),
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },

  title: { fontSize: ms(28), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: ms(10), marginBottom: ms(6) },
  subtitle: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: ms(18), marginBottom: ms(18) },

  balanceCard: { backgroundColor: WALLET_BLUE, borderRadius: ms(20), padding: ms(18), marginBottom: ms(20) },
  balanceLabel: { fontSize: ms(10.5), fontFamily: fonts.poppins.bold, letterSpacing: 0.8, color: 'rgba(255,255,255,0.7)', marginBottom: ms(8) },
  balanceValue: { fontSize: ms(28), fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: ms(6) },
  balanceHint: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.85)' },

  sectionLabel: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(10) },
  sectionSpacing: { marginTop: ms(22) },

  amountInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: ms(6),
    backgroundColor: foodColors.surface, borderWidth: 1.5, borderColor: foodColors.border,
    borderRadius: ms(14), paddingHorizontal: ms(14), paddingVertical: ms(10),
  },
  currencySign: { fontSize: ms(24), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  amountInput: { flex: 1, fontSize: ms(24), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, padding: 0 },
  amountHint: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: ms(6), marginBottom: ms(12) },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(8) },
  quickPill: { paddingHorizontal: ms(14), paddingVertical: ms(9), borderRadius: ms(12), borderWidth: 1.5, borderColor: foodColors.border },
  quickPillActive: { borderColor: WALLET_BLUE, backgroundColor: 'rgba(0,50,193,0.06)' },
  quickPillText: { fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
  quickPillTextActive: { color: WALLET_BLUE },

  bankCard: {
    flexDirection: 'row', alignItems: 'center', gap: ms(12), backgroundColor: foodColors.surface,
    borderRadius: ms(16), padding: ms(14),
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  bankLogo: { width: ms(38), height: ms(38), borderRadius: ms(10), backgroundColor: '#E4342D', justifyContent: 'center', alignItems: 'center' },
  bankInfo: { flex: 1, minWidth: 0 },
  bankName: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  bankSub: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(1) },
  changeLink: { fontSize: ms(12.5), fontFamily: fonts.poppins.bold, color: WALLET_BLUE },

  addBankCard: {
    flexDirection: 'row', alignItems: 'center', gap: ms(10), backgroundColor: 'rgba(0,50,193,0.06)',
    borderRadius: ms(16), padding: ms(16), justifyContent: 'center',
  },
  addBankText: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: WALLET_BLUE },

  infoCard: {
    flexDirection: 'row', gap: ms(12), backgroundColor: 'rgba(0,50,193,0.06)',
    borderRadius: ms(16), padding: ms(14), marginTop: ms(18), marginBottom: ms(18),
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(3) },
  infoSubtitle: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: ms(16) },

  summaryCard: {
    backgroundColor: foodColors.surface, borderRadius: ms(16), padding: ms(16),
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  summaryTitle: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(10) },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: ms(6) },
  summaryLabel: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  summaryValue: { fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  summaryFree: { fontSize: ms(12.5), fontFamily: fonts.poppins.bold, color: foodColors.success },
  summaryDivider: { height: 1, backgroundColor: foodColors.border, marginVertical: ms(8) },
  summaryLabelBold: { fontSize: ms(13.5), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  summaryValueBold: { fontSize: ms(13.5), fontFamily: fonts.poppins.bold, color: WALLET_BLUE },

  footer: { paddingHorizontal: ms(20), paddingTop: ms(14), borderTopWidth: 1, borderTopColor: foodColors.border },
  continueButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(8),
    backgroundColor: '#0B1020', paddingVertical: ms(16), borderRadius: ms(26),
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});