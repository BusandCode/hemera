import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { ms } from '../src/utils/responsive';

type Subscription = {
  id: string;
  planName: string;
  durationLabel: string;
  amount: number;
  paymentRef: string;
  dateLine: string;
  status: 'active' | 'completed' | 'pending';
  sortTime: number;
};

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function monthsToLabel(months: number): string {
  if (!months || months < 1) return '—';
  return months === 1 ? '1 Month' : `${months} Months`;
}

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

export default function SubscriptionsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setSubs([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, status, total_kobo, metadata, created_at')
      .eq('user_id', userId)
      .eq('order_type', 'ewash')
      .eq('metadata->>kind', 'subscription')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      const list: Subscription[] = (data ?? []).map((row: any) => {
        const meta = (row.metadata ?? {}) as Record<string, any>;
        const d = new Date(row.created_at);
        const rawStatus = String(row.status ?? '').toLowerCase().trim();

        let status: Subscription['status'] = 'pending';
        if (rawStatus === 'delivered' || rawStatus === 'completed' || rawStatus === 'fulfilled') {
          status = 'completed';
        } else if (rawStatus === 'placed' || rawStatus === 'paid' || rawStatus === 'confirmed') {
          status = 'active';
        } else if (rawStatus === 'pending') {
          status = 'pending';
        }

        const totalNaira =
          row.total_kobo != null ? Number(row.total_kobo) / 100 : Number(meta.total ?? 0);

        return {
          id: row.id,
          planName: meta.plan_id
            ? `${String(meta.plan_id).charAt(0).toUpperCase()}${String(meta.plan_id).slice(1).toLowerCase()} Plan`
            : 'Plan',
          durationLabel: monthsToLabel(Number(meta.duration_months ?? 0)),
          amount: Math.round(totalNaira),
          paymentRef: String(meta.tx_ref ?? meta.ref ?? row.id.slice(0, 8).toUpperCase()),
          dateLine: d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          status,
          sortTime: d.getTime(),
        };
      });
      list.sort((a, b) => b.sortTime - a.sortTime);
      setSubs(list);
      setError(null);
    }
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Subscriptions" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={foodColors.primary} />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={foodColors.primary} />
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Couldn't load your subscriptions</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.linkText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : subs.length === 0 ? (
          <View style={styles.stateBox}>
            <Feather name="repeat" size={ms(28)} color={foodColors.textMuted} />
            <Text style={styles.stateTitle}>No subscriptions yet</Text>
            <Text style={styles.stateText}>
              Laundry plans you buy will show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {subs.map((sub) => {
              const statusMeta: { label: string; bg: string; fg: string; icon: IconName } =
                sub.status === 'active'
                  ? {
                      label: 'Active',
                      bg: 'rgba(31,122,74,0.10)',
                      fg: '#1F7A4A',
                      icon: 'check-circle-outline',
                    }
                  : sub.status === 'completed'
                    ? {
                        label: 'Completed',
                        bg: 'rgba(46,90,172,0.10)',
                        fg: foodColors.badgeBlue,
                        icon: 'check-circle-outline',
                      }
                    : {
                        label: 'Pending',
                        bg: 'rgba(217,138,0,0.12)',
                        fg: '#D98A00',
                        icon: 'clock-outline',
                      };

              return (
                <View key={sub.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.planIconWrap}>
                      <MaterialCommunityIcons
                        name="crown-outline"
                        size={ms(22)}
                        color={foodColors.badgeBlue}
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.planName}>{sub.planName}</Text>
                      <Text style={styles.duration}>{sub.durationLabel}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
                      <MaterialCommunityIcons
                        name={statusMeta.icon}
                        size={12}
                        color={statusMeta.fg}
                      />
                      <Text style={[styles.statusText, { color: statusMeta.fg }]}>
                        {statusMeta.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount paid</Text>
                    <Text style={styles.detailValue}>{formatNaira(sub.amount)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment reference</Text>
                    <Text style={styles.detailValueMono}>{sub.paymentRef}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{sub.dateLine}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingTop: ms(4), paddingBottom: ms(16) },
  list: { gap: ms(12) },
  loader: { marginTop: ms(48) },

  card: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(18),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: ms(12) },
  planIconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: 'rgba(46,90,172,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, minWidth: 0 },
  planName: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  duration: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    paddingHorizontal: ms(9),
    paddingVertical: ms(4),
    borderRadius: ms(10),
  },
  statusText: { fontSize: ms(10.5), fontFamily: fonts.poppins.bold },

  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: ms(12),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ms(4),
    gap: ms(10),
  },
  detailLabel: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  detailValue: {
    flexShrink: 1,
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    textAlign: 'right',
  },
  detailValueMono: {
    flexShrink: 1,
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    letterSpacing: 0.3,
    textAlign: 'right',
  },

  stateBox: { alignItems: 'center', marginTop: ms(48), paddingHorizontal: ms(12), gap: ms(6) },
  stateTitle: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    marginTop: ms(4),
  },
  stateText: {
    fontSize: ms(13),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
  },
  linkBtn: { marginTop: ms(16), paddingVertical: ms(8), paddingHorizontal: ms(12) },
  linkText: { fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },
  bottomSpacer: { height: ms(20) },
});