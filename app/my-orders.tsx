// app/my-orders.tsx
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard } from '../src/components/profile/OrderCard';
import { FilterTabs } from '../src/components/profile/FilterTabs';
import { useOrders } from '../src/hooks/useOrders';
import { ms } from '../src/utils/responsive';

const tabs = ['All', 'E-Chop', 'E-Wash'] as const;

export default function MyOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');
  const [refreshing, setRefreshing] = useState(false);

  // "active" = In Progress or Scheduled. Delivered and cancelled orders live in Order History.
  const { orders, loading, error, refetch } = useOrders(undefined, 'active');

  const filtered = useMemo(() => {
    if (activeTab === 'All') return orders;
    const type = activeTab === 'E-Chop' ? 'echop' : 'ewash';
    return orders.filter((o) => o.type === type);
  }, [orders, activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const emptyTitle =
    activeTab === 'All' ? 'No active orders' : `No active ${activeTab} orders`;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="My Orders" />

      <View style={styles.tabsWrap}>
        <FilterTabs
          tabs={tabs as unknown as string[]}
          active={activeTab}
          onSelect={(t) => setActiveTab(t as (typeof tabs)[number])}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.stateTitle}>{emptyTitle}</Text>
            <Text style={styles.stateText}>
              Orders that are being prepared, on the way or scheduled will show up here.
            </Text>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => router.push('/order-history' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.linkText}>View order history</Text>
            </TouchableOpacity>
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
  tabsWrap: { paddingHorizontal: '5.5%', marginBottom: ms(14) },
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