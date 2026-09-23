#!/usr/bin/env bash
set -e

mkdir -p src/constants src/components/food src/components/wash app/food app/wash

cat > src/constants/foodColors.ts <<'ENDOFFILE'
export const foodColors = {
  background: '#FBF7F2',
  surface: '#FFFFFF',
  border: '#F0E9E0',
  primary: '#E23A2E',
  primaryDark: '#1A1A1A',
  primaryLight: 'rgba(226,58,46,0.1)',
  textPrimary: '#1A1A1A',
  textSecondary: '#8A8580',
  textMuted: '#B5AFA8',
  badgeBlue: '#2E5AAC',
  success: '#34C759',
  popularBg: 'rgba(226,58,46,0.1)',
  popularText: '#E23A2E',
};
ENDOFFILE

cat > src/constants/washColors.ts <<'ENDOFFILE'
export const washColors = {
  background: '#FCF8F5',
  surface: '#FFFFFF',
  navyStart: '#00133F',
  navyEnd: '#0B2472',
  navySolid: '#0B2472',
  red: '#E0141C',
  redDark: '#C10007',
  gold: '#FCEFD8',
  goldBorder: '#E2D3A0',
  textPrimary: '#14143A',
  textSecondary: '#6B6E80',
  textMuted: '#9A9DAE',
  border: '#EDEAE4',
  divider: '#EFEDE8',
  grayBorder: '#D9DCE3',
  overlay: 'rgba(255,255,255,0.14)',
  overlayBorder: 'rgba(255,255,255,0.28)',
  whiteText85: 'rgba(255,255,255,0.85)',
  coveredBg: '#EEF4FB',
  coveredText: '#1B2A63',
};
ENDOFFILE

cat > src/constants/foodData.ts <<'ENDOFFILE'
export type FoodCategory = 'All' | 'Rice Dishes' | 'Swallow' | 'Soups' | 'Grills' | 'Drinks';
export const categories: FoodCategory[] = ['All', 'Rice Dishes', 'Swallow', 'Soups', 'Grills', 'Drinks'];

export type Partner = { id: string; name: string; rating: number; etaMinutes: number; image: string; logo: string; };
export const partners: Partner[] = [
  { id: 'mama-titis', name: "Mama Titi's", rating: 4.8, etaMinutes: 20,
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
    logo: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=100&q=80' },
  { id: 'suya-spot', name: 'Suya Spot', rating: 4.9, etaMinutes: 15,
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80',
    logo: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=100&q=80' },
];

export type MenuItem = { id: string; partnerName: string; isPopular: boolean; name: string; description: string; price: number; rating: number; etaMinutes: number; image: string; };
export const todaysMenu: MenuItem[] = [
  { id: 'party-jollof', partnerName: "MAMA TITI'S", isPopular: true, name: 'Party Jollof Rice',
    description: 'Smoky firewood jollof with fried plantain and coleslaw',
    price: 4000, rating: 4.9, etaMinutes: 20,
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80' },
];
ENDOFFILE

cat > app/_layout.tsx <<'ENDOFFILE'
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="food" />
          <Stack.Screen name="wash" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
ENDOFFILE

cat > app/index.tsx <<'ENDOFFILE'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../src/constants/foodColors';
import { washColors } from '../src/constants/washColors';

export default function Home() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <Text style={styles.brand}>E-CHOP · E-WASH</Text>
        <Text style={styles.title}>Everything you need,{'\n'}one app.</Text>
        <Text style={styles.subtitle}>Fresh meals and fresh laundry — delivered.</Text>
      </View>
      <View style={styles.cards}>
        <TouchableOpacity style={[styles.card, { backgroundColor: foodColors.primaryDark }]} onPress={() => router.push('/food')} activeOpacity={0.85}>
          <View style={styles.cardIcon}><Feather name="coffee" size={22} color="#fff" /></View>
          <Text style={styles.cardTitle}>E-Chop</Text>
          <Text style={styles.cardSubtitle}>Order food from nearby partners</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, { backgroundColor: washColors.navySolid }]} onPress={() => router.push('/wash')} activeOpacity={0.85}>
          <View style={styles.cardIcon}><Feather name="droplet" size={22} color="#fff" /></View>
          <Text style={styles.cardTitle}>E-Wash</Text>
          <Text style={styles.cardSubtitle}>Laundry pickup & delivery on demand</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footer}>Pick a service to get started</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  hero: { marginBottom: 40 },
  brand: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: foodColors.primary, marginBottom: 14 },
  title: { fontSize: 34, fontWeight: '700', color: foodColors.textPrimary, lineHeight: 40, marginBottom: 12 },
  subtitle: { fontSize: 14, color: foodColors.textSecondary, lineHeight: 20 },
  cards: { flex: 1, gap: 16, justifyContent: 'center' },
  card: { borderRadius: 24, padding: 24, minHeight: 160, justifyContent: 'flex-end' },
  cardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  footer: { textAlign: 'center', fontSize: 12, color: foodColors.textMuted, marginTop: 24 },
});
ENDOFFILE

