import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useEPlanDraft } from '../src/context/EPlanDraftContext';
import { useWalletBalance } from '../src/hooks/useWalletBalance';
import { planErrorMessage } from '../src/lib/planLimits';
import { AppDialog } from '../src/components/AppDialog';

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

type SuccessPayload = {
  title: string;
  message: string;
  redirect: () => void;
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
  const isEplan = service === 'eplan';
  const isOrder = isEwash || isEchop || isEplan;
  const parsedDraft = useMemo(() => {
    try {
      return JSON.parse(order ?? '{}');
    } catch {
      return {};
    }
  }, [order]);
  const isSubscription = isEwash && parsedDraft.kind === 'subscription';
  const { clear: clearCart } = useCart();
  const { refresh: refreshReferrals } = useReferral();
  const { resetDraft } = useEPlanDraft();
  const { refresh: refreshWallet } = useWalletBalance();

  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);
  const [copied, setCopied] = useState<'account' | 'reference' | null>(null);
  const orderPlacedRef = useRef(false);
  const handledRef = useRef(false);
  const confirmLockedRef = useRef(false);
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
            body: JSON.stringify(
              // E-Plan pays as a plain top-up: the full amount lands in the wallet, then the plan locks from it.
              isOrder && !isEplan
                ? { amount: Number(amount), purpose: isSubscription ? 'ewash' : service }
                : { amount: Number(amount) }
            ),
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

 const createSubscription = async () => {
  if (orderPlacedRef.current) return true;
  orderPlacedRef.current = true;

  let draft: any = {};
  try {
    draft = JSON.parse(order ?? '{}');
  } catch {}

  const planId = String(draft.metadata?.plan_id ?? '').trim();
  const durationMonths = Number(draft.metadata?.duration_months ?? 0);
  const amountKobo = Math.round(Number(amount) * 100);

  if (!planId || !durationMonths) {
    orderPlacedRef.current = false;
    Alert.alert('Subscription failed', 'Plan details are missing. Please try again.');
    return false;
  }

  const { error: rpcError } = await supabase.rpc('activate_plan_direct', {
    p_plan_id: planId,
    p_duration_months: durationMonths,
    p_amount_kobo: amountKobo,
    p_tx_ref: details?.reference ?? null,
  });

  if (rpcError) {
    orderPlacedRef.current = false;
    Alert.alert('Subscription failed', rpcError.message);
    return false;
  }

  return true;
};

  // Activates the E-Plan from the freshly funded wallet. The server decides what is locked, so any
  // surplus (e.g. the extra ₦2,500 on ₦22,500) simply stays in the wallet. Returns the plan id.
  const activateEplan = async (): Promise<string | null> => {
    if (orderPlacedRef.current) return null;
    orderPlacedRef.current = true;

    const d = parsedDraft;
    const call = () =>
      d.fixedKey
        ? supabase.rpc('activate_eplan_fixed', {
            p_plan_key: d.fixedKey,
            p_exclusions: d.exclusions ?? 'None',
            p_delivery_window: d.deliveryWindow ?? '',
          })
        : supabase.rpc('activate_eplan_tiered', {
            p_paid_kobo: Math.round(Number(amount) * 100),
            p_plan_name: 'E-Plan',
            p_duration_days: Number(d.durationDays ?? 7),
            p_exclusions: d.exclusions ?? 'None',
            p_delivery_window: d.deliveryWindow ?? '',
          });

    let result = await call();
    // The wallet credit can land a moment after the payment is marked successful, so retry briefly.
    for (let i = 0; i < 3 && result.error && /insufficient.*balance/i.test(result.error.message); i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      result = await call();
    }

    if (result.error) {
      orderPlacedRef.current = false;
      Alert.alert(
        'E-Plan not activated',
        `${/active_plan_exists/i.test(result.error.message) ? 'You already have an active E-Plan.' : result.error.message}\n\nYour payment was received (ref ${details?.reference}) and the money is in your wallet. You can activate your E-Plan from the E-Plan screen.`
      );
      return null;
    }
    return String(result.data ?? '') || null;
  };

  const placeOrder = async (reference: string) => {
    if (orderPlacedRef.current) return true;
    orderPlacedRef.current = true;

    let draft: any = {};
    try {
      draft = JSON.parse(order ?? '{}');
    } catch {}

    if (isEwash && draft.covered) {
      const coveredLines: { id?: string; name: string; qty: number }[] = draft.lines ?? [];
      const { error: planError } = await supabase.rpc('schedule_plan_pickup', {
        p_items: coveredLines.map((l) => ({ id: l.id, name: l.name, qty: l.qty })),
        p_express: !!draft.express,
        p_pickup_date_id: draft.pickupDateId ?? '',
        p_pickup_time: draft.pickupTime ?? '',
        p_address: draft.pickupAddress ?? '',
        p_notes: draft.notes || null,
        p_tx_ref: reference,
      });
      if (planError) {
        orderPlacedRef.current = false;
        Alert.alert(
          'Pickup not scheduled',
          `${planErrorMessage(planError.message)}\n\nYour payment reference is ${reference}.`
        );
        return false;
      }
      return true;
    }

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
    if (handledRef.current) return;
    handledRef.current = true;

    if (isEplan) {
      const planId = await activateEplan();
      if (!planId) {
        handledRef.current = false;
        setConfirmed(false);
        return;
      }
      tagPayment(reference, 'eplan', 'E-Plan payment');
      refreshWallet();
      resetDraft();
      setSuccess({
        title: 'E-Plan activated',
        message: 'Your payment was received and your E-Plan is now active.',
        redirect: () =>
          router.replace({
            pathname: '/e-plan-success',
            params: { planId, meals: String(parsedDraft.meals ?? '') },
          } as any),
      });
      return;
    }

    if (isSubscription) {
      const ok = await createSubscription();
      if (!ok) {
        handledRef.current = false;
        setConfirmed(false);
        return;
      }
      refreshReferrals();
      const title = String(parsedDraft.metadata?.title ?? 'subscription');
      tagPayment(reference, 'subscription', `Subscription - ${title}`);
      setSuccess({
        title: 'Subscription activated',
        message: `Your payment for the ${title} was received and your plan is now active.`,
        redirect: () => router.replace('/wash' as any),
      });
      return;
    }

    if (isOrder) {
      const placed = await placeOrder(reference);
      if (!placed) {
        handledRef.current = false;
        setConfirmed(false);
        return;
      }

      if (isEchop) {
        let draft: any = {};
        try {
          draft = JSON.parse(order ?? '{}');
        } catch {}
        clearCart();
        refreshReferrals();
        const ref = draft.ref;
        tagPayment(reference, 'echop', `E-Chop order #${ref}`);
        const totalAmt = String(amount);
        const items = String(draft.itemCount ?? '');
        const slot = draft.slot ?? '';
        setSuccess({
          title: 'Order placed',
          message: `Your E-Chop order #${ref} is confirmed and being prepared.`,
          redirect: () => {
            router.replace({
              pathname: '/order-success',
              params: {
                orderId: ref,
                total: totalAmt,
                items,
                slot,
                paymentMethod: 'transfer',
              },
            } as any);
          },
        });
        return;
      }

      tagPayment(reference, 'ewash', parsedDraft.covered ? 'E-Wash plan pickup' : 'E-Wash pay-per-order pickup');
      setSuccess({
        title: 'Pickup scheduled',
        message: 'Your payment has been confirmed and your laundry pickup is scheduled.',
        redirect: () => router.replace('/wash' as any),
      });
      return;
    }

    tagPayment(reference, 'funding', 'Wallet funding');
    setSuccess({
      title: 'Wallet funded',
      message: 'Your payment has been confirmed and your wallet has been updated.',
      redirect: () => router.replace('/wallet' as any),
    });
  };

  // Labels this payment in the Transactions list. Best-effort: never blocks the success flow.
  const tagPayment = async (reference: string, purpose: string, title: string) => {
    try {
      await supabase.rpc('tag_wallet_transaction', {
        p_tx_ref: reference,
        p_purpose: purpose,
        p_title: title,
      });
    } catch {}
  };

  const copy = async (value: string, which: 'account' | 'reference') => {
    try {
      await Clipboard.setStringAsync(value);
      setCopied(which);
      setTimeout(() => setCopied((current) => (current === which ? null : current)), 2000);
    } catch {
      Alert.alert('Could not copy', `Please copy it manually:\n\n${value}`);
    }
  };

  const handleConfirm = async () => {
    if (checking || !details || confirmed || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
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
  const confirmDisabled = checking || confirmLockedRef.current;

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
            <Text style={styles.title}>{isEplan ? 'E-Plan' : isSubscription ? 'Subscription' : isEwash ? 'E-Wash' : isEchop ? 'E-Chop' : 'Fund Wallet'}</Text>
            <Text style={styles.subtitle}>
              Transfer <Text style={styles.subtitleBlue}>exactly {formatNaira(details.amount)}</Text> to the account
              below to {isEplan ? 'pay for your E-Plan' : isSubscription ? 'pay for your subscription' : isEwash ? 'pay for your pickup' : isEchop ? 'pay for your order' : 'fund your wallet'}.
            </Text>
            {isEplan && Number(parsedDraft.surplus) > 0 && (
              <Text style={styles.surplusNote}>
                Your plan locks {formatNaira(Number(parsedDraft.locked))}. The extra{' '}
                {formatNaira(Number(parsedDraft.surplus))} stays in your wallet.
              </Text>
            )}
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
            <Feather name="shield" size={18} color={ui.blue} />
          </View>
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoTitle}>One-time Virtual Account</Text>
            <Text style={styles.infoSubtitle}>
              This account is unique to this payment and can only be used once.
            </Text>
          </View>
          <View style={styles.illustration}>
            <MaterialCommunityIcons name="bank" size={40} color={ui.blue} />
            <View style={styles.illustrationBadge}>
              <MaterialCommunityIcons name="shield-check" size={12} color={ui.green} />
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="bank-outline" size={20} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>BANK</Text>
              <Text style={styles.detailValue}>{details.bankName}</Text>
              <View style={styles.licensedRow}>
                <MaterialCommunityIcons name="shield-check" size={12} color={ui.green} />
                <Text style={styles.licensedText}>Licensed by CBN</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="wallet-outline" size={20} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>ACCOUNT NUMBER</Text>
              <Text style={styles.detailValueLarge}>{formatAccountNumber(details.accountNumber)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, copied === 'account' && styles.copyBtnDone]}
              onPress={() => copy(details.accountNumber.replace(/\s/g, ''), 'account')}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name={copied === 'account' ? 'check' : 'copy'} size={13} color={copied === 'account' ? ui.green : ui.blue} />
              <Text style={[styles.copyBtnText, copied === 'account' && styles.copyBtnTextDone]}>
                {copied === 'account' ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <Feather name="user" size={18} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>ACCOUNT NAME</Text>
              <Text style={styles.detailValue}>{accountName}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.iconTile}>
              <Feather name="file-text" size={18} color={ui.blue} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>REFERENCE</Text>
              <Text style={styles.detailValueSmall}>{details.reference}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, copied === 'reference' && styles.copyBtnDone]}
              onPress={() => copy(details.reference, 'reference')}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name={copied === 'reference' ? 'check' : 'copy'} size={13} color={copied === 'reference' ? ui.green : ui.blue} />
              <Text style={[styles.copyBtnText, copied === 'reference' && styles.copyBtnTextDone]}>
                {copied === 'reference' ? 'Copied' : 'Copy'}
              </Text>
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
          <Feather name="alert-circle" size={24} color={ui.orange} />
          <View style={styles.warningTextBlock}>
            <Text style={styles.warningTitle}>Important</Text>
            <Text style={styles.warningText}>
              Transfer <Text style={styles.warningAmount}>exactly {formatNaira(details.amount)}</Text> to this account.
            </Text>
            <Text style={styles.warningText}>Payments above or below this amount may not be credited.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, confirmDisabled && styles.confirmButtonDisabled]}
          activeOpacity={0.85}
          disabled={confirmDisabled}
          onPress={handleConfirm}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>I've Made the Transfer</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={styles.confirmArrow} />
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
          <Feather name="lock" size={13} color={ui.green} />
          <Text style={styles.securedText}>Secured by Flutterwave</Text>
        </View>
      </ScrollView>

      {success && (
        <AppDialog
          visible
          tone="success"
          title={success.title}
          message={success.message}
          primaryLabel="OK"
          onPrimary={() => {
            const go = success.redirect;
            setSuccess(null);
            go();
          }}
        />
      )}
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
  time: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff', lineHeight: 18 },
  unit: { fontSize: 10, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.7)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 30 },
  errorText: { fontSize: 13, fontFamily: fonts.poppins.medium, color: ui.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: ui.blue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  retryBtnText: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ui.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 22, lineHeight: 28, fontFamily: fonts.poppins.bold, color: ui.textPrimary },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: fonts.poppins.regular,
    color: ui.textSecondary,
    marginTop: 4,
  },
  subtitleBlue: { fontFamily: fonts.poppins.semiBold, color: ui.blue },
  surplusNote: { fontSize: 11.5, lineHeight: 17, fontFamily: fonts.poppins.medium, color: ui.green, marginTop: 6 },

  amountBadge: {
    backgroundColor: ui.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 50,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amountBadgeLabel: { fontSize: 10.5, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  amountBadgeValue: { fontSize: 16, fontFamily: fonts.poppins.bold, color: ui.blue, marginVertical: 2 },
  changeText: { fontSize: 11.5, fontFamily: fonts.poppins.semiBold, color: ui.blue, marginTop: 3 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF3FF',
    borderWidth: 1,
    borderColor: '#E1E8FB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E8FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: 12, fontFamily: fonts.poppins.bold, color: ui.textPrimary, marginBottom: 2 },
  infoSubtitle: { fontSize: 10.5, lineHeight: 15, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  illustration: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  illustrationBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsCard: {
    backgroundColor: ui.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  detailDivider: { height: 1, backgroundColor: ui.border },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ui.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: { flex: 1 },
  detailLabel: {
    fontSize: 10,
    fontFamily: fonts.poppins.medium,
    letterSpacing: 0.6,
    color: ui.textSecondary,
    marginBottom: 2,
  },
  detailValue: { fontSize: 14, fontFamily: fonts.poppins.bold, color: ui.textPrimary },
  detailValueLarge: { fontSize: 16, fontFamily: fonts.poppins.bold, color: ui.textPrimary, letterSpacing: 0.3 },
  detailValueSmall: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: ui.textPrimary },
  licensedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  licensedText: { fontSize: 10.5, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.2,
    borderColor: ui.blue,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyBtnText: { fontSize: 12, fontFamily: fonts.poppins.semiBold, color: ui.blue },
  copyBtnDone: { borderColor: ui.green, backgroundColor: 'rgba(34,163,90,0.08)' },
  copyBtnTextDone: { color: ui.green },

  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: ui.navy,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  expiryTextBlock: { flex: 1 },
  expiryTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: '#fff' },
  expirySubtitle: {
    fontSize: 10.5,
    lineHeight: 15,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ui.warningBg,
    borderWidth: 1,
    borderColor: ui.warningBorder,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  warningTextBlock: { flex: 1 },
  warningTitle: { fontSize: 12, fontFamily: fonts.poppins.bold, color: ui.textPrimary, marginBottom: 2 },
  warningText: { fontSize: 11, lineHeight: 15, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  warningAmount: { fontFamily: fonts.poppins.bold, color: ui.orange },

  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.blue,
    height: 50,
    borderRadius: 14,
  },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmButtonText: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: '#fff' },
  confirmArrow: { position: 'absolute', right: 18 },

  helpLink: { alignItems: 'center', paddingVertical: 14 },
  helpText: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: ui.blue },

  securedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  securedText: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
});