import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, ms(10)) }]}>
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
            onPress={() => {
              if (pathname === tab.route) return;
              router.replace(tab.route as any);
            }}
          >
            <Feather
              name={tab.icon as any}
              size={ms(22)}
              color={isActive ? '#161311' : foodColors.textMuted}
            />
            <Text
              style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
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
    paddingTop: ms(12),
    paddingHorizontal: ms(10),
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
    gap: ms(4),
    position: 'relative',
  },
  tabLabel: {
    fontSize: ms(10.5),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textMuted,
  },
  tabLabelActive: {
    fontFamily: fonts.poppins.bold,
    color: '#161311',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -ms(12),
    width: ms(20),
    height: 3,
    borderRadius: ms(1.5),
    backgroundColor: foodColors.primary,
  },
});