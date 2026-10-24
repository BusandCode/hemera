import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodHeader } from '../../src/components/food/FoodHeader';
import { SearchBar } from '../../src/components/food/SearchBar';
import { PromoBanner } from '../../src/components/food/PromoBanner';
import { CategoryTabs } from '../../src/components/food/CategoryTabs';
import { NearbyPartners } from '../../src/components/food/NearbyPartners';
import { TodaysMenu } from '../../src/components/food/TodaysMenu';
import { ViewOrderBar } from '../../src/components/food/ViewOrderBar';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';

import { foodColors } from '../../src/constants/foodColors';
import { FoodCategory } from '../../src/constants/foodData';
import { useLocation } from '../../src/context/LocationContext';
import { useCart } from '../../src/context/CartContext';
import { ms } from '../../src/utils/responsive';
import { refreshFoodData } from '../../src/hooks/useFood';

export default function FoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { formatted } = useLocation();
  const { itemCount, total } = useCart();
  const [category, setCategory] = useState<FoodCategory>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Pull down to reload restaurants and meals.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshFoodData().finally(() => setRefreshing(false));
  }, []);

  // Coming back to this tab reloads quietly (not on the very first visit, which loads anyway).
  const visited = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (visited.current) void refreshFoodData();
      visited.current = true;
    }, [])
  );

  // Same side padding rule as Home: tighter on small phones, roomier on tablets.
  const hPad = ms(width < 360 ? 12 : width >= 600 ? 28 : 16);
  const padded = { paddingHorizontal: hPad };

  return (
    <View style={styles.container}>
      <View style={[styles.header, padded, { paddingTop: insets.top + ms(8) }]}>
        <FoodHeader
          location={formatted}
          cartCount={itemCount}
          onPressLocation={() => router.push('/location-picker' as any)}
          onPressCart={() => router.push('/cart' as any)}
          onPressEPlan={() => router.push('/e-plan' as any)}
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
            colors={[foodColors.primary]}
            progressViewOffset={ms(8)}
          />
        }
      >
        <View style={[styles.searchSection, padded]}>
          <SearchBar />
        </View>

        <View style={[styles.bannerSection, padded]}>
          <PromoBanner />
        </View>

        <View style={[styles.categorySection, padded]}>
          <CategoryTabs active={category} onSelect={setCategory} />
        </View>

        <View style={[styles.partnersSection, padded]}>
          <NearbyPartners sidePadding={hPad} />
        </View>

        <View style={[styles.menuSection, padded]}>
          <TodaysMenu category={category} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.orderBarContainer}>
          <ViewOrderBar
            itemCount={itemCount}
            total={total}
            onPress={() => router.push('/cart' as any)}
          />
        </View>

        <FoodTabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingBottom: ms(8) },
  scroll: { flex: 1 },
  content: { paddingBottom: ms(18) },
  searchSection: { marginBottom: ms(14) },
  bannerSection: { marginBottom: ms(20) },
  categorySection: { marginBottom: ms(18) },
  partnersSection: { marginBottom: ms(8) },
  menuSection: { marginBottom: ms(10) },
  footer: {
    backgroundColor: foodColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.025)',
    paddingTop: ms(4),
  },
  orderBarContainer: { paddingBottom: ms(4) },
});