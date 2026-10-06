import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

const PAGE_SIZE = 20;

// Where the money went / came from.
type Kind = 'echop' | 'ewash' | 'subscription';
type Filter = 'all' | Kind;
type Status = 'pending' | 'success' | 'failed';

type Transaction = {
  id: string;
  kind: Kind;
  title: string;
  reference: string | null;
  amount: number;
  type: 'debit' | 'credit';
  status: Status;
  created_at: string;
};

type Section = { title: string; data: Transaction[] };

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'echop', label: 'E-Chop' },
  { key: 'ewash', label: 'E-Wash' },
  { key: 'subscription', label: 'Subscriptions' },
];

const STATUS_STYLE: Record<Status, { label: string; color: string; bg: string }> = {
  success: { label: 'Successful', color: '#1E9E55', bg: 'rgba(30,158,85,0.10)' },
  pending: { label: 'Pending', color: '#D98A00', bg: 'rgba(245,165,36,0.14)' },
  failed: { label: 'Failed', color: '#FF3B30', bg: 'rgba(255,59,48,0.10)' },
};

type IconMeta = {
  name: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
};

const ICON_STYLE: Record<Kind, IconMeta> = {
  echop: { name: 'coffee', color: '#FF6B35', bg: 'rgba(255,107,53,0.10)' },
  ewash: { name: 'droplet', color: '#0032C1', bg: 'rgba(0,50,193,0.08)' },
  subscription: { name: 'repeat', color: '#7A3FF2', bg: 'rgba(122,63,242,0.10)' },
};

const KIND_LABEL: Record<Kind, string> = {
  echop: 'E-Chop',
  ewash: 'E-Wash',
  subscription: 'Subscription',
};

const KIND_TITLE: Record<Kind, string> = {
  echop: 'E-Chop order payment',
  ewash: 'E-Wash payment',
  subscription: 'Plan subscription',
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (dayKey(iso) === dayKey(now.toISOString())) return 'Today';
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Yesterday';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function normalizeStatus(raw: unknown): Status {
  const s = String(raw ?? '').toLowerCase();
  if (['success', 'successful', 'completed', 'paid', 'confirmed'].includes(s)) return 'success';
  if (['failed', 'failure', 'cancelled', 'canceled', 'expired', 'declined', 'error'].includes(s)) {
    return 'failed';
  }
  return 'pending';
}

const KINDS: Kind[] = ['echop', 'ewash', 'subscription'];

// Maps a wallet_transactions row to what the screen shows. `purpose` records what the payment
// was for (echop, ewash, subscription).
function toTransaction(r: any): Transaction {
  const kind = String(r.purpose ?? '').toLowerCase() as Kind;

  return {
    id: String(r.id ?? r.tx_ref),
    kind,
    title: r.title || KIND_TITLE[kind],
    reference: r.tx_ref ?? null,
    amount: Number(r.amount_kobo ?? 0) / 100,
    type: 'debit',
    status: normalizeStatus(r.status),
    created_at: r.created_at,
  };
}

