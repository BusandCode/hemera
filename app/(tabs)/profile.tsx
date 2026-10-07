// app/(tabs)/profile.tsx
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { ms } from '../../src/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';
import { useFavorites } from '../../src/context/FavoritesContext';

type MenuItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  route?: string;
  comingSoon?: boolean;
  highlight?: boolean;
};

const accountItems: MenuItem[] = [
  { id: 'wallet', icon: 'credit-card', title: 'Wallet', route: '/wallet' },
  { id: 'transactions', icon: 'file-text', title: 'Transactions', route: '/transactions' },
  { id: 'personal', icon: 'user', title: 'Personal Information', route: '/personal-information' },
  { id: 'addresses', icon: 'map-pin', title: 'Saved Addresses', route: '/saved-addresses' },
  { id: 'payment', icon: 'credit-card', title: 'Payment Methods', route: '/payment-methods' },
  { id: 'security', icon: 'shield', title: 'Security', route: '/security' },
];

const subscriptionItems: MenuItem[] = [
  { id: 'subscriptions', icon: 'repeat', title: 'Subscriptions', route: '/subscriptions' },
];

const orderItems: MenuItem[] = [
  { id: 'my-orders', icon: 'package', title: 'My Orders', route: '/my-orders' },
  { id: 'echop-orders', icon: 'coffee', title: 'E-Chop Orders', route: '/echop-orders' },
  { id: 'ewash-orders', icon: 'droplet', title: 'E-Wash Orders', route: '/ewash-orders' },
  { id: 'order-history', icon: 'clock', title: 'Order History', route: '/order-history' },
];

const referralItems: MenuItem[] = [
  { id: 'refer-earn', icon: 'gift', title: 'Refer & Earn', route: '/refer-earn', highlight: true },
];

const favoriteItems: MenuItem[] = [
  { id: 'favorites', icon: 'heart', title: 'Favourite Restaurants', route: '/favorites' },
];

const preferenceItems: MenuItem[] = [
  { id: 'notifications', icon: 'bell', title: 'Notifications', route: '/notification-settings' },
  { id: 'language', icon: 'globe', title: 'Language & Location', route: '/language-location' },
  { id: 'delivery', icon: 'truck', title: 'Delivery Preferences', comingSoon: true },
  { id: 'terms', icon: 'file-text', title: 'Terms of Service', route: '/terms-of-service' },
];

const supportItems: MenuItem[] = [
  { id: 'live-chat', icon: 'message-circle', title: 'Live Chat', route: '/live-chat' },
  { id: 'help', icon: 'help-circle', title: 'Help Center', route: '/help-center' },
  { id: 'contact', icon: 'phone', title: 'Contact Support', route: '/contact-support' },
];

function MenuSection({
  title,
  items,
  onPressItem,
}: {
  title: string;
  items: MenuItem[];
  onPressItem: (item: MenuItem) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isLast && styles.menuItemLast,
                item.highlight && styles.menuItemHighlight,
              ]}
              onPress={() => onPressItem(item)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    item.highlight && styles.iconContainerHighlight,
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={18}
                    color={item.highlight ? '#fff' : foodColors.textPrimary}
                  />
                </View>
                <View style={styles.menuItemTextBlock}>
                  <Text
                    style={[
                      styles.menuItemText,
                      item.highlight && styles.menuItemTextHighlight,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.comingSoon && (
                    <Text style={styles.menuItemBadge}>Coming soon</Text>
                  )}
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={item.highlight ? '#fff' : foodColors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function FoodProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { signOut, displayName } = useAuth();
  const { favoriteIds } = useFavorites();
  const [comingSoonItem, setComingSoonItem] = useState<MenuItem | null>(null);
  const popAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (comingSoonItem) {
      popAnim.setValue(0);
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [comingSoonItem, popAnim]);

  const handleItemPress = (item: MenuItem) => {
    if (item.comingSoon) {
      setComingSoonItem(item);
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth' as any);
        },
      },
    ]);
  };

  const fullName = profile?.fullName?.trim() || displayName || 'Your name';

  const avatarSource = profile.photoUri
    ? { uri: profile.photoUri }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fullName
        )}&background=FF6B35&color=fff&size=120`,
      };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(12) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/edit-profile' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Image source={avatarSource} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={13} color={foodColors.primary} />
                <Text style={styles.verifiedText}>Verified · Tap to edit profile</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
          </View>
        </TouchableOpacity>

        <MenuSection title="ACCOUNT" items={accountItems} onPressItem={handleItemPress} />
        <MenuSection title="SUBSCRIPTIONS" items={subscriptionItems} onPressItem={handleItemPress} />
        <MenuSection title="ORDERS" items={orderItems} onPressItem={handleItemPress} />
        <MenuSection title="REFERRAL" items={referralItems} onPressItem={handleItemPress} />
        <MenuSection
          title={favoriteIds.length ? `FAVOURITES (${favoriteIds.length})` : 'FAVOURITES'}
          items={favoriteItems}
          onPressItem={handleItemPress}
        />
        <MenuSection title="PREFERENCES" items={preferenceItems} onPressItem={handleItemPress} />
        <MenuSection title="HELP & SUPPORT" items={supportItems} onPressItem={handleItemPress} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Feather name="log-out" size={18} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FoodTabBar />

      <Modal
        visible={!!comingSoonItem}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setComingSoonItem(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: popAnim,
                transform: [
                  {
                    scale: popAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalIconRing}>
              <View style={styles.modalIconCircle}>
                <Feather
                  name={comingSoonItem?.icon ?? 'clock'}
                  size={ms(26)}
                  color="#fff"
                />
              </View>
            </View>
            <View style={styles.modalPill}>
              <Text style={styles.modalPillText}>COMING SOON</Text>
            </View>
            <Text style={styles.modalTitle}>{comingSoonItem?.title}</Text>
            <Text style={styles.modalText}>
              We're working on this feature and it will be available in a future update.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setComingSoonItem(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingTop: 0, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(16),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },

  profileCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: ms(30),
    backgroundColor: foodColors.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: foodColors.primary,
    width: 20,
    height: 20,
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: foodColors.surface,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    marginTop: ms(2),
  },
  verifiedText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textSecondary,
    flexShrink: 1,
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: ms(8),
  },
  sectionContent: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemHighlight: { backgroundColor: '#E23A2E' },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    flex: 1,
    minWidth: 0,
  },
  menuItemTextBlock: { flex: 1, minWidth: 0 },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: ms(8),
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerHighlight: { backgroundColor: 'rgba(255,255,255,0.2)' },
  menuItemText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },
  menuItemTextHighlight: {
    color: '#fff',
    fontFamily: fonts.poppins.bold,
  },
  menuItemBadge: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
    marginTop: ms(1),
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    paddingVertical: ms(14),
    marginTop: ms(8),
  },
  logoutText: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.semiBold,
    color: '#FF3B30',
  },

  bottomSpacer: { height: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '8%',
  },
  modalCard: {
    width: '100%',
    backgroundColor: foodColors.surface,
    borderRadius: ms(24),
    paddingHorizontal: ms(24),
    paddingTop: ms(28),
    paddingBottom: ms(22),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalIconRing: {
    width: ms(88),
    height: ms(88),
    borderRadius: ms(44),
    backgroundColor: 'rgba(255,107,53,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(16),
  },
  modalIconCircle: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPill: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: ms(10),
    marginBottom: ms(10),
  },
  modalPillText: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(8),
    textAlign: 'center',
  },
  modalText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(20),
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: ms(22),
  },
  modalButton: {
    width: '100%',
    backgroundColor: foodColors.primary,
    paddingVertical: ms(14),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});