import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home', route: '/e-plan' },
  { key: 'e-plan', label: 'E-Plan', icon: 'coffee', route: '/e-plan-setup' },
  { key: 'my-plan', label: 'My Plan', icon: 'file-text', route: '/my-plan' },
  { key: 'payments', label: 'Payments', icon: 'credit-card', route: '/payments' },
] as const;

// All routes that belong to the E-Plan journey — used so the E-Plan tab
// stays highlighted across the whole setup flow.
const EPLAN_FLOW = [
  '/e-plan-setup',
  '/e-plan-exclusions',
  '/e-plan-review',
  '/e-plan-success',
];

export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        let isActive = false;

        if (tab.key === 'home') {
          // Home only matches when the path is exactly the home route
          isActive = pathname === '/e-plan';
        } else if (tab.key === 'e-plan') {
          // E-Plan is active across the entire setup flow
          isActive = EPLAN_FLOW.some((r) => pathname === r || pathname.startsWith(`${r}/`));
        } else {
          // Other tabs match by exact route or prefix (e.g. /payments/history)
          isActive = pathname === tab.route || pathname.startsWith(`${tab.route}/`);
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => router.push(tab.route as any)}
          >
            <Feather
              name={tab.icon as any}
              size={22}
              color={isActive ? '#161311' : foodColors.textMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
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
    borderTopWidth: 1,
    borderTopColor: foodColors.border,
    paddingTop: 12,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10.5,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textMuted,
  },
  tabLabelActive: {
    fontFamily: fonts.poppins.bold,
    color: '#161311',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: foodColors.primary,
  },
});