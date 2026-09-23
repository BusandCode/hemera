// app/ewash-orders.tsx
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';

const ewashOrders: Order[] = [
  { id: 'w1', type: 'ewash', title: 'Laundry Pickup #239604', meta: '10 items · Standard wash', date: 'July 05, 2026', amount: 3500, status: 'Scheduled' },
  { id: 'w2', type: 'ewash', title: 'Dry Cleaning #239580', meta: '4 items · Express', date: 'June 20, 2026', amount: 5200, status: 'Delivered' },
  { id: 'w3', type: 'ewash', title: 'Laundry Pickup #239471', meta: '7 items · Standard wash', date: 'May 28, 2026', amount: 2900, status: 'Delivered' },
];

export default function EwashOrdersScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="E-Wash Orders" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {ewashOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingTop: 4, paddingBottom: 16 },
  list: { gap: 12 },
  bottomSpacer: { height: 20 },
});