cat > app/food/_layout.tsx <<'ENDOFFILE'
import { Stack } from 'expo-router';
export default function FoodLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="cart" />
    </Stack>
  );
}
ENDOFFILE

cat > app/wash/_layout.tsx <<'ENDOFFILE'
import { Stack } from 'expo-router';
export default function WashLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
ENDOFFILE

cat > src/components/food/CategoryTabs.tsx <<'ENDOFFILE'
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { foodColors } from '../../constants/foodColors';
import { FoodCategory, categories } from '../../constants/foodData';

export function CategoryTabs({ active, onSelect }: { active: FoodCategory; onSelect: (c: FoodCategory) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((c) => {
        const isActive = c === active;
        return (
          <TouchableOpacity key={c} onPress={() => onSelect(c)} style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}>
            <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>{c}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  pillActive: { backgroundColor: foodColors.primaryDark, borderColor: foodColors.primaryDark },
  pillInactive: { backgroundColor: foodColors.surface, borderColor: foodColors.border },
  pillText: { fontSize: 12.5, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  pillTextInactive: { color: foodColors.textSecondary },
});
ENDOFFILE

cat > src/components/food/FoodHeader.tsx <<'ENDOFFILE'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';

export function FoodHeader({ location, notificationCount, cartCount, onPressLocation, onPressNotifications, onPressCart, onPressProfile }: {
  location: string; notificationCount: number; cartCount: number;
  onPressLocation?: () => void; onPressNotifications?: () => void; onPressCart?: () => void; onPressProfile?: () => void;
}) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.locationBlock} onPress={onPressLocation}>
        <Text style={styles.label}>DELIVERING TO</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>{location}</Text>
          <Feather name="chevron-down" size={14} color={foodColors.textPrimary} />
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onPressProfile}>
          <Feather name="user" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onPressNotifications}>
          <Feather name="bell" size={18} color={foodColors.textPrimary} />
          {notificationCount > 0 && <View style={[styles.badge, { backgroundColor: foodColors.badgeBlue }]}><Text style={styles.badgeText}>{notificationCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onPressCart}>
          <Feather name="shopping-cart" size={18} color={foodColors.textPrimary} />
          {cartCount > 0 && <View style={[styles.badge, { backgroundColor: foodColors.primary }]}><Text style={styles.badgeText}>{cartCount}</Text></View>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationBlock: {},
  label: { fontSize: 10, fontWeight: '700', color: foodColors.textMuted, letterSpacing: 0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 15, fontWeight: '700', color: foodColors.textPrimary },
  actions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: foodColors.background },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
});
ENDOFFILE

cat > src/components/food/FoodTabBar.tsx <<'ENDOFFILE'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { foodColors } from '../../constants/foodColors';

type TabItem = { key: string; label: string; icon: keyof typeof Feather.glyphMap; route: string };
const tabs: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home', route: '/' },
  { key: 'echop', label: 'E-Chop', icon: 'coffee', route: '/food' },
  { key: 'ewash', label: 'E-Wash', icon: 'droplet', route: '/wash' },
  { key: 'profile', label: 'Profile', icon: 'user', route: '/food/profile' },
];

export function FoodTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (route: string) => {
    if (route === '/food' && pathname === '/food') return true;
    if (route === '/food/profile' && pathname === '/food/profile') return true;
    return pathname === route;
  };
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => router.push(tab.route as any)}>
            <Feather name={tab.icon} size={22} color={active ? foodColors.primary : foodColors.textMuted} />
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: foodColors.surface, paddingVertical: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10, fontWeight: '600' },
  labelActive: { color: foodColors.primary },
  labelInactive: { color: foodColors.textMuted },
});
ENDOFFILE

