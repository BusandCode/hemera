import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

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

export default function FoodScreen() {
  const router = useRouter();
  const { formatted } = useLocation();
  const { itemCount, total } = useCart();
  const [category, setCategory] = useState<FoodCategory>('All');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FoodHeader
          location={formatted}
          cartCount={itemCount}
          onPressLocation={() => router.push('/location-picker' as any)}
          onPressCart={() => router.push('/cart')}
          onPressEPlan={() => router.push('/e-plan' as any)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.searchSection}>
          <SearchBar />
        </View>

        <View style={styles.bannerSection}>
          <PromoBanner />
        </View>

        <View style={styles.categorySection}>
          <CategoryTabs active={category} onSelect={setCategory} />
        </View>

        <View style={styles.partnersSection}>
          <NearbyPartners />
        </View>

        <View style={styles.menuSection}>
          <TodaysMenu />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.orderBarContainer}>
          <ViewOrderBar
            itemCount={itemCount}
            total={total}
            onPress={() => router.push('/cart')}
          />
        </View>

        <FoodTabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: 26, paddingTop: 55, paddingBottom: 8 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 26, paddingBottom: 18 },
  searchSection: { marginBottom: 14 },
  bannerSection: { marginBottom: 22 },
  categorySection: { marginBottom: 23 },
  partnersSection: { marginBottom: 24 },
  menuSection: { marginBottom: 10 },
  footer: {
    backgroundColor: foodColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.025)',
    paddingTop: 4,
  },
  orderBarContainer: { paddingHorizontal: 0, paddingBottom: 4 },
});