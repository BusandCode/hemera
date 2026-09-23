// app/echop-orders.tsx
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';

const echopOrders: Order[] = [
  { id: 'e1', type: 'echop', title: 'Party Jollof Rice', meta: "Mama Titi's · 2 items", date: 'Today, 1:20 PM', amount: 7700, status: 'In Progress' },
  { id: 'e2', type: 'echop', title: 'Beef Suya Platter', meta: 'Suya Spot · 1 item', date: 'June 28, 2026', amount: 3200, status: 'Delivered' },
  { id: 'e3', type: 'echop', title: 'Amala & Ewedu Combo', meta: "Mama Titi's · 3 items", date: 'June 10, 2026', amount: 4600, status: 'Cancelled' },
  { id: 'e4', type: 'echop', title: 'Pepper Soup Special', meta: 'Suya Spot · 1 item', date: 'May 30, 2026', amount: 2800, status: 'Delivered' },
];

export default function EchopOrdersScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="E-Chop Orders" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {echopOrders.map((order) => (
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
