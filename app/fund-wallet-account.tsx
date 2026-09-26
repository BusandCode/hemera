import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';

type AccountDetails = {
  accountNumber: string;
  bankName: string;
  reference: string;
  amount: number;
  expiresInSeconds: number;
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FundWalletAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { amount } = useLocalSearchParams<{ amount: string }>();

  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const idempotencyKeyRef = useRef(`fund-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/fund-wallet`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
              'Idempotency-Key': idempotencyKeyRef.current,
            },
            body: JSON.stringify({ amount: Number(amount) }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to generate account details.');
          return;
        }
        setDetails(data);
        setSecondsLeft(data.expiresInSeconds);
      } catch (e) {
        setError('Network error contacting server.');
      }
    })();
  }, [amount]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft > 0]);

  // Auto-detect payment confirmation via the webhook updating the transaction row —
  // this fires the success modal on its own, with no button click required.
  useEffect(() => {
    if (!details || confirmed) return;

    const channel = supabase
      .channel(`wallet-txn-${details.reference}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `tx_ref=eq.${details.reference}`,
        },
        (payload: any) => {
          if (payload.new?.status === 'success' && !confirmed) {
            setConfirmed(true);
            Alert.alert('Wallet Funded', 'Your payment has been confirmed.', [
              { text: 'OK', onPress: () => router.replace('/wallet' as any) },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [details, confirmed]);

  const copy = async (value: string) => {
    await Clipboard.setStringAsync(value);
  };

  const handleConfirm = async () => {
    if (checking || !details || confirmed) return;
    setChecking(true);
    const { data: txn } = await supabase
      .from('wallet_transactions')
      .select('status')
      .eq('tx_ref', details.reference)
      .single();

    setChecking(false);
    if (txn?.status === 'success') {
      setConfirmed(true);
      Alert.alert('Wallet Funded', 'Your payment has been confirmed.', [
        { text: 'OK', onPress: () => router.replace('/wallet' as any) },
      ]);
    } else {
      Alert.alert(
        'Still Processing',
        "We haven't received your transfer yet. This can take a minute — try again shortly."
      );
    }
  };

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <Feather name="alert-circle" size={32} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!details) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={foodColors.badgeBlue} />
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
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Fund Wallet</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountBadgeLabel}>Amount to pay</Text>
          <Text style={styles.amountBadgeValue}>{formatNaira(details.amount)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Transfer exactly <Text style={styles.subtitleBold}>{formatNaira(details.amount)}</Text> to the account below to fund your wallet.
        </Text>

        <View style={styles.infoCard}>
          <Feather name="shield" size={18} color={foodColors.badgeBlue} />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>One-time Virtual Account</Text>
            <Text style={styles.infoSubtitle}>This account is unique to this payment and can only be used once.</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>BANK</Text>
            <Text style={styles.detailValue}>{details.bankName}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.detailValueLarge}>{details.accountNumber}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={() => copy(details.accountNumber)}>
              <Feather name="copy" size={13} color={foodColors.badgeBlue} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>REFERENCE</Text>
            <Text style={styles.detailValue}>{details.reference}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtnSmall} onPress={() => copy(details.reference)}>
            <Feather name="copy" size={13} color={foodColors.badgeBlue} />
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.expiryBanner}>
          <Text style={styles.expiryClock}>{formatClock(secondsLeft)}</Text>
          <View style={styles.expiryTextBlock}>
            <Text style={styles.expiryTitle}>Account expires in {formatClock(secondsLeft)}</Text>
            <Text style={styles.expirySubtitle}>This account will expire if we don't detect your payment.</Text>
          </View>
        </View>

        <View style={styles.warningBanner}>
          <Feather name="alert-circle" size={16} color="#B8860B" />
          <Text style={styles.warningText}>
            Transfer exactly {formatNaira(details.amount)} to this account. Payments above or below this amount may not be credited.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.confirmButton, checking && styles.confirmButtonDisabled]}
          activeOpacity={0.85}
          disabled={checking}
          onPress={handleConfirm}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>I've Made the Transfer</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 30 },
  errorText: { fontSize: 13.5, fontFamily: fonts.poppins.medium, color: foodColors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: foodColors.badgeBlue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  retryBtnText: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },

  content: { flex: 1, paddingHorizontal: 20 },

  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },
  titleBlock: { flex: 1, marginLeft: 12 },
  title: { fontSize: 22, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  amountBadge: {
    backgroundColor: foodColors.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'flex-end',
  },
  amountBadgeLabel: { fontSize: 9.5, fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  amountBadgeValue: { fontSize: 15, fontFamily: fonts.poppins.bold, color: foodColors.badgeBlue },

  subtitle: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 18, marginBottom: 16 },
  subtitleBold: { fontFamily: fonts.poppins.bold, color: foodColors.badgeBlue },

  infoCard: {
    flexDirection: 'row', gap: 12, backgroundColor: 'rgba(46,90,172,0.06)',
    borderRadius: 16, padding: 14, marginBottom: 16,
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 3 },
  infoSubtitle: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16 },

  detailsCard: {
    backgroundColor: foodColors.surface, borderRadius: 18, paddingHorizontal: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  detailDivider: { height: 1, backgroundColor: foodColors.border },
  detailLabel: { fontSize: 10.5, fontFamily: fonts.poppins.bold, letterSpacing: 0.5, color: foodColors.textMuted, marginBottom: 3 },
  detailValue: { fontSize: 14, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  detailValueLarge: { fontSize: 18, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, letterSpacing: 0.5 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: foodColors.badgeBlue, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
  },
  copyBtnSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end',
    borderWidth: 1, borderColor: foodColors.badgeBlue, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
    marginBottom: 14, marginTop: -8,
  },
  copyBtnText: { fontSize: 11.5, fontFamily: fonts.poppins.bold, color: foodColors.badgeBlue },

  expiryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#0B1020', borderRadius: 16, padding: 16, marginBottom: 14,
  },
  expiryClock: { fontSize: 18, fontFamily: fonts.poppins.bold, color: '#fff' },
  expiryTextBlock: { flex: 1 },
  expiryTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },
  expirySubtitle: { fontSize: 11, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  warningBanner: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#FDF3E3', borderRadius: 14, padding: 14,
  },
  warningText: { flex: 1, fontSize: 11.5, fontFamily: fonts.poppins.regular, color: '#7A5A10', lineHeight: 16 },

  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: foodColors.border },
  confirmButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: foodColors.badgeBlue, paddingVertical: 16, borderRadius: 26,
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});