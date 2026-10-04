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
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard } from '../src/components/profile/OrderCard';
import { useOrders } from '../src/hooks/useOrders';
import { ms } from '../src/utils/responsive';

export default function EwashScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  // All statuses (in progress, scheduled, delivered, cancelled), newest first.
  const { orders, loading, error, refetch } = useOrders('ewash');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="E-Wash Orders" />

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
        ) : orders.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>No E-Wash orders yet</Text>
            <Text style={styles.stateText}>Laundry pickups you book with E-Wash will show up here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {orders.map((order) => (
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingTop: ms(4), paddingBottom: ms(16) },
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