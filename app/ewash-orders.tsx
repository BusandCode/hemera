import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard } from '../src/components/profile/OrderCard';
import { useOrders } from '../src/hooks/useOrders';

export default function EwashOrdersScreen() {
  const { orders, loading, error } = useOrders('ewash');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="E-Wash Orders" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={foodColors.primary} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.list}>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingTop: 4, paddingBottom: 16 },
  list: { gap: 12 },
  loader: { marginTop: 48 },
  errorText: { marginTop: 48, textAlign: 'center', color: foodColors.textSecondary },
  bottomSpacer: { height: 20 },
});