cat > src/components/food/MenuItemCard.tsx <<'ENDOFFILE'
import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { MenuItem } from '../../constants/foodData';

export function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd?: (qty: number) => void }) {
  const [qty, setQty] = useState(1);
  const priceFmt = `₦${item.price.toLocaleString('en-US')}`;
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.partnerName}>{item.partnerName}</Text>
        {item.isPopular && <View style={styles.popularBadge}><Text style={styles.popularText}>🔥 POPULAR</Text></View>}
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{priceFmt}</Text>
          <View style={styles.metaRow}>
            <Feather name="star" size={10} color={foodColors.primary} />
            <Text style={styles.meta}>{item.rating} • {item.etaMinutes} min</Text>
          </View>
        </View>
      </View>
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.stepBtn}><Feather name="minus" size={11} color={foodColors.textPrimary} /></TouchableOpacity>
          <Text style={styles.stepValue}>{qty}</Text>
          <TouchableOpacity onPress={() => setQty((q) => q + 1)} style={styles.stepBtn}><Feather name="plus" size={11} color={foodColors.textPrimary} /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => onAdd?.(qty)}><Feather name="plus" size={16} color="#fff" /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: foodColors.surface, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  info: { flex: 1, paddingRight: 10 },
  partnerName: { fontSize: 10, fontWeight: '700', color: foodColors.primary, letterSpacing: 0.3 },
  popularBadge: { alignSelf: 'flex-start', backgroundColor: foodColors.popularBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  popularText: { fontSize: 9, fontWeight: '700', color: foodColors.popularText },
  name: { fontSize: 14, fontWeight: '700', color: foodColors.textPrimary, marginTop: 6 },
  description: { fontSize: 10.5, color: foodColors.textSecondary, marginTop: 2, lineHeight: 14 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { fontSize: 14, fontWeight: '700', color: foodColors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  meta: { fontSize: 10, color: foodColors.textSecondary },
  imageWrap: { width: 96, height: 96 },
  image: { width: '100%', height: '100%', borderRadius: 12 },
  stepper: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 4, height: 22, gap: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  stepBtn: { width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  stepValue: { fontSize: 11, fontWeight: '700', color: foodColors.textPrimary },
  addBtn: { position: 'absolute', bottom: -8, right: -8, width: 30, height: 30, borderRadius: 15, backgroundColor: foodColors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: foodColors.background },
});
ENDOFFILE

cat > src/components/food/NearbyPartners.tsx <<'ENDOFFILE'
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { foodColors } from '../../constants/foodColors';
import { partners } from '../../constants/foodData';
import { PartnerCard } from './PartnerCard';

export function NearbyPartners() {
  return (
    <View>
      <Text style={styles.heading}>NEARBY PARTNERS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {partners.map((p) => <PartnerCard key={p.id} partner={p} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 11, fontWeight: '700', color: foodColors.textMuted, letterSpacing: 0.5, marginBottom: 10 },
  row: { gap: 14, paddingRight: 20 },
});
ENDOFFILE

cat > src/components/food/PartnerCard.tsx <<'ENDOFFILE'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { Partner } from '../../constants/foodData';

export function PartnerCard({ partner, onPress }: { partner: Partner; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: partner.image }} style={styles.image} />
        <View style={styles.logo}><Image source={{ uri: partner.logo }} style={styles.logoImage} /></View>
      </View>
      <Text style={styles.name}>{partner.name}</Text>
      <View style={styles.metaRow}>
        <Feather name="star" size={11} color={foodColors.primary} />
        <Text style={styles.meta}>{partner.rating} • {partner.etaMinutes} min</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 160 },
  imageWrap: { width: 160, height: 100, borderRadius: 14, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  logo: { position: 'absolute', bottom: -14, left: 10, width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: foodColors.background, overflow: 'hidden', backgroundColor: '#fff' },
  logoImage: { width: '100%', height: '100%' },
  name: { fontSize: 13, fontWeight: '700', color: foodColors.textPrimary, marginTop: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontSize: 11, color: foodColors.textSecondary },
});
ENDOFFILE

cat > src/components/food/PromoBanner.tsx <<'ENDOFFILE'
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { foodColors } from '../../constants/foodColors';

export function PromoBanner() {
  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80' }} style={styles.banner} imageStyle={styles.image}>
      <View style={styles.overlay} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>Feed Your{'\n'}<Text style={styles.titleAccent}>Cravings.</Text></Text>
        <Text style={styles.subtitle}>Hot meals • Fast delivery</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: { height: 160, borderRadius: 18, overflow: 'hidden', justifyContent: 'center' },
  image: { resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,20,0.45)' },
  textBlock: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 30 },
  titleAccent: { color: foodColors.primary, fontStyle: 'italic' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
});
ENDOFFILE

