// Search results on the E-Chop screen: restaurants (by name or what they serve) and meals
// (by name, description, category or restaurant). Shown in place of the normal E-Chop content
// while there is text in the search bar.
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { useAllMenuItems, usePartners } from '../../hooks/useFood';
import { searchMatch } from '../../utils/search';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';
import { PartnerCard } from './PartnerCard';
import { MenuItemCard } from './MenuItemCard';

const GAP = 10;

export function EChopSearchResults({ query, sidePadding = 16 }: { query: string; sidePadding?: number }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { partners, loading: loadingPartners } = usePartners();
  const { items, loading: loadingItems } = useAllMenuItems();

  const restaurants = partners.filter((p) => searchMatch(query, p.name, p.cuisine));
  const meals = items.filter((it) =>
    searchMatch(query, it.name, it.description, it.category, it.partnerName, it.storeName)
  );

  const columns = width >= 600 ? 3 : 2;
  const cardWidth = (width - sidePadding * 2 - GAP * (columns - 1)) / columns;
  const loading = (loadingPartners && partners.length === 0) || (loadingItems && items.length === 0);

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={foodColors.primary} />
      </View>
    );
  }

  if (restaurants.length === 0 && meals.length === 0) {
    return (
      <View style={styles.state}>
        <View style={styles.stateIcon}>
          <Feather name="search" size={ms(22)} color={foodColors.primary} />
        </View>
        <Text style={styles.stateTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          No results for “{query.trim()}”
        </Text>
        <Text style={styles.stateText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          Try another meal or restaurant name, like “jollof”, “suya” or “swallow”.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: ms(18) }}>
      {restaurants.length > 0 && (
        <View>
          <Text style={styles.heading} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            RESTAURANTS ({restaurants.length})
          </Text>
          <View style={styles.grid}>
            {restaurants.map((p) => (
              <PartnerCard
                key={p.id}
                partner={p}
                width={cardWidth}
                onPress={() => router.push({ pathname: '/partner/[id]', params: { id: p.id } } as any)}
              />
            ))}
          </View>
        </View>
      )}

      {meals.length > 0 && (
        <View>
          <Text style={styles.heading} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            MEALS ({meals.length})
          </Text>
          <View style={{ gap: ms(12) }}>
            {meals.slice(0, 50).map((it) => (
              <MenuItemCard key={it.id} item={it} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: ms(8),
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  state: { alignItems: 'center', paddingVertical: ms(40), paddingHorizontal: ms(24), gap: ms(6) },
  stateIcon: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(16),
    backgroundColor: foodColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(6),
  },
  stateTitle: { fontSize: ms(15), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, textAlign: 'center' },
  stateText: {
    fontSize: ms(12.5),
    lineHeight: ms(18),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
  },
});
