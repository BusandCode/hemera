// src/components/food/FoodTabBar.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

type TabItem = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
};

const tabs: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home', route: '/' },
  { key: 'echop', label: 'E-Chop', icon: 'coffee', route: '/echop' },
  { key: 'ewash', label: 'E-Wash', icon: 'droplet', route: '/wash' },
  { key: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
];

export function FoodTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname === route;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => router.replace(tab.route as any)}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Feather
                name={tab.icon}
                size={active ? 20 : 22}
                color={active ? '#fff' : foodColors.textMuted}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: foodColors.surface,
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: foodColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: foodColors.tabColor,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
  labelActive: {
    color: foodColors.tabColor,
    fontFamily: fonts.poppins.bold,
  },
});