// app/my-orders.tsx
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';
import { FilterTabs } from '../src/components/profile/FilterTabs';

const allOrders: Order[] = [
  { id: 'o1', type: 'echop', title: 'Party Jollof Rice', meta: "Mama Titi's · 2 items", date: 'Today, 1:20 PM', amount: 7700, status: 'In Progress' },
  { id: 'o2', type: 'ewash', title: 'Laundry Pickup #239604', meta: '10 items · Standard wash', date: 'July 05, 2026', amount: 3500, status: 'Scheduled' },
  { id: 'o3', type: 'echop', title: 'Beef Suya Platter', meta: 'Suya Spot · 1 item', date: 'June 28, 2026', amount: 3200, status: 'Delivered' },
  { id: 'o4', type: 'ewash', title: 'Dry Cleaning #239580', meta: '4 items · Express', date: 'June 20, 2026', amount: 5200, status: 'Delivered' },
  { id: 'o5', type: 'echop', title: 'Amala & Ewedu Combo', meta: "Mama Titi's · 3 items", date: 'June 10, 2026', amount: 4600, status: 'Cancelled' },
];

const tabs = ['All', 'E-Chop', 'E-Wash'] as const;

export default function MyOrdersScreen() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');

  const filtered = useMemo(() => {
    if (activeTab === 'All') return allOrders;
    const type = activeTab === 'E-Chop' ? 'echop' : 'ewash';
    return allOrders.filter((o) => o.type === type);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="My Orders" />

      <View style={styles.tabsWrap}>
        <FilterTabs tabs={tabs as unknown as string[]} active={activeTab} onSelect={(t) => setActiveTab(t as any)} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>No orders in this category yet.</Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  tabsWrap: { paddingHorizontal: '5.5%', marginBottom: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },
  list: { gap: 12 },
  emptyText: { fontSize: 13, color: foodColors.textSecondary, textAlign: 'center', marginTop: 40 },
  bottomSpacer: { height: 20 },
});
