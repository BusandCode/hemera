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
import { ms } from '../src/utils/responsive';

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
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
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
              <MaterialCommunityIcons name="wallet-plus" size={ms(22)} color={WALLET_BLUE} />
            </View>
            <Text style={styles.actionTitle}>Fund Wallet</Text>
            <Text style={styles.actionSubtitle}>Add money via{'\n'}bank transfer</Text>
            <Feather name="arrow-right" size={ms(16)} color={WALLET_BLUE} style={styles.actionArrow} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/request-withdrawal' as any)}
          >
            <View style={styles.actionIconWrap}>
              <View style={styles.iconStack}>
                <MaterialCommunityIcons name="wallet" size={ms(24)} color={WALLET_BLUE} />
                <Feather name="arrow-up" size={ms(12)} color={WALLET_BLUE} style={styles.iconOverlay} />
              </View>
            </View>
            <Text style={styles.actionTitle}>Request Withdrawal</Text>
            <Text style={styles.actionSubtitle}>Withdraw your available balance</Text>
            <Feather name="arrow-right" size={ms(16)} color={WALLET_BLUE} style={styles.actionArrow} />
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
                  <Feather name={meta.icon} size={ms(16)} color={meta.iconColor} />
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
            <Feather name="shield" size={ms(20)} color={WALLET_BLUE} />
          </View>
          <View style={styles.safeTextWrap}>
            <Text style={styles.safeTitle}>Safe & Secure</Text>
            <Text style={styles.safeBannerText}>
              Your money is protected with bank-level security and encrypted transactions.
            </Text>
          </View>
          <Feather name="chevron-right" size={ms(18)} color={foodColors.textMuted} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(20) },

  titleRow: { paddingHorizontal: ms(20), marginBottom: ms(4) },
  backBtn: {
    width: ms(38), height: ms(38), borderRadius: ms(19),
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  title: { fontSize: ms(32), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: ms(10), marginBottom: ms(8) },
  subtitle: {
    fontSize: ms(13), fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary, marginBottom: ms(24), lineHeight: ms(18),
  },

  balanceCard: {
    backgroundColor: WALLET_BLUE, borderRadius: ms(24), padding: ms(24), marginBottom: ms(20), overflow: 'hidden',
    shadowColor: WALLET_BLUE, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  balanceLabel: {
    fontSize: ms(11), fontFamily: fonts.poppins.bold, letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)', marginBottom: ms(12),
  },
  balanceValue: { fontSize: ms(38), fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: ms(10) },
  balanceHint: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.85)', maxWidth: '65%', lineHeight: ms(18) },

  walletIllustration: {
    position: 'absolute', right: 10, bottom: 10, width: ms(100), height: ms(100),
    justifyContent: 'center', alignItems: 'center',
  },
  walletCardBack: {
    position: 'absolute', right: 15, top: 10, width: ms(60), height: ms(40), borderRadius: ms(6),
    backgroundColor: 'rgba(255,255,255,0.2)', transform: [{ rotate: '-15deg' }],
  },
  walletCardFront: {
    position: 'absolute', right: 5, top: 20, width: ms(65), height: ms(45), borderRadius: ms(8),
    backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ rotate: '-5deg' }],
    padding: ms(8),
  },
  walletCardChip: {
    width: ms(12), height: ms(8), borderRadius: ms(2), backgroundColor: 'rgba(255,255,255,0.6)',
  },
  walletBody: {
    position: 'absolute', right: 0, bottom: 10, width: ms(80), height: ms(60),
    backgroundColor: '#2A5BE8', borderRadius: ms(14),
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  walletCoin: {
    width: ms(30), height: ms(30), borderRadius: ms(15),
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  walletCoinText: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: WALLET_BLUE },

  actionsRow: { flexDirection: 'row', gap: ms(14), marginBottom: ms(28) },
  actionCard: {
    flex: 1, backgroundColor: foodColors.surface, borderRadius: ms(18), padding: ms(16),
    minHeight: ms(140), justifyContent: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  actionIconWrap: {
    width: ms(40), height: ms(40), borderRadius: ms(20), backgroundColor: 'rgba(0,50,193,0.08)',
    justifyContent: 'center', alignItems: 'center', marginBottom: ms(16),
  },
  iconStack: { width: ms(24), height: ms(24), justifyContent: 'center', alignItems: 'center' },
  iconOverlay: { position: 'absolute', top: 6 },
  actionTitle: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(6) },
  actionSubtitle: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: ms(16), paddingRight: ms(10) },
  actionArrow: { position: 'absolute', bottom: 16, right: 16 },

  sectionLabel: {
    fontSize: ms(11), fontFamily: fonts.poppins.bold, letterSpacing: 0.8,
    color: foodColors.textMuted, marginBottom: ms(12),
  },
  activityGroup: {
    backgroundColor: foodColors.surface, borderRadius: ms(18), overflow: 'hidden', marginBottom: ms(24),
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: ms(14), paddingHorizontal: ms(16), paddingVertical: ms(15) },
  activityRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  activityIconWrap: { width: ms(38), height: ms(38), borderRadius: ms(19), justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  activityDate: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: ms(3) },
  activityAmount: { fontSize: ms(14), fontFamily: fonts.poppins.bold },
  emptyWrap: { paddingVertical: ms(30), paddingHorizontal: ms(16) },
  emptyText: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center' },

  safeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: ms(14),
    backgroundColor: 'rgba(0,50,193,0.05)', borderRadius: ms(18), padding: ms(16),
  },
  safeIconWrap: {
    width: ms(44), height: ms(44), borderRadius: ms(22), backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  safeTextWrap: { flex: 1 },
  safeTitle: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(3) },
  safeBannerText: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: ms(16) },

  bottomSpacer: { height: ms(30) },
});