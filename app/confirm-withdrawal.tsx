import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';

const WALLET_BLUE = '#0032C1';

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function maskAccount(num: string) {
  return `•••• ${num.slice(-4)}`;
}

export default function ConfirmWithdrawalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { amount, bankAccountId } = useLocalSearchParams<{ amount: string; bankAccountId: string }>();
  const numericAmount = Number(amount);

  const [bankAccount, setBankAccount] = useState<{ bank_name: string; account_name: string; account_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useState(() => {
    (async () => {
      const { data } = await supabase
        .from('bank_accounts')
        .select('bank_name, account_name, account_number')
        .eq('id', bankAccountId)
        .single();
      setBankAccount(data);
      setLoading(false);
    })();
  });

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    const { data: requestId, error: rpcError } = await supabase.rpc('request_withdrawal', {
      p_amount_kobo: numericAmount * 100,
      p_bank_account_id: bankAccountId,
    });

    if (rpcError) {
      setSubmitting(false);
      Alert.alert(
        'Error',
        rpcError.message.includes('insufficient_balance')
          ? 'Insufficient wallet balance.'
          : 'Could not create withdrawal request. Please try again.'
      );
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-withdrawal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ requestId }),
      }
    );

    setSubmitting(false);
    const data = await res.json();

    if (!res.ok) {
      Alert.alert('Withdrawal Failed', data.error ?? 'Something went wrong. Your balance has been refunded.', [
        { text: 'OK', onPress: () => router.replace('/wallet' as any) },
      ]);
      return;
    }

    Alert.alert('Withdrawal Requested', 'Your withdrawal is being processed and should arrive within 24 hours.', [
      { text: 'OK', onPress: () => router.replace('/wallet' as any) },
    ]);
  };

  if (loading || !bankAccount) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={WALLET_BLUE} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Confirm Withdrawal</Text>
        <Text style={styles.subtitle}>Please review your withdrawal details before confirming.</Text>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>WITHDRAWAL DETAILS</Text>

          <DetailRow icon="credit-card" label="Amount" value={formatNaira(numericAmount)} bold />
          <View style={styles.divider} />
          <DetailRow icon="tag" label="Withdrawal Fee" value="Free" valueColor={foodColors.success} />
          <View style={styles.divider} />
          <DetailRow icon="credit-card" label="You will receive" value={formatNaira(numericAmount)} bold valueColor={WALLET_BLUE} />

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>PAYOUT TO</Text>
          <DetailRow icon="home" label="Bank" value={bankAccount.bank_name} />
          <View style={styles.divider} />
          <DetailRow icon="user" label="Account Name" value={bankAccount.account_name} />
          <View style={styles.divider} />
          <DetailRow icon="credit-card" label="Account Number" value={maskAccount(bankAccount.account_number)} />
        </View>

        <View style={styles.infoCard}>
          <Feather name="info" size={18} color={WALLET_BLUE} />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>Processing Time</Text>
            <Text style={styles.infoSubtitle}>Your withdrawal request is usually processed within 24 hours on business days.</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          activeOpacity={0.85}
          disabled={submitting}
          onPress={handleConfirm}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
        <View style={styles.secureRow}>
          <Feather name="lock" size={12} color={foodColors.success} />
          <Text style={styles.secureText}>Your money is secure with bank-level encryption</Text>
        </View>
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  bold = false,
  valueColor,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Feather name={icon} size={15} color={WALLET_BLUE} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, bold && styles.detailValueBold, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 20 },

  titleRow: { paddingHorizontal: 20, marginBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },

  title: { fontSize: 28, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: 10, marginBottom: 6 },
  subtitle: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 18, marginBottom: 20 },

  detailsCard: {
    backgroundColor: foodColors.surface, borderRadius: 18, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  sectionLabel: { fontSize: 11, fontFamily: fonts.poppins.bold, letterSpacing: 0.6, color: WALLET_BLUE, marginBottom: 10 },
  sectionSpacing: { marginTop: 20 },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  detailIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(0,50,193,0.08)', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { flex: 1, fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  detailValue: { fontSize: 13.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  detailValueBold: { fontSize: 15, fontFamily: fonts.poppins.bold },
  divider: { height: 1, backgroundColor: foodColors.border },

  infoCard: {
    flexDirection: 'row', gap: 12, backgroundColor: 'rgba(0,50,193,0.06)',
    borderRadius: 16, padding: 14,
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 3 },
  infoSubtitle: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16 },

  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: foodColors.border },
  confirmButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0B1020', paddingVertical: 16, borderRadius: 26,
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
  secureRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
  secureText: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
});