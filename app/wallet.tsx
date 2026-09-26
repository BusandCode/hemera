import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';

const WALLET_BLUE = '#0032C1';

type TxnRow = {
  id: string;
  amount_kobo: number;
  type: 'credit' | 'debit';
  tx_ref: string | null;
  status: string;
  created_at: string;
};

type ActivityKind = 'funded' | 'locked' | 'refund' | 'withdrawal' | 'other';

function classify(t: TxnRow): ActivityKind {
  const ref = t.tx_ref ?? '';
  if (ref.startsWith('EPLAN-REFUND-')) return 'refund';
  if (ref.startsWith('EPLAN-')) return 'locked';
  if (ref.startsWith('WD-')) return 'withdrawal';
  if (t.type === 'credit') return 'funded';
  return 'other';
}

type KindMeta = {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  amountColor: string;
  sign: string;
};

function getKindMeta(kind: ActivityKind): KindMeta {
  switch (kind) {
    case 'funded':
      return { icon: 'arrow-down', iconBg: 'rgba(52,199,89,0.12)', iconColor: foodColors.success, title: 'Wallet Funded', amountColor: foodColors.success, sign: '+' };
    case 'refund':
      return { icon: 'arrow-down', iconBg: 'rgba(52,199,89,0.12)', iconColor: foodColors.success, title: 'Refund from Cancelled Plan', amountColor: foodColors.success, sign: '+' };
    case 'locked':
      return { icon: 'lock', iconBg: 'rgba(0,50,193,0.1)', iconColor: WALLET_BLUE, title: 'Locked for E-Plan', amountColor: foodColors.textPrimary, sign: '-' };
    case 'withdrawal':
      return { icon: 'arrow-up', iconBg: 'rgba(217,119,6,0.12)', iconColor: '#D97706', title: 'Withdrawal Requested', amountColor: foodColors.textPrimary, sign: '-' };
    default:
      return { icon: 'arrow-up', iconBg: 'rgba(0,0,0,0.05)', iconColor: foodColors.textSecondary, title: 'Wallet Debit', amountColor: foodColors.textPrimary, sign: '-' };
  }
}

