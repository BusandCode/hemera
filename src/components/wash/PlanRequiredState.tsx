import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { washColors } from '../../constants/washColors';
import { fonts } from '../../constants/typography';

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
  const c = content[status];

  const description =
    status === 'expired' && expiredOn
      ? `${planName ?? 'Your plan'} expired on ${expiredOn}. ${c.description}`
      : c.description;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Pickup</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconOuter}>
          <View style={[styles.iconInner, status === 'expired' && styles.iconInnerExpired]}>
            <Feather name={c.icon} size={30} color="#fff" />
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

      <View style={styles.footer}>
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
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
  },
  backBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  iconOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: washColors.navySolid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerExpired: { backgroundColor: washColors.red },

  badge: {
    backgroundColor: washColors.coveredBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeExpired: { backgroundColor: '#FDE8E8' },
  badgeText: { fontSize: 11.5, fontFamily: fonts.poppins.bold, color: washColors.navySolid },
  badgeTextExpired: { color: washColors.red },

  title: {
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    textAlign: 'center',
  },

  footer: { paddingHorizontal: 20, paddingBottom: 34, gap: 10 },
  primaryButton: {
    backgroundColor: washColors.red,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: washColors.grayBorder,
  },
  secondaryButtonText: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: washColors.navySolid },
});