import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { partners } from '../src/constants/foodData';
import { useFavorites } from '../src/context/FavoritesContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const favoritePartners = partners.filter((p) => favoriteIds.includes(p.id));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favourite Restaurants</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {favoritePartners.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="heart" size={28} color={foodColors.textMuted} />
            <Text style={styles.emptyTitle}>No favourites yet</Text>
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
                <Image source={{ uri: p.image }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <View style={styles.metaRow}>
                    <Feather name="star" size={11} color={foodColors.primary} />
                    <Text style={styles.metaText}>{p.rating} • {p.etaMinutes} min</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => toggleFavorite(p.id)}
                  activeOpacity={0.85}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="heart" size={18} color={foodColors.primary} />
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  browseBtn: {
    marginTop: 16,
    backgroundColor: foodColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  browseBtnText: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: {
    fontSize: 15,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: foodColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});