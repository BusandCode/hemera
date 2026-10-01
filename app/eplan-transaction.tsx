import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';

const ACCENT_BLUE = '#1E3FEA';
const GREEN = '#1E9E55';

type TxnRow = {
  id: string;
  title: string;
  reference: string | null;
  amount: number;
  type: 'debit' | 'credit';
  status: 'pending' | 'success' | 'failed';
  created_at: string;
};

type PlanRow = {
  id: string;
  plan_name: string;
  locked_amount_kobo: number;
  balance_kobo: number;
  status: 'active' | 'cancelled' | 'completed';
  exclusions: string | null;
  delivery_window: string | null;
  created_at: string;
  ends_at: string;
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })} • ${d.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;
}

function isRefund(t: TxnRow) {
  return (t.reference ?? '').startsWith('EPLAN-REFUND-') || t.type === 'credit';
}

export default function EPlanTransactionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [txn, setTxn] = useState<TxnRow | null>(null);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);

    const { data: txnData, error: txnErr } = await supabase
      .from('transactions')
      .select('id, title, reference, amount, type, status, created_at')
      .eq('id', id)
      .eq('service', 'eplan')
      .single();

    if (txnErr || !txnData) {
      setError(true);
      setLoading(false);
      return;
    }

    setTxn(txnData as TxnRow);

    // Try to find the plan this transaction belongs to by matching the
    // reference prefix. Subscriptions: EPLAN-<planid8>
    // Refunds:                          EPLAN-REFUND-<planid8>
    const ref = (txnData.reference ?? '') as string;
    const planIdSnippet = ref
      .replace(/^EPLAN-REFUND-/, '')
      .replace(/^EPLAN-/, '')
      .trim();

    if (planIdSnippet) {
      const { data: planData } = await supabase
        .from('eplan_plans')
        .select(
          'id, plan_name, locked_amount_kobo, balance_kobo, status, exclusions, delivery_window, created_at, ends_at'
        )
        .ilike('id', `${planIdSnippet}%`)
        .maybeSingle();

      setPlan((planData as PlanRow) ?? null);
    }

    setLoading(false);
  }, [id]);

  useState(() => {
    load();
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={ACCENT_BLUE} />
      </View>
    );
  }

  if (error || !txn) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <StatusBar style="dark" />
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={32} color={foodColors.textMuted} />
          <Text style={styles.errorTitle}>Transaction not found</Text>
          <Text style={styles.errorSub}>
            This transaction may have been removed or you don't have access to it.
          </Text>
          <TouchableOpacity
            style={styles.errorBtn}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const refund = isRefund(txn);
  const accent = refund ? GREEN : ACCENT_BLUE;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction</Text>
        <View style={styles.titleSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          <View
            style={[
              styles.heroIconWrap,
              { backgroundColor: refund ? 'rgba(30,158,85,0.10)' : 'rgba(30,63,234,0.08)' },
            ]}
          >
            <Feather
              name={refund ? 'rotate-ccw' : 'gift'}
              size={28}
              color={accent}
            />
          </View>

          <Text style={[styles.heroAmount, { color: accent }]}>
            {refund ? '+' : '-'}
            {formatNaira(txn.amount)}
          </Text>

          <Text style={styles.heroTitle}>{txn.title}</Text>

          <View
            style={[
              styles.statusPill,
              txn.status === 'success' && styles.statusSuccess,
              txn.status === 'pending' && styles.statusPending,
              txn.status === 'failed' && styles.statusFailed,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                txn.status === 'success' && styles.statusDotSuccess,
                txn.status === 'pending' && styles.statusDotPending,
                txn.status === 'failed' && styles.statusDotFailed,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                txn.status === 'success' && styles.statusTextSuccess,
                txn.status === 'pending' && styles.statusTextPending,
                txn.status === 'failed' && styles.statusTextFailed,
              ]}
            >
              {txn.status === 'success'
                ? 'Successful'
                : txn.status === 'pending'
                ? 'Pending'
                : 'Failed'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <Text style={styles.sectionLabel}>TRANSACTION DETAILS</Text>
        <View style={styles.detailCard}>
          <DetailRow
            icon="hash"
            label="Type"
            value={refund ? 'E-Plan Refund' : 'E-Plan Subscription'}
          />
          <View style={styles.divider} />
          <DetailRow
            icon="file-text"
            label="Reference"
            value={txn.reference ?? '—'}
            mono
          />
          <View style={styles.divider} />
          <DetailRow
            icon="calendar"
            label="Date & Time"
            value={formatDateTime(txn.created_at)}
          />
          <View style={styles.divider} />
          <DetailRow
            icon="credit-card"
            label="Payment Method"
            value="Hemera Wallet"
          />
        </View>

        {/* Linked plan */}
        {plan && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionSpacing]}>
              LINKED PLAN
            </Text>
            <TouchableOpacity
              style={styles.planCard}
              activeOpacity={0.85}
              onPress={() => router.push('/my-plan' as any)}
            >
              <View style={styles.planIconWrap}>
                <Feather name="gift" size={20} color="#fff" />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.plan_name}</Text>
                <Text style={styles.planSub}>
                  {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)} •{' '}
                  Locked {formatNaira(Math.round(plan.locked_amount_kobo / 100))}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* Help */}
        <TouchableOpacity
          style={styles.helpCard}
          activeOpacity={0.85}
          onPress={() => router.push('/contact-support' as any)}
        >
          <Feather name="help-circle" size={18} color={ACCENT_BLUE} />
          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>Something wrong with this payment?</Text>
            <Text style={styles.helpSub}>Contact support and we'll look into it.</Text>
          </View>
          <Feather name="arrow-right" size={16} color={ACCENT_BLUE} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Feather name={icon} size={14} color={ACCENT_BLUE} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, mono && styles.detailValueMono]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 22 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  titleSpacer: { width: 38 },

  heroWrap: { alignItems: 'center', marginTop: 12, marginBottom: 30 },
  heroIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroAmount: {
    fontSize: 30,
    fontFamily: fonts.poppins.bold,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusSuccess: { backgroundColor: 'rgba(30,158,85,0.10)' },
  statusPending: { backgroundColor: 'rgba(245,165,36,0.14)' },
  statusFailed: { backgroundColor: 'rgba(255,59,48,0.10)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotSuccess: { backgroundColor: GREEN },
  statusDotPending: { backgroundColor: '#D98A00' },
  statusDotFailed: { backgroundColor: '#FF3B30' },
  statusText: { fontSize: 11.5, fontFamily: fonts.poppins.bold },
  statusTextSuccess: { color: GREEN },
  statusTextPending: { color: '#D98A00' },
  statusTextFailed: { color: '#FF3B30' },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sectionSpacing: { marginTop: 24 },

  detailCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  detailIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(30,63,234,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  detailValueMono: {
    fontFamily: fonts.poppins.medium,
    letterSpacing: 0.3,
  },
  divider: { height: 1, backgroundColor: foodColors.border },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  planIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ACCENT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: { flex: 1, minWidth: 0 },
  planName: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  planSub: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },

  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30,63,234,0.06)',
    borderRadius: 16,
    padding: 14,
    marginTop: 26,
  },
  helpText: { flex: 1, minWidth: 0 },
  helpTitle: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  helpSub: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },

  errorTitle: {
    fontSize: 15,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: 8,
  },
  errorSub: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBtn: {
    backgroundColor: ACCENT_BLUE,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 12,
  },
  errorBtnText: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});