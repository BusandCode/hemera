import { View, Text, StyleSheet, TouchableOpacity, PixelRatio } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

type TabItem = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
};

const CIRCLE = PixelRatio.roundToNearestPixel(Math.round(ms(38)));

const tabs: TabItem[] = [
  { key: 'home', label: 'Home', icon: 'home', route: '/' },
  { key: 'echop', label: 'E-Chop', icon: 'coffee', route: '/echop' },
  { key: 'ewash', label: 'E-Wash', icon: 'droplet', route: '/wash' },
  { key: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
];

export function FoodTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => pathname === route;

  return (
    // Bottom inset keeps the tabs above the iPhone home bar / Android gesture bar.
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, ms(10)) }]}>
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
                size={Math.round(ms(20))}
                color={active ? '#fff' : foodColors.textMuted}
              />
            </View>
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
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
    paddingTop: ms(8),
    borderTopWidth: 1,
    borderTopColor: foodColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: CIRCLE,
    height: CIRCLE,
    minWidth: CIRCLE,
    maxWidth: CIRCLE,
    aspectRatio: 1,
    borderRadius: CIRCLE / 2,
    overflow: 'hidden',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: foodColors.tabColor,
  },
  label: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
  labelActive: {
    color: foodColors.tabColor,
    fontFamily: fonts.poppins.bold,
  },
});