// app/(tabs)/profile.tsx
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';
import { useProfile } from '../../src/context/ProfileContext';
import { useAuth } from '../../src/context/AuthContext';
import { useOnboarding } from '../../src/context/OnboardingContext';

type MenuItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  route?: string;
  comingSoon?: boolean;
  highlight?: boolean;
};

const accountItems: MenuItem[] = [
  { id: 'personal', icon: 'user', title: 'Personal Information', route: '/personal-information' },
  { id: 'addresses', icon: 'map-pin', title: 'Saved Addresses', route: '/saved-addresses' },
  { id: 'payment', icon: 'credit-card', title: 'Payment Methods', route: '/payment-methods' },
  { id: 'security', icon: 'shield', title: 'Security', route: '/security' },
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

const preferenceItems: MenuItem[] = [
  { id: 'notifications', icon: 'bell', title: 'Notifications', route: '/notification-settings' },
  { id: 'language', icon: 'globe', title: 'Language & Location', route: '/language-location' },
  { id: 'delivery', icon: 'truck', title: 'Delivery Preferences', comingSoon: true },
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
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();

  const handleItemPress = (item: MenuItem) => {
    if (item.comingSoon) {
      Alert.alert(
        'Coming Soon',
        `${item.title} will be available in a future update.`,
        [{ text: 'OK', style: 'default' }]
      );
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

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will sign you out and take you through the welcome flow again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            await signOut();
            router.replace('/onboarding' as any);
          },
        },
      ]
    );
  };

  const avatarSource = profile.photoUri
    ? { uri: profile.photoUri }
    : {
        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          profile.fullName
        )}&background=FF6B35&color=fff&size=120`,
      };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={13} color={foodColors.primary} />
                <Text style={styles.verifiedText}>Verified · Tap to edit profile</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
          </View>
        </TouchableOpacity>

        <MenuSection title="ACCOUNT" items={accountItems} onPressItem={handleItemPress} />
        <MenuSection title="ORDERS" items={orderItems} onPressItem={handleItemPress} />
        <MenuSection title="REFERRAL" items={referralItems} onPressItem={handleItemPress} />
        <MenuSection title="PREFERENCES" items={preferenceItems} onPressItem={handleItemPress} />
        <MenuSection title="HELP & SUPPORT" items={supportItems} onPressItem={handleItemPress} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Feather name="log-out" size={18} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetOnboarding}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={15} color={foodColors.primary} />
            <Text style={styles.resetButtonText}>Reset Onboarding</Text>
            {/* <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV</Text>
            </View> */}
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FoodTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 46, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },

  profileCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: foodColors.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: foodColors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: foodColors.surface,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 18,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textSecondary,
    flexShrink: 1,
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
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
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemHighlight: { backgroundColor: '#E23A2E' },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  menuItemTextBlock: { flex: 1, minWidth: 0 },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerHighlight: { backgroundColor: 'rgba(255,255,255,0.2)' },
  menuItemText: {
    fontSize: 14,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },
  menuItemTextHighlight: {
    color: '#fff',
    fontFamily: fonts.poppins.bold,
  },
  menuItemBadge: {
    fontSize: 10,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
    marginTop: 1,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: fonts.poppins.semiBold,
    color: '#FF3B30',
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: foodColors.primary,
    backgroundColor: foodColors.surface,
  },
  resetButtonText: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  bottomSpacer: { height: 20 },
});