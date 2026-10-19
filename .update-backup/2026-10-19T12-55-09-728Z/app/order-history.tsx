import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, OrderStatus } from '../src/components/profile/OrderCard';
import { useOrders } from '../src/hooks/useOrders';
import { ms } from '../src/utils/responsive';

type StatusFilter = 'All' | OrderStatus;

const statusFilters: StatusFilter[] = ['All', 'Delivered', 'Cancelled'];

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Delivered + Cancelled only — nothing in-progress shows here.
  const { orders, loading, error, refetch } = useOrders(undefined, 'finished');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        o.meta.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.date.toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const hasFilters = query.trim().length > 0 || statusFilter !== 'All';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Order History" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={ms(16)} color={foodColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders"
            placeholderTextColor={foodColors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {statusFilters.map((s) => {
            const active = s === statusFilter;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                onPress={() => setStatusFilter(s)}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={foodColors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={foodColors.primary} />
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Couldn't load your orders</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.linkText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>
              {hasFilters ? 'No matching orders' : 'No completed orders yet'}
            </Text>
            <Text style={styles.stateText}>
              {hasFilters
                ? 'Try a different status or search term.'
                : 'Delivered and cancelled orders will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() =>
                  router.push({ pathname: '/order-details', params: { id: order.id } } as any)
                }
              />
            ))}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  searchWrap: { paddingHorizontal: '5.5%', marginBottom: ms(12) },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(12) : ms(4),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },

  chipsWrap: { marginBottom: ms(14) },
  chipsRow: { paddingHorizontal: '5.5%', gap: ms(8) },
  chip: { paddingHorizontal: ms(14), paddingVertical: ms(7), borderRadius: ms(16), borderWidth: 1 },
  chipActive: { backgroundColor: foodColors.primaryDark, borderColor: foodColors.primaryDark },
  chipInactive: { backgroundColor: foodColors.surface, borderColor: foodColors.border },
  chipText: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold },
  chipTextActive: { color: '#fff' },
  chipTextInactive: { color: foodColors.textSecondary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },
  list: { gap: ms(12) },
  loader: { marginTop: ms(48) },
  stateBox: { alignItems: 'center', marginTop: ms(48), paddingHorizontal: ms(12) },
  stateTitle: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontSize: ms(13),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(6),
  },
  linkBtn: { marginTop: ms(16), paddingVertical: ms(8), paddingHorizontal: ms(12) },
  linkText: { fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },
  bottomSpacer: { height: ms(20) },
});