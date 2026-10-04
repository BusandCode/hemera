import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { washColors } from '../../constants/washColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

type Props = {
  status: 'none' | 'expired';
  /** e.g. "July 6, 2026" — shown when status is 'expired' */
  expiredOn?: string;
  planName?: string;
};

const content = {
  none: {
    icon: 'zap' as const,
    badge: 'No Active Plan',
    title: 'Get a plan to request pickups',
    description:
      'Pickups are part of a laundry plan. Choose one to enjoy scheduled pickups, delivery and savings on every wash.',
    button: 'Choose a Plan',
    route: '/choose-plan',
  },
  expired: {
    icon: 'clock' as const,
    badge: 'Plan Expired',
    title: 'Your plan has expired',
    description:
      'Renew your plan to keep requesting pickups. Your items, address and preferences are still saved.',
    button: 'Renew Plan',
    route: '/renew-plan',
  },
};

export function PlanRequiredState({ status, expiredOn, planName }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = content[status];

  const description =
    status === 'expired' && expiredOn
      ? `${planName ?? 'Your plan'} expired on ${expiredOn}. ${c.description}`
      : c.description;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + ms(12) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={ms(22)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Pickup</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconOuter}>
          <View style={[styles.iconInner, status === 'expired' && styles.iconInnerExpired]}>
            <Feather name={c.icon} size={ms(30)} color="#fff" />
          </View>
        </View>

        <View style={[styles.badge, status === 'expired' && styles.badgeExpired]}>
          <Text style={[styles.badgeText, status === 'expired' && styles.badgeTextExpired]}>
            {c.badge}
          </Text>
        </View>

        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(16) }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.replace(c.route as any)}
        >
          <Text style={styles.primaryButtonText}>{c.button}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.replace('/pay-per-pickup' as any)}
        >
          <Text style={styles.secondaryButtonText}>Pay per order instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(16),
    paddingHorizontal: ms(20),
    paddingBottom: ms(16),
  },
  backBtn: { width: ms(28), height: ms(28), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: ms(22), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(32),
    paddingBottom: ms(40),
  },
  iconOuter: {
    width: ms(108),
    height: ms(108),
    borderRadius: ms(54),
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(20),
  },
  iconInner: {
    width: ms(68),
    height: ms(68),
    borderRadius: ms(34),
    backgroundColor: washColors.navySolid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerExpired: { backgroundColor: washColors.red },

  badge: {
    backgroundColor: washColors.coveredBg,
    paddingHorizontal: ms(12),
    paddingVertical: ms(5),
    borderRadius: ms(12),
    marginBottom: ms(12),
  },
  badgeExpired: { backgroundColor: '#FDE8E8' },
  badgeText: { fontSize: ms(11.5), fontFamily: fonts.poppins.bold, color: washColors.navySolid },
  badgeTextExpired: { color: washColors.red },

  title: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
    textAlign: 'center',
    marginBottom: ms(8),
  },
  description: {
    fontSize: ms(13),
    lineHeight: ms(20),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    textAlign: 'center',
  },

  footer: { paddingHorizontal: ms(20), gap: ms(10) },
  primaryButton: {
    backgroundColor: washColors.red,
    paddingVertical: ms(16),
    borderRadius: ms(28),
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
  secondaryButton: {
    paddingVertical: ms(14),
    borderRadius: ms(28),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: washColors.grayBorder,
  },
  secondaryButtonText: { fontSize: ms(13.5), fontFamily: fonts.poppins.bold, color: washColors.navySolid },
});