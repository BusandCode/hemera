import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { foodColors } from '../../constants/foodColors';
import { useTodaysMenu } from '../../hooks/useFood';
import { MenuItemCard } from './MenuItemCard';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

export function TodaysMenu() {
  const router = useRouter();
  const { items: todaysMenu, loading, error } = useTodaysMenu();

  useEffect(() => {
    if (error) console.warn('[TodaysMenu] Supabase error:', error);
  }, [error]);

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Today's Menu
          </Text>
          <Text style={styles.subtitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Fresh, hot and ready to order
          </Text>
        </View>
        <TouchableOpacity
          style={styles.seeAllBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/todays-menu' as any)}
        >
          <Text style={styles.seeAll} maxFontSizeMultiplier={MAX_FONT_SCALE}>See All</Text>
          <Feather name="arrow-right" size={ms(14)} color={foodColors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={foodColors.primary} />
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>Couldn't load the menu</Text>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : todaysMenu.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>No meals yet</Text>
          <Text style={styles.stateText}>
            Nothing is marked as today's pick right now. Check back soon.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {todaysMenu.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: ms(10),
    marginBottom: ms(12),
  },
  headerText: { flex: 1, minWidth: 0 },
  title: {
    fontSize: ms(26),
    lineHeight: ms(33),
    letterSpacing: -0.5,
    fontFamily: fonts.serif.medium,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: -1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: ms(8),
  },
  seeAll: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  list: { gap: ms(12) },
  state: { alignItems: 'center', paddingVertical: ms(32), paddingHorizontal: ms(16) },
  stateTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  stateText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});