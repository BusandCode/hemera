import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { useProfile } from '../src/context/ProfileContext';

const ui = {
  background: '#F7F8FC',
  surface: '#FFFFFF',
  border: '#EEF0F6',
  blue: '#1B3BD8',
  blueSoft: '#EEF2FF',
  navy: '#001040',
  arc: '#2F5BFF',
  textPrimary: '#0B1020',
  textSecondary: '#6B7185',
  textMuted: '#8A90A2',
  green: '#22A35A',
  orange: '#F59E0B',
  warningBg: '#FFF6EE',
  warningBorder: '#FCE7D2',
};

const RING = 76;
const RING_STROKE = 4;

type AccountDetails = {
  accountNumber: string;
  accountName?: string;
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

function formatAccountNumber(value: string) {
  return value.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
}

function ExpiryRing({ fraction, label }: { fraction: number; label: string }) {
  const angle = Math.min(1, Math.max(0, fraction)) * 360;
  const rightRotation = Math.min(angle, 180) - 135;
  const leftRotation = angle > 180 ? angle - 135 : 45;

  return (
    <View style={ringStyles.wrap}>
      <View style={ringStyles.track} />
      <View style={ringStyles.rightClip}>
        <View style={[ringStyles.arc, { left: -RING / 2, transform: [{ rotate: `${rightRotation}deg` }] }]} />
      </View>
      <View style={ringStyles.leftClip}>
        <View style={[ringStyles.arc, { left: 0, transform: [{ rotate: `${leftRotation}deg` }] }]} />
      </View>
      <View style={ringStyles.center}>
        <Text style={ringStyles.time}>{label}</Text>
        <Text style={ringStyles.unit}>mins</Text>
      </View>
    </View>
  );
}

export default function FundWalletAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
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
        <ActivityIndicator size="large" color={ui.blue} />
      </View>
    );
  }

  const nameParts = profile.fullName.trim().split(/\s+/).filter(Boolean);
  const derivedName = nameParts.length
    ? `Hemera • ${nameParts[0]}${nameParts.length > 1 ? ` ${nameParts[nameParts.length - 1][0].toUpperCase()}.` : ''}`
    : 'Hemera';
  const accountName = details.accountName ?? derivedName;
  const fraction = details.expiresInSeconds > 0 ? secondsLeft / details.expiresInSeconds : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Feather name="arrow-left" size={18} color={ui.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Fund Wallet</Text>
            <Text style={styles.subtitle}>
              Transfer <Text style={styles.subtitleBlue}>exactly {formatNaira(details.amount)}</Text> to the account
              below to fund your wallet.
            </Text>
          </View>

          <View style={styles.amountBadge}>
            <Text style={styles.amountBadgeLabel}>Amount to pay</Text>
            <Text style={styles.amountBadgeValue}>{formatNaira(details.amount)}</Text>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <Feather name="shield" size={20} color={ui.blue} />
          </View>
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>One-time Virtual Account</Text>
            <Text style={styles.infoSubtitle}>
              This account is unique to this payment and can only be used once.
            </Text>
          </View>
          <View style={styles.illustration}>
            <MaterialCommunityIcons name="bank" size={46} color={ui.blue} />
            <View style={styles.illustrationBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color={ui.green} />
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="bank-outline" size={22} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>BANK</Text>
              <Text style={styles.detailValue}>{details.bankName}</Text>
              <View style={styles.licensedRow}>
                <MaterialCommunityIcons name="shield-check" size={13} color={ui.green} />
                <Text style={styles.licensedText}>Licensed by CBN</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="wallet-outline" size={22} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.detailValueLarge}>{formatAccountNumber(details.accountNumber)}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => copy(details.accountNumber)}
              activeOpacity={0.8}
            >
              <Feather name="copy" size={14} color={ui.blue} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <Feather name="user" size={20} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>ACCOUNT NAME</Text>
              <Text style={styles.detailValue}>{accountName}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <Feather name="file-text" size={20} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>REFERENCE</Text>
              <Text style={styles.detailValueSmall}>{details.reference}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => copy(details.reference)}
              activeOpacity={0.8}
            >
              <Feather name="copy" size={14} color={ui.blue} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.expiryBanner}>
          <ExpiryRing fraction={fraction} label={formatClock(secondsLeft)} />
          <View style={styles.expiryTextBlock}>
            <Text style={styles.expiryTitle}>Account expires in {formatClock(secondsLeft)}</Text>
            <Text style={styles.expirySubtitle}>
              This account will expire if we don't detect your payment.
            </Text>
          </View>
        </View>

        <View style={styles.warningBanner}>
          <Feather name="alert-circle" size={28} color={ui.orange} />
          <View style={styles.warningTextBlock}>
            <Text style={styles.warningTitle}>Important</Text>
            <Text style={styles.warningText}>
              Transfer <Text style={styles.warningAmount}>exactly {formatNaira(details.amount)}</Text> to this account.
            </Text>
            <Text style={styles.warningText}>Payments above or below this amount may not be credited.</Text>
          </View>
        </View>

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
              <Feather name="arrow-right" size={20} color="#fff" style={styles.confirmArrow} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpLink}
          onPress={() => router.push('/contact-support' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.helpText}>Need Help?</Text>
        </TouchableOpacity>

        <View style={styles.securedRow}>
          <Feather name="lock" size={14} color={ui.green} />
          <Text style={styles.securedText}>Secured by Flutterwave</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: { width: RING, height: RING },
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: RING_STROKE,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  rightClip: {
    position: 'absolute',
    top: 0,
    left: RING / 2,
    width: RING / 2,
    height: RING,
    overflow: 'hidden',
  },
  leftClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RING / 2,
    height: RING,
    overflow: 'hidden',
  },
  arc: {
    position: 'absolute',
    top: 0,
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: RING_STROKE,
    borderColor: 'transparent',
    borderTopColor: ui.arc,
    borderRightColor: ui.arc,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { fontSize: 16, fontFamily: fonts.poppins.bold, color: '#fff', lineHeight: 20 },
  unit: { fontSize: 10.5, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.7)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 30 },
  errorText: { fontSize: 13.5, fontFamily: fonts.poppins.medium, color: ui.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: ui.blue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  retryBtnText: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  headerLeft: { flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ui.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 30, lineHeight: 38, fontFamily: fonts.poppins.bold, color: ui.textPrimary },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.poppins.regular,
    color: ui.textSecondary,
    marginTop: 4,
  },
  subtitleBlue: { fontFamily: fonts.poppins.semiBold, color: ui.blue },

  amountBadge: {
    backgroundColor: ui.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 54,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amountBadgeLabel: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  amountBadgeValue: { fontSize: 20, fontFamily: fonts.poppins.bold, color: ui.blue, marginVertical: 2 },
  changeText: { fontSize: 12.5, fontFamily: fonts.poppins.semiBold, color: ui.blue, marginTop: 4 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF3FF',
    borderWidth: 1,
    borderColor: '#E1E8FB',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E1E8FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: ui.textPrimary, marginBottom: 3 },
  infoSubtitle: { fontSize: 11.5, lineHeight: 17, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  illustration: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  illustrationBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsCard: {
    backgroundColor: ui.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  detailDivider: { height: 1, backgroundColor: ui.border },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ui.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.medium,
    letterSpacing: 0.6,
    color: ui.textSecondary,
    marginBottom: 2,
  },
  detailValue: { fontSize: 16, fontFamily: fonts.poppins.bold, color: ui.textPrimary },
  detailValueLarge: { fontSize: 24, fontFamily: fonts.poppins.bold, color: ui.textPrimary, letterSpacing: 0.5 },
  detailValueSmall: { fontSize: 14.5, fontFamily: fonts.poppins.semiBold, color: ui.textPrimary },
  licensedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  licensedText: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderColor: ui.blue,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  copyBtnText: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: ui.blue },

  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: ui.navy,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  expiryTextBlock: { flex: 1 },
  expiryTitle: { fontSize: 14.5, fontFamily: fonts.poppins.bold, color: '#fff' },
  expirySubtitle: {
    fontSize: 11.5,
    lineHeight: 18,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: ui.warningBg,
    borderWidth: 1,
    borderColor: ui.warningBorder,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  warningTextBlock: { flex: 1 },
  warningTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: ui.textPrimary, marginBottom: 2 },
  warningText: { fontSize: 12, lineHeight: 18, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  warningAmount: { fontFamily: fonts.poppins.bold, color: ui.orange },

  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.blue,
    height: 58,
    borderRadius: 16,
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { fontSize: 16, fontFamily: fonts.poppins.semiBold, color: '#fff' },
  confirmArrow: { position: 'absolute', right: 20 },

  helpLink: { alignItems: 'center', paddingVertical: 16 },
  helpText: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: ui.blue },

  securedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  securedText: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
});