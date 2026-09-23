import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';

const history: Order[] = [
  { id: 'h1', type: 'echop', title: 'Beef Suya Platter', meta: 'Suya Spot · 1 item', date: 'June 28, 2026', amount: 3200, status: 'Delivered' },
  { id: 'h2', type: 'ewash', title: 'Dry Cleaning #239580', meta: '4 items · Express', date: 'June 20, 2026', amount: 5200, status: 'Delivered' },
  { id: 'h3', type: 'echop', title: 'Amala & Ewedu Combo', meta: "Mama Titi's · 3 items", date: 'June 10, 2026', amount: 4600, status: 'Cancelled' },
  { id: 'h4', type: 'echop', title: 'Pepper Soup Special', meta: 'Suya Spot · 1 item', date: 'May 30, 2026', amount: 2800, status: 'Delivered' },
  { id: 'h5', type: 'ewash', title: 'Laundry Pickup #239471', meta: '7 items · Standard wash', date: 'May 28, 2026', amount: 2900, status: 'Delivered' },
];

export default function OrderHistoryScreen() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return history;
    const q = query.toLowerCase();
    return history.filter(
      (o) => o.title.toLowerCase().includes(q) || o.meta.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Order History" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={foodColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search past orders"
            placeholderTextColor={foodColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
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
            <Text style={styles.emptyText}>No orders match "{query}".</Text>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  searchWrap: { paddingHorizontal: '5.5%', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },
  list: { gap: 12 },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  bottomSpacer: { height: 20 },
});