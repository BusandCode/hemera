import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { usePartners } from '../src/hooks/useFood';
import { useFavorites } from '../src/context/FavoritesContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { partners, loading, error } = usePartners();

  const favoritePartners = partners.filter((p) => favoriteIds.includes(p.id));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favourite Restaurants</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={foodColors.primary} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Feather name="alert-circle" size={ms(28)} color={foodColors.textMuted} />
            <Text style={styles.emptyTitle}>Couldn't load your favourites</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : favoritePartners.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="heart" size={ms(28)} color={foodColors.textMuted} />
            <Text style={styles.emptyTitle}>You have no favourites</Text>
            <Text style={styles.emptyText}>
              Tap the heart on a restaurant to save it here.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.replace('/echop' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.browseBtnText}>Browse Restaurants</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {favoritePartners.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({ pathname: '/partner/[id]', params: { id: p.id } } as any)
                }
              >
                {p.image ? (
                  <Image source={{ uri: p.image }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Feather name="image" size={ms(18)} color={foodColors.textMuted} />
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <View style={styles.metaRow}>
                    <Feather name="star" size={ms(11)} color={foodColors.primary} />
                    <Text style={styles.metaText}>{p.rating} • {p.etaMinutes} min</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => toggleFavorite(p.id)}
                  activeOpacity={0.85}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="heart" size={ms(18)} color={foodColors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(40) },
  loader: { marginTop: ms(60) },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    paddingHorizontal: ms(20),
    paddingBottom: ms(16),
  },
  backButton: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(80),
    gap: ms(8),
  },
  emptyTitle: {
    fontSize: ms(16),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginTop: ms(8),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  browseBtn: {
    marginTop: ms(16),
    backgroundColor: foodColors.primary,
    paddingHorizontal: ms(20),
    paddingVertical: ms(10),
    borderRadius: ms(20),
  },
  browseBtnText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  list: { gap: ms(12) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(10),
    gap: ms(12),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardImage: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(12),
  },
  cardImagePlaceholder: {
    backgroundColor: foodColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: ms(4), marginTop: ms(3) },
  metaText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  heartBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: foodColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});