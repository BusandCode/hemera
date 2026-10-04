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
import { useCart } from '../src/context/CartContext';
import { useReferral } from '../src/context/ReferralContext';
import { ms } from '../src/utils/responsive';

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
  const { amount, service, order } = useLocalSearchParams<{
    amount: string;
    service?: string;
    order?: string;
  }>();
  const isEwash = service === 'ewash';
  const isEchop = service === 'echop';
  const isOrder = isEwash || isEchop;
  const { clear: clearCart } = useCart();
  const { refresh: refreshReferrals } = useReferral();

  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const orderPlacedRef = useRef(false);
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
            body: JSON.stringify(isOrder ? { amount: Number(amount), purpose: service } : { amount: Number(amount) }),
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
            handlePaid(details.reference);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [details, confirmed]);

  const placeOrder = async (reference: string) => {
    if (orderPlacedRef.current) return true;
    orderPlacedRef.current = true;

    let draft: any = {};
    try {
      draft = JSON.parse(order ?? '{}');
    } catch {}

    const { data: { session } } = await supabase.auth.getSession();
    const total = Number(amount);

    const row = isEchop
      ? {
          user_id: session?.user.id,
          order_type: 'echop',
          status: 'placed',
          total_kobo: total * 100,
          metadata: { ...(draft.metadata ?? {}), payment_method: 'transfer', tx_ref: reference },
        }
      : (() => {
          const lines: { name: string; qty: number; price: number }[] = draft.lines ?? [];
          const count = lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
          return {
            user_id: session?.user.id,
            order_type: 'ewash',
            status: 'scheduled',
            total_kobo: total * 100,
            metadata: {
              ref: `WSH-${Math.floor(100000 + Math.random() * 900000)}`,
              title: 'E-Wash Pickup',
              customer_email: session?.user.email ?? '',
              total,
              subtotal: draft.subtotal ?? 0,
              items: count,
              lines,
              express: !!draft.express,
              slot: draft.pickupTime ?? '',
              pickup_date: draft.pickupDateId ?? '',
              address: draft.pickupAddress ?? '',
              payment_method: 'transfer',
              tx_ref: reference,
            },
          };
        })();

    const { error: insertError } = await supabase.from('orders').insert(row);

    if (insertError) {
      orderPlacedRef.current = false;
      Alert.alert('Order failed', insertError.message);
      return false;
    }
    return true;
  };

  const handlePaid = async (reference: string) => {
    if (isOrder) {
      const placed = await placeOrder(reference);
      if (!placed) return;

      if (isEchop) {
        let draft: any = {};
        try {
          draft = JSON.parse(order ?? '{}');
        } catch {}
        clearCart();
        refreshReferrals();
        router.replace({
          pathname: '/order-success',
          params: {
            orderId: draft.ref,
            total: String(amount),
            items: String(draft.itemCount ?? ''),
            slot: draft.slot ?? '',
            paymentMethod: 'transfer',
          },
        } as any);
        return;
      }

      Alert.alert('Payment Received', 'Your pickup has been scheduled.', [
        { text: 'OK', onPress: () => router.replace('/order' as any) },
      ]);
      return;
    }
    Alert.alert('Wallet Funded', 'Your payment has been confirmed.', [
      { text: 'OK', onPress: () => router.replace('/wallet' as any) },
    ]);
  };

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
      handlePaid(details.reference);
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
        <Feather name="alert-circle" size={ms(32)} color="#FF3B30" />
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
              <Feather name="arrow-left" size={ms(18)} color={ui.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>{isEwash ? 'E-Wash' : isEchop ? 'E-Chop' : 'Fund Wallet'}</Text>
            <Text style={styles.subtitle}>
              Transfer <Text style={styles.subtitleBlue}>exactly {formatNaira(details.amount)}</Text> to the account
              below to {isEwash ? 'pay for your pickup' : isEchop ? 'pay for your order' : 'fund your wallet'}.
            </Text>
          </View>

          {!isOrder && (
            <View style={styles.amountBadge}>
              <Text style={styles.amountBadgeLabel}>Amount to pay</Text>
              <Text style={styles.amountBadgeValue}>{formatNaira(details.amount)}</Text>
              <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <Feather name="shield" size={ms(20)} color={ui.blue} />
          </View>
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>One-time Virtual Account</Text>
            <Text style={styles.infoSubtitle}>
              This account is unique to this payment and can only be used once.
            </Text>
          </View>
          <View style={styles.illustration}>
            <MaterialCommunityIcons name="bank" size={ms(46)} color={ui.blue} />
            <View style={styles.illustrationBadge}>
              <MaterialCommunityIcons name="shield-check" size={ms(14)} color={ui.green} />
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="bank-outline" size={ms(22)} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>BANK</Text>
              <Text style={styles.detailValue}>{details.bankName}</Text>
              <View style={styles.licensedRow}>
                <MaterialCommunityIcons name="shield-check" size={ms(13)} color={ui.green} />
                <Text style={styles.licensedText}>Licensed by CBN</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="wallet-outline" size={ms(22)} color={ui.blue} />
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
              <Feather name="copy" size={ms(14)} color={ui.blue} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <Feather name="user" size={ms(20)} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>ACCOUNT NAME</Text>
              <Text style={styles.detailValue}>{accountName}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <Feather name="file-text" size={ms(20)} color={ui.blue} />
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
              <Feather name="copy" size={ms(14)} color={ui.blue} />
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
          <Feather name="alert-circle" size={ms(28)} color={ui.orange} />
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
              <Feather name="arrow-right" size={ms(20)} color="#fff" style={styles.confirmArrow} />
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
          <Feather name="lock" size={ms(14)} color={ui.green} />
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
  centered: { justifyContent: 'center', alignItems: 'center', gap: ms(14), paddingHorizontal: ms(30) },
  errorText: { fontSize: ms(13.5), fontFamily: fonts.poppins.medium, color: ui.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: ui.blue, paddingHorizontal: ms(20), paddingVertical: ms(12), borderRadius: ms(20) },
  retryBtnText: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: '#fff' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingTop: ms(4) },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ms(12),
    marginBottom: ms(18),
  },
  headerLeft: { flex: 1 },
  backBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: ui.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(14),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: ms(30), lineHeight: ms(38), fontFamily: fonts.poppins.bold, color: ui.textPrimary },
  subtitle: {
    fontSize: ms(13),
    lineHeight: ms(20),
    fontFamily: fonts.poppins.regular,
    color: ui.textSecondary,
    marginTop: ms(4),
  },
  subtitleBlue: { fontFamily: fonts.poppins.semiBold, color: ui.blue },

  amountBadge: {
    backgroundColor: ui.surface,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
    alignItems: 'center',
    marginTop: ms(54),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amountBadgeLabel: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  amountBadgeValue: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: ui.blue, marginVertical: ms(2) },
  changeText: { fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold, color: ui.blue, marginTop: ms(4) },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: '#EFF3FF',
    borderWidth: 1,
    borderColor: '#E1E8FB',
    borderRadius: ms(18),
    padding: ms(14),
    marginBottom: ms(14),
  },
  infoIconCircle: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: '#E1E8FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: ms(13.5), fontFamily: fonts.poppins.bold, color: ui.textPrimary, marginBottom: ms(3) },
  infoSubtitle: { fontSize: ms(11.5), lineHeight: ms(17), fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  illustration: { width: ms(56), height: ms(56), alignItems: 'center', justifyContent: 'center' },
  illustrationBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsCard: {
    backgroundColor: ui.surface,
    borderRadius: ms(20),
    paddingHorizontal: ms(16),
    marginBottom: ms(14),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: ms(14), paddingVertical: ms(16) },
  detailDivider: { height: 1, backgroundColor: ui.border },
  iconTile: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(14),
    backgroundColor: ui.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { flex: 1 },
  detailLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.medium,
    letterSpacing: 0.6,
    color: ui.textSecondary,
    marginBottom: ms(2),
  },
  detailValue: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: ui.textPrimary },
  detailValueLarge: { fontSize: ms(24), fontFamily: fonts.poppins.bold, color: ui.textPrimary, letterSpacing: 0.5 },
  detailValueSmall: { fontSize: ms(14.5), fontFamily: fonts.poppins.semiBold, color: ui.textPrimary },
  licensedRow: { flexDirection: 'row', alignItems: 'center', gap: ms(5), marginTop: ms(4) },
  licensedText: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    borderWidth: 1.2,
    borderColor: ui.blue,
    borderRadius: ms(12),
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
  },
  copyBtnText: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: ui.blue },

  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(16),
    backgroundColor: ui.navy,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    paddingVertical: ms(16),
    marginBottom: ms(14),
  },
  expiryTextBlock: { flex: 1 },
  expiryTitle: { fontSize: ms(14.5), fontFamily: fonts.poppins.bold, color: '#fff' },
  expirySubtitle: {
    fontSize: ms(11.5),
    lineHeight: ms(18),
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: ms(4),
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
    backgroundColor: ui.warningBg,
    borderWidth: 1,
    borderColor: ui.warningBorder,
    borderRadius: ms(18),
    padding: ms(16),
    marginBottom: ms(16),
  },
  warningTextBlock: { flex: 1 },
  warningTitle: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: ui.textPrimary, marginBottom: ms(2) },
  warningText: { fontSize: ms(12), lineHeight: ms(18), fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  warningAmount: { fontFamily: fonts.poppins.bold, color: ui.orange },

  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.blue,
    height: ms(58),
    borderRadius: ms(16),
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { fontSize: ms(16), fontFamily: fonts.poppins.semiBold, color: '#fff' },
  confirmArrow: { position: 'absolute', right: 20 },

  helpLink: { alignItems: 'center', paddingVertical: ms(16) },
  helpText: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: ui.blue },

  securedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(8) },
  securedText: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: ui.textSecondary },
});