function formatNaira(kobo: number) {
  return `₦${Math.round(kobo / 100).toLocaleString()}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${datePart} • ${timePart}`;
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: wallet }, { data: transactions }] = await Promise.all([
      supabase.from('wallets').select('balance_kobo').eq('user_id', userId).single(),
      supabase
        .from('wallet_transactions')
        .select('id, amount_kobo, type, tx_ref, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setBalance(wallet?.balance_kobo ?? 0);
    setTxns(transactions ?? []);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Wallet</Text>
        <Text style={styles.subtitle}>
          Manage your balance, fund your wallet{'\n'}or request a withdrawal.
        </Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceValue}>{formatNaira(balance)}</Text>
          <Text style={styles.balanceHint}>Available to use for E-Plans{'\n'}or request a withdrawal.</Text>

          <View style={styles.walletIllustration}>
            <View style={styles.walletCardBack} />
            <View style={styles.walletCardFront}>
              <View style={styles.walletCardChip} />
            </View>
            <View style={styles.walletBody}>
              <View style={styles.walletCoin}>
                <Text style={styles.walletCoinText}>₦</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/fund-wallet-amount' as any)}
          >
            <View style={styles.actionIconWrap}>
              <MaterialCommunityIcons name="wallet-plus" size={22} color={WALLET_BLUE} />
            </View>
            <Text style={styles.actionTitle}>Fund Wallet</Text>
            <Text style={styles.actionSubtitle}>Add money via{'\n'}bank transfer</Text>
            <Feather name="arrow-right" size={16} color={WALLET_BLUE} style={styles.actionArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/request-withdrawal' as any)}
          >
            <View style={styles.actionIconWrap}>
              <View style={styles.iconStack}>
                <MaterialCommunityIcons name="wallet" size={24} color={WALLET_BLUE} />
                <Feather name="arrow-up" size={12} color={WALLET_BLUE} style={styles.iconOverlay} />
              </View>
            </View>
            <Text style={styles.actionTitle}>Request Withdrawal</Text>
            <Text style={styles.actionSubtitle}>Withdraw your available balance</Text>
            <Feather name="arrow-right" size={16} color={WALLET_BLUE} style={styles.actionArrow} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
        <View style={styles.activityGroup}>
          {txns.map((t, i) => {
            const kind = classify(t);
            const meta = getKindMeta(kind);
            return (
              <View
                key={t.id}
                style={[styles.activityRow, i !== txns.length - 1 && styles.activityRowDivider]}
              >
                <View style={[styles.activityIconWrap, { backgroundColor: meta.iconBg }]}>
                  <Feather name={meta.icon} size={16} color={meta.iconColor} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{meta.title}</Text>
                  <Text style={styles.activityDate}>{formatDate(t.created_at)}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: meta.amountColor }]}>
                  {meta.sign}{formatNaira(t.amount_kobo)}
                </Text>
              </View>
            );
          })}
          {!loading && txns.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No activity yet.</Text>
            </View>
          )}
        </View>

        <View style={styles.safeBanner}>
          <View style={styles.safeIconWrap}>
            <Feather name="shield" size={20} color={WALLET_BLUE} />
          </View>
          <View style={styles.safeTextWrap}>
            <Text style={styles.safeTitle}>Safe & Secure</Text>
            <Text style={styles.safeBannerText}>
              Your money is protected with bank-level security and encrypted transactions.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },

  titleRow: { paddingHorizontal: 20, marginBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  title: { fontSize: 32, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: 10, marginBottom: 8 },
  subtitle: {
    fontSize: 13, fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary, marginBottom: 24, lineHeight: 18,
  },

  balanceCard: {
    backgroundColor: WALLET_BLUE, borderRadius: 24, padding: 24, marginBottom: 20, overflow: 'hidden',
    shadowColor: WALLET_BLUE, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  balanceLabel: {
    fontSize: 11, fontFamily: fonts.poppins.bold, letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)', marginBottom: 12,
  },
  balanceValue: { fontSize: 38, fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 10 },
  balanceHint: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.85)', maxWidth: '65%', lineHeight: 18 },

  walletIllustration: {
    position: 'absolute', right: 10, bottom: 10, width: 100, height: 100,
    justifyContent: 'center', alignItems: 'center',
  },
  walletCardBack: {
    position: 'absolute', right: 15, top: 10, width: 60, height: 40, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ rotate: '-15deg' }],
  },
  walletCardFront: {
    position: 'absolute', right: 5, top: 20, width: 65, height: 45, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ rotate: '-5deg' }],
    padding: 8,
  },
  walletCardChip: {
    width: 12, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)',
  },
  walletBody: {
    position: 'absolute', right: 0, bottom: 10, width: 80, height: 60,
    backgroundColor: '#2A5BE8', borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  walletCoin: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  walletCoinText: { fontSize: 16, fontFamily: fonts.poppins.bold, color: WALLET_BLUE },

  actionsRow: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  actionCard: {
    flex: 1, backgroundColor: foodColors.surface, borderRadius: 18, padding: 16,
    minHeight: 140, justifyContent: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,50,193,0.08)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  iconStack: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  iconOverlay: { position: 'absolute', top: 6 },
  actionTitle: { fontSize: 14, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 6 },
  actionSubtitle: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16, paddingRight: 10 },
  actionArrow: { position: 'absolute', bottom: 16, right: 16 },

  sectionLabel: {
    fontSize: 11, fontFamily: fonts.poppins.bold, letterSpacing: 0.8,
    color: foodColors.textMuted, marginBottom: 12,
  },
  activityGroup: {
    backgroundColor: foodColors.surface, borderRadius: 18, overflow: 'hidden', marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
  activityRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  activityIconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: 13.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  activityDate: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: 3 },
  activityAmount: { fontSize: 14, fontFamily: fonts.poppins.bold },
  emptyWrap: { paddingVertical: 30, paddingHorizontal: 16 },
  emptyText: { fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center' },

  safeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(0,50,193,0.05)', borderRadius: 18, padding: 16,
  },
  safeIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  safeTextWrap: { flex: 1 },
  safeTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 3 },
  safeBannerText: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16 },

  bottomSpacer: { height: 30 },
});