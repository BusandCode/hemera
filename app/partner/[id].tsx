import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { partnerDetails, PartnerCategory } from '../../src/constants/foodData';
import { MenuItemCard } from '../../src/components/food/MenuItemCard';
import { SearchBar } from '../../src/components/food/SearchBar';
import { ViewOrderBar } from '../../src/components/food/ViewOrderBar';
import { useCart } from '../../src/context/CartContext';
import { useFavorites } from '../../src/context/FavoritesContext';

export default function PartnerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const partner = partnerDetails[id as string];

  const { itemCount, total } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const [reviewCount, setReviewCount] = useState(partner?.reviewCount ?? 0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setReviewCount(partner?.reviewCount ?? 0);
  }, [partner?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const favorited = partner ? isFavorite(partner.id) : false;

  const handleToggleFavorite = () => {
    if (!partner) return;
    toggleFavorite(partner.id);
    if (!favorited) {
      setReviewCount((c) => c + 1);
      setToast('Added to favourites');
    } else {
      setReviewCount((c) => c - 1);
      setToast('Removed from favourites');
    }
  };

  const visibleCategories = useMemo<PartnerCategory[]>(() => {
    if (!partner) return [];

    const q = query.trim().toLowerCase();

    return partner.categories
      .filter((c) => activeCategory === 'all' || c.id === activeCategory)
      .map((c) => ({
        ...c,
        items: q
          ? c.items.filter(
              (it) =>
                it.name.toLowerCase().includes(q) ||
                it.description.toLowerCase().includes(q)
            )
          : c.items,
      }))
      .filter((c) => c.items.length > 0);
  }, [partner, activeCategory, query]);

  if (!partner) {
    return (
      <View style={styles.notFound}>
        <StatusBar style="dark" />
        <Text style={styles.notFoundText}>Partner not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero image with overlay */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: partner.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />

          <TouchableOpacity
            style={[styles.heroBtn, styles.heroBtnLeft]}
            onPress={() => router.back()}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.heroBtn, styles.heroBtnRight]}
            onPress={handleToggleFavorite}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name="heart"
              size={18}
              color={favorited ? foodColors.primary : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {/* Partner identity card */}
        <View style={styles.identityCard}>
          <View style={styles.logoWrap}>
            <Image source={partner.logo} style={styles.logoImage} resizeMode="cover" />
          </View>

          <Text style={styles.partnerName}>{partner.name}</Text>
          <Text style={styles.tagline}>{partner.tagline}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="star" size={12} color={foodColors.primary} />
              <Text style={styles.metaStrong}>{partner.rating}</Text>
              <Text style={styles.metaMuted}>({reviewCount})</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={foodColors.textSecondary} />
              <Text style={styles.metaMuted}>{partner.etaMinutes} min</Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.openChip, partner.openNow ? styles.openChipYes : styles.openChipNo]}>
              <View
                style={[
                  styles.openDot,
                  { backgroundColor: partner.openNow ? foodColors.success : foodColors.textMuted },
                ]}
              />
              <Text style={styles.openText}>
                {partner.openNow ? 'Open now' : 'Closed'}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{partner.priceLevel}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{partner.cuisine}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Feather name="map-pin" size={13} color={foodColors.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {partner.address}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="clock" size={13} color={foodColors.textSecondary} />
            <Text style={styles.infoText}>{partner.hours}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} />
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          <TouchableOpacity
            style={[styles.tab, activeCategory === 'all' && styles.tabActive]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.tabText, activeCategory === 'all' && styles.tabTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>

          {partner.categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Menu sections */}
        {visibleCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={22} color={foodColors.textMuted} />
            <Text style={styles.emptyStateText}>No items match your search.</Text>
          </View>
        ) : (
          visibleCategories.map((cat) => (
            <View key={cat.id} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{cat.title}</Text>
              <View style={styles.menuList}>
                {cat.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          ))
        )}

        {/* Reviews */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.ratingBubble}>
              <Feather name="star" size={11} color={foodColors.primary} />
              <Text style={styles.ratingBubbleText}>{partner.rating}</Text>
            </View>
          </View>

          <View style={styles.reviewsList}>
            {partner.reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{rev.initials}</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewAuthor}>{rev.author}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Feather
                          key={i}
                          name="star"
                          size={10}
                          color={i < rev.rating ? foodColors.primary : foodColors.border}
                        />
                      ))}
                      <Text style={styles.reviewDate}>{rev.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* View Order bar — appears when cart has items */}
      <View style={styles.orderBarWrap}>
        <ViewOrderBar
          itemCount={itemCount}
          total={total}
          onPress={() => router.push('/cart' as any)}
        />
      </View>

      {/* Favourite toast */}
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Feather name="heart" size={14} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },

  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: foodColors.background,
    gap: 8,
  },
  notFoundText: { fontSize: 16, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  notFoundLink: { fontSize: 14, fontFamily: fonts.poppins.medium, color: foodColors.badgeBlue },

  heroWrap: { width: '100%', height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroBtn: {
    position: 'absolute',
    top: 48,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnLeft: { left: 16 },
  heroBtnRight: { right: 16 },

  identityCard: {
    marginTop: -50,
    marginHorizontal: 20,
    backgroundColor: foodColors.surface,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: foodColors.surface,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginTop: -46,
    marginBottom: 8,
  },
  logoImage: { width: '100%', height: '100%' },
  partnerName: {
    fontSize: 22,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  tagline: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaStrong: { fontSize: 12.5, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  metaMuted: { fontSize: 12, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: foodColors.textMuted },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 12 },
  chip: {
    backgroundColor: foodColors.background,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  chipText: { fontSize: 11, fontFamily: fonts.poppins.medium, color: foodColors.textSecondary },
  openChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  openChipYes: { backgroundColor: 'rgba(52,199,89,0.12)' },
  openChipNo: { backgroundColor: 'rgba(181,175,168,0.15)' },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 11, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  infoText: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    flex: 1,
  },

  searchWrap: { paddingHorizontal: 20, marginTop: 16 },

  tabsRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: foodColors.surface,
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  tabActive: { backgroundColor: foodColors.primary, borderColor: foodColors.primary },
  tabText: { fontSize: 12, fontFamily: fonts.poppins.medium, color: foodColors.textSecondary },
  tabTextActive: { color: '#fff' },

  menuSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 12,
  },
  menuList: { gap: 12 },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },

  reviewsSection: { paddingHorizontal: 20, marginTop: 4 },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ratingBubbleText: { fontSize: 12, fontFamily: fonts.poppins.bold, color: foodColors.primary },

  reviewsList: { gap: 12 },
  reviewCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: foodColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 12, fontFamily: fonts.poppins.bold, color: '#fff' },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  reviewDate: {
    fontSize: 10.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },

  bottomSpacer: { height: 24 },

  orderBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 16,
  },

  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: foodColors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },
});