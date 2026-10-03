import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabs } from '../src/components/eplan/BottomTabs';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useAuth } from '../src/context/AuthContext';
import { useWalletBalance } from '../src/hooks/useWalletBalance';
import { supabase } from '../src/lib/supabase';

const WALLET_BLUE = '#0032C1';
const ACCENT_BLUE = '#1E3FEA';

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
  created_at: string;
  ends_at: string;
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isRefund(t: TxnRow) {
  return (t.reference ?? '').startsWith('EPLAN-REFUND-') || t.type === 'credit';
}

export default function PaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { balanceNaira } = useWalletBalance();
  const userId = session?.user.id;

  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [activePlan, setActivePlan] = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: txnsData }, { data: planData }] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, title, reference, amount, type, status, created_at')
        .eq('user_id', userId)
        .eq('service', 'eplan')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('eplan_plans')
        .select(
          'id, plan_name, locked_amount_kobo, balance_kobo, status, created_at, ends_at'
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle(),
    ]);

    setTxns((txnsData ?? []) as TxnRow[]);
    setActivePlan(planData);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalSubscribed = txns
    .filter((t) => !isRefund(t) && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunded = txns
    .filter((t) => isRefund(t) && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>
          Every E-Plan subscription and refund,{'\n'}plus your wallet balance.
        </Text>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
          <Text style={styles.balanceValue}>{formatNaira(balanceNaira)}</Text>
          <Text style={styles.balanceHint}>
            Used to fund E-Plan and settle subscriptions.
          </Text>

          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.balanceBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/fund-wallet-amount' as any)}
            >
              <Feather name="plus" size={14} color={WALLET_BLUE} />
              <Text style={styles.balanceBtnText}>Fund Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.balanceBtn, styles.balanceBtnRight]}
              activeOpacity={0.85}
              onPress={() => router.push('/request-withdrawal' as any)}
            >
              <Feather name="arrow-up" size={14} color={WALLET_BLUE} />
              <Text style={styles.balanceBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(30,63,234,0.08)' }]}>
              <Feather name="gift" size={16} color={ACCENT_BLUE} />
            </View>
            <Text style={styles.statValue}>{formatNaira(totalSubscribed)}</Text>
            <Text style={styles.statLabel}>Total subscribed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(30,158,85,0.10)' }]}>
              <Feather name="rotate-ccw" size={16} color="#1E9E55" />
            </View>
            <Text style={styles.statValue}>{formatNaira(totalRefunded)}</Text>
            <Text style={styles.statLabel}>Total refunded</Text>
          </View>
        </View>

        {/* Active plan summary */}
        {activePlan && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ACTIVE E-PLAN</Text>
              <TouchableOpacity onPress={() => router.push('/my-plan' as any)}>
                <Text style={styles.sectionAction}>View</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.planCard}
              activeOpacity={0.85}
              onPress={() => router.push('/my-plan' as any)}
            >
              <View style={styles.planIconWrap}>
                <Feather name="gift" size={20} color="#fff" />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{activePlan.plan_name}</Text>
                <Text style={styles.planSub}>
                  Locked {formatNaira(Math.round(activePlan.locked_amount_kobo / 100))} •{' '}
                  ends {formatDate(activePlan.ends_at)}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* E-Plan transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>E-PLAN TRANSACTIONS</Text>
          <Text style={styles.sectionCount}>
            {txns.length} {txns.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={ACCENT_BLUE} style={{ marginVertical: 20 }} />
        ) : txns.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="inbox" size={22} color={ACCENT_BLUE} />
            </View>
            <Text style={styles.emptyTitle}>No E-Plan payments yet</Text>
            <Text style={styles.emptySub}>
              Subscribe to E-Plan and your payments will show up here.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/e-plan' as any)}
            >
              <Text style={styles.emptyBtnText}>Explore E-Plan</Text>
              <Feather name="arrow-right" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.txnList}>
            {txns.map((t) => {
              const refund = isRefund(t);
              const failed = t.status === 'failed';
              const pending = t.status === 'pending';
              return (
                <TouchableOpacity
                  key={t.id}
                  style={styles.txnRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/eplan-transaction',
                      params: { id: t.id },
                    } as any)
                  }
                >
                  <View
                    style={[
                      styles.txnIconWrap,
                      refund
                        ? { backgroundColor: 'rgba(30,158,85,0.10)' }
                        : { backgroundColor: 'rgba(30,63,234,0.08)' },
                    ]}
                  >
                    <Feather
                      name={refund ? 'rotate-ccw' : 'gift'}
                      size={16}
                      color={refund ? '#1E9E55' : ACCENT_BLUE}
                    />
                  </View>

                  <View style={styles.txnInfo}>
                    <Text style={styles.txnTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={styles.txnSub} numberOfLines={1}>
                      {formatDate(t.created_at)} • {formatTime(t.created_at)}
                    </Text>
                    {t.reference && (
                      <Text style={styles.txnRef} numberOfLines={1}>
                        Ref: {t.reference}
                      </Text>
                    )}
                  </View>

                  <View style={styles.txnRight}>
                    <Text
                      style={[
                        styles.txnAmount,
                        refund && !failed && styles.txnAmountCredit,
                        failed && styles.txnAmountMuted,
                      ]}
                    >
                      {refund ? '+' : '-'}
                      {formatNaira(t.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        t.status === 'success' && styles.statusSuccess,
                        pending && styles.statusPending,
                        failed && styles.statusFailed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          t.status === 'success' && styles.statusTextSuccess,
                          pending && styles.statusTextPending,
                          failed && styles.statusTextFailed,
                        ]}
                      >
                        {t.status === 'success'
                          ? 'Successful'
                          : pending
                          ? 'Pending'
                          : 'Failed'}
                      </Text>
                    </View>
                  </View>

                  <Feather
                    name="chevron-right"
                    size={16}
                    color={foodColors.textMuted}
                    style={styles.txnChevron}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22 },

  title: {
    fontSize: 28,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: 6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },

  balanceCard: {
    backgroundColor: WALLET_BLUE,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: WALLET_BLUE,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 10.5,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  balanceValue: {
    fontSize: 34,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: 8,
  },
  balanceHint: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  balanceBtnRight: {
    // No extra styles needed – it's just the second item in a space-between row
  },
  balanceBtnText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: WALLET_BLUE,
  },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  txnChevron: {
    marginLeft: 4,
  },
  statValue: {
    fontSize: 15,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
  },
  sectionAction: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: ACCENT_BLUE,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
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

  txnList: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  txnIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnInfo: { flex: 1, minWidth: 0 },
  txnTitle: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  txnSub: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },
  txnRef: {
    fontSize: 10,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: 2,
  },
  txnRight: { alignItems: 'flex-end', gap: 5 },
  txnAmount: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  txnAmountCredit: { color: '#1E9E55' },
  txnAmountMuted: {
    color: foodColors.textMuted,
    textDecorationLine: 'line-through',
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusSuccess: { backgroundColor: 'rgba(30,158,85,0.10)' },
  statusPending: { backgroundColor: 'rgba(245,165,36,0.14)' },
  statusFailed: { backgroundColor: 'rgba(255,59,48,0.10)' },
  statusText: { fontSize: 10, fontFamily: fonts.poppins.bold },
  statusTextSuccess: { color: '#1E9E55' },
  statusTextPending: { color: '#D98A00' },
  statusTextFailed: { color: '#FF3B30' },

  emptyCard: {
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 26,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30,63,234,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT_BLUE,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  emptyBtnText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});