cat > src/components/food/SearchBar.tsx <<'ENDOFFILE'
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';

export function SearchBar({ value, onChangeText }: { value?: string; onChangeText?: (text: string) => void }) {
  return (
    <View style={styles.wrapper}>
      <Feather name="search" size={16} color={foodColors.textMuted} />
      <TextInput style={styles.input} placeholder="Search meals, restaurants, bukas..." placeholderTextColor={foodColors.textMuted} value={value} onChangeText={onChangeText} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: foodColors.surface, borderRadius: 14, paddingHorizontal: 14, height: 46, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  input: { flex: 1, fontSize: 13, color: foodColors.textPrimary },
});
ENDOFFILE

cat > src/components/food/TodaysMenu.tsx <<'ENDOFFILE'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { foodColors } from '../../constants/foodColors';
import { todaysMenu } from '../../constants/foodData';
import { MenuItemCard } from './MenuItemCard';

export function TodaysMenu({ onAddItem }: { onAddItem?: (itemId: string, qty: number) => void }) {
  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Menu</Text>
          <Text style={styles.subtitle}>Fresh, hot and ready to order</Text>
        </View>
        <TouchableOpacity><Text style={styles.seeAll}>See All →</Text></TouchableOpacity>
      </View>
      <View style={{ gap: 12 }}>
        {todaysMenu.map((item) => (
          <MenuItemCard key={item.id} item={item} onAdd={(qty) => onAddItem?.(item.id, qty)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: foodColors.textPrimary },
  subtitle: { fontSize: 11, color: foodColors.textSecondary, marginTop: 2 },
  seeAll: { fontSize: 12, fontWeight: '600', color: foodColors.primary },
});
ENDOFFILE

cat > src/components/food/ViewOrderBar.tsx <<'ENDOFFILE'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';

export function ViewOrderBar({ itemCount, total, onPress }: { itemCount: number; total: number; onPress?: () => void }) {
  if (itemCount === 0) return null;
  const totalFmt = `₦${total.toLocaleString('en-US')}`;
  return (
    <TouchableOpacity style={styles.bar} onPress={onPress}>
      <View style={styles.countBadge}><Text style={styles.countText}>{itemCount}</Text></View>
      <Text style={styles.label}>View Order</Text>
      <Text style={styles.total}>{totalFmt}</Text>
      <Feather name="chevron-right" size={16} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: foodColors.primaryDark, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16 },
  countBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  countText: { fontSize: 11, fontWeight: '700', color: foodColors.primaryDark },
  label: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  total: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
ENDOFFILE

cat > src/components/wash/WashTabBar.tsx <<'ENDOFFILE'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { washColors } from '../../constants/washColors';

type TabItem = { key: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; route: string };
const tabs: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', route: '/' },
  { key: 'echop', label: 'E-Chop', icon: 'room-service-outline', route: '/food' },
  { key: 'ewash', label: 'E-Wash', icon: 'washing-machine', route: '/wash' },
  { key: 'profile', label: 'Profile', icon: 'account-outline', route: '/food/profile' },
];

export function WashTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (route: string) => {
    if (route === '/wash') return pathname === '/wash';
    return pathname === route;
  };
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => router.push(tab.route as any)}>
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <MaterialCommunityIcons name={tab.icon} size={active ? 20 : 22} color={active ? '#fff' : washColors.textMuted} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: washColors.surface, paddingVertical: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: washColors.border },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  iconWrapActive: { backgroundColor: washColors.redDark },
  label: { fontSize: 11, fontWeight: '600', color: washColors.textMuted },
  labelActive: { color: washColors.red, fontWeight: '700' },
});
ENDOFFILE

echo "✅ Part 1 complete."