export default function TransactionsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [filter, setFilter] = useState<Filter>('all');
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (offset: number): Promise<Transaction[]> => {
      const { data, error: err } = await supabase
        .from('wallet_transactions')
        .select('id, amount_kobo, tx_ref, status, purpose, title, created_at')
        .eq('user_id', userId!)
        .eq('status', 'success')
        .in('purpose', KINDS)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (err) throw err;
      return (data ?? []).map(toTransaction);
    },
    [userId]
  );

  const loadFirstPage = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const id = ++requestId.current;

      if (!userId) {
        setRows([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(false);

      try {
        const page = await fetchPage(0);
        if (id !== requestId.current) return;
        setRows(page);
        setHasMore(page.length === PAGE_SIZE);
      } catch (e: any) {
        if (id !== requestId.current) return;
        console.warn('Failed to load transactions:', e?.message ?? e);
        setError(true);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId, fetchPage]
  );

  useEffect(() => {
    setRows([]);
    setHasMore(true);
    loadFirstPage('initial');
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (
      loading ||
      refreshing ||
      loadingMore ||
      !hasMore ||
      error ||
      rows.length === 0
    )
      return;

    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchPage(rows.length);
      if (id !== requestId.current) return;
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...page.filter((r) => !seen.has(r.id))];
      });
      setHasMore(page.length === PAGE_SIZE);
    } catch (e: any) {
      console.warn('Failed to load more transactions:', e?.message ?? e);
    } finally {
      setLoadingMore(false);
    }
  };

  const sections = useMemo<Section[]>(() => {
    const visible = rows.filter((r) => filter === 'all' || r.kind === filter);

    const out: Section[] = [];
    let currentKey = '';
    for (const row of visible) {
      const key = dayKey(row.created_at);
      if (key !== currentKey) {
        out.push({ title: dayLabel(row.created_at), data: [] });
        currentKey = key;
      }
      out[out.length - 1].data.push(row);
    }
    return out;
  }, [rows, filter]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const icon = ICON_STYLE[item.kind];
    const status = STATUS_STYLE[item.status];
    const muted = item.status === 'failed';
    const sign = item.type === 'credit' ? '+' : '-';

    return (
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Feather name={icon.name} size={ms(18)} color={icon.color} />
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {KIND_LABEL[item.kind]} • {timeLabel(item.created_at)}
          </Text>
        </View>

        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, muted && styles.rowAmountMuted]}>
            {sign}
            {formatNaira(item.amount)}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Transactions" />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              activeOpacity={0.85}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={foodColors.primary} style={styles.loader} />
      ) : error && rows.length === 0 ? (
        <TouchableOpacity
          style={styles.stateCard}
          activeOpacity={0.85}
          onPress={() => loadFirstPage('initial')}
        >
          <Feather name="refresh-cw" size={ms(16)} color={foodColors.badgeBlue} />
          <Text style={styles.stateRetryText}>
            Couldn't load your transactions. Tap to retry
          </Text>
        </TouchableOpacity>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFirstPage('refresh')}
              tintColor={foodColors.primary}
              colors={[foodColors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="file-text" size={ms(28)} color={foodColors.textMuted} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>
                {filter === 'all'
                  ? 'Your successful payments will show up here.'
                  : `Your successful ${KIND_LABEL[filter]} payments will show up here.`}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={foodColors.primary}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
    paddingHorizontal: '5.5%',
    marginBottom: ms(6),
  },
  filterPill: {
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    borderRadius: ms(20),
    borderWidth: 1.5,
    borderColor: foodColors.border,
    backgroundColor: foodColors.surface,
  },
  filterPillActive: { backgroundColor: '#0B1020', borderColor: '#0B1020' },
  filterText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
  filterTextActive: { color: '#fff' },

  loader: { marginTop: ms(40) },
  listContent: { paddingHorizontal: '5.5%', paddingBottom: ms(30), flexGrow: 1 },
  footerLoader: { marginVertical: ms(16) },

  sectionHeader: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: ms(18),
    marginBottom: ms(8),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    padding: ms(14),
    marginBottom: ms(8),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  rowSub: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },
  rowRight: { alignItems: 'flex-end', gap: ms(5) },
  rowAmount: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  rowAmountMuted: {
    color: foodColors.textMuted,
    textDecorationLine: 'line-through',
  },
  statusPill: { paddingHorizontal: ms(8), paddingVertical: ms(2), borderRadius: ms(8) },
  statusText: { fontSize: ms(10), fontFamily: fonts.poppins.bold },

  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(16),
    marginTop: ms(20),
    marginHorizontal: '5.5%',
  },
  stateRetryText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.badgeBlue,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: ms(70),
    paddingHorizontal: ms(30),
    gap: ms(8),
  },
  emptyTitle: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: ms(6),
  },
  emptySub: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: ms(18),
  },
});