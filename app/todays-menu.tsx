import { useMemo, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { FoodCategory, MenuItem, categories } from '../src/constants/foodData';
import { fonts } from '../src/constants/typography';
import { useCart } from '../src/context/CartContext';
import { useTodaysMenu } from '../src/hooks/useFood';
import { SearchBar } from '../src/components/food/SearchBar';
import { CategoryTabs } from '../src/components/food/CategoryTabs';
import { ViewOrderBar } from '../src/components/food/ViewOrderBar';
import { ms } from '../src/utils/responsive';

// The first entry in `categories` is treated as the "show everything" tab.
const ALL_CATEGORY = categories[0];

function MenuRow({ item }: { item: MenuItem }) {
  const { addItem, setQty, quantityOf } = useCart();
  const qty = quantityOf(item.id);
  const priceFmt = `₦${item.price.toLocaleString('en-US')}`;

  const handlePlus = () => {
    if (qty > 0) setQty(item.id, qty + 1);
    else addItem(item, 1);
  };

  const handleMinus = () => {
    if (qty > 1) setQty(item.id, qty - 1);
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.body}>
        <Text style={styles.partnerName} numberOfLines={1}>{item.partnerName}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.metaRow}>
          <Feather name="star" size={ms(10)} color={foodColors.primary} />
          <Text style={styles.meta}>{item.rating} • {item.etaMinutes} min</Text>
        </View>
        <Text style={styles.price}>{priceFmt}</Text>
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepBtn, qty <= 1 && styles.controlDisabled]}
          onPress={handleMinus}
          disabled={qty <= 1}
        >
          <Feather name="minus" size={ms(13)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{qty}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={handlePlus}>
          <Feather name="plus" size={ms(13)} color={foodColors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TodaysMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { quantityOf } = useCart();
  const { items: menuItems } = useTodaysMenu();
  const todaysMenu: MenuItem[] = menuItems ?? [];

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory>(ALL_CATEGORY);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return todaysMenu.filter((item) => {
      const matchesCategory =
        category === ALL_CATEGORY || (item as MenuItem & { category?: string }).category === category;
      const matchesQuery =
        !q || item.name.toLowerCase().includes(q) || item.partnerName.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [todaysMenu, query, category]);

  const { itemCount, total } = todaysMenu.reduce(
    (acc, item) => {
      const qty = quantityOf(item.id);
      return { itemCount: acc.itemCount + qty, total: acc.total + qty * item.price };
    },
    { itemCount: 0, total: 0 }
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={ms(22)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Today's Menu</Text>
          <Text style={styles.subtitle}>Fresh, hot and ready to order</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <SearchBar value={query} onChangeText={setQuery} />
        <View style={styles.categoriesWrap}>
          <CategoryTabs active={category} onSelect={setCategory} />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MenuRow item={item} />}
        extraData={itemCount}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No meals found</Text>
            <Text style={styles.emptyText}>Try another category or a different search.</Text>
          </View>
        }
      />

      {itemCount > 0 && (
        <View style={[styles.orderBarWrap, { paddingBottom: insets.bottom + 12 }]}>
          <ViewOrderBar
            itemCount={itemCount}
            total={total}
            onPress={() => router.push('/cart' as any)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
    paddingHorizontal: ms(20),
    marginBottom: ms(14),
  },
  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: ms(24),
    lineHeight: ms(30),
    letterSpacing: -0.4,
    fontFamily: fonts.serif.medium,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },

  filters: { paddingHorizontal: ms(20), marginBottom: ms(14) },
  categoriesWrap: { marginTop: ms(14) },

  list: { paddingHorizontal: ms(20) },
  separator: { height: ms(12) },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(10),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  image: { width: ms(72), height: ms(72), borderRadius: ms(14) },
  body: { flex: 1, minWidth: 0 },
  partnerName: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.3,
    color: foodColors.primary,
  },
  name: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: ms(1),
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: ms(3), marginTop: ms(2) },
  meta: { fontSize: ms(10), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  price: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: ms(4),
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: ms(6),
    height: ms(30),
    width: ms(74),
  },
  stepBtn: { width: ms(20), height: ms(20), justifyContent: 'center', alignItems: 'center' },
  stepValue: { fontSize: ms(12), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  controlDisabled: { opacity: 0.35 },

  orderBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: ms(10),
    backgroundColor: foodColors.background,
  },

  empty: { alignItems: 'center', paddingTop: ms(60) },
  emptyTitle: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  emptyText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(4),
  },
});