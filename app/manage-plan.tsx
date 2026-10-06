import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { usePlanStatus } from '../src/hooks/usePlanStatus';
import { ms } from '../src/utils/responsive';

export default function ManagePlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, planName, renewsOn, allowance, isLoading } = usePlanStatus();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={foodColors.primary} />
      </View>
    );
  }

  if (status !== 'active' || !allowance) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <Feather name="alert-circle" size={ms(36)} color={foodColors.textMuted} />
        <Text style={styles.emptyTitle}>No active plan</Text>
        <Text style={styles.emptyText}>Choose a plan to start using laundry pickups.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/choose-plan' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Choose a Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasRollovers =
    allowance.rolloverPickups > 0 ||
    allowance.rolloverItems > 0 ||
    allowance.rolloverLarge > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Plan</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[foodColors.primary, foodColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.badge}>
            <Feather name="check-circle" size={ms(12)} color="#fff" />
            <Text style={styles.badgeText}>ACTIVE</Text>
          </View>
          <Text style={styles.heroTitle}>{planName ?? 'Your Plan'}</Text>
          {renewsOn ? (
            <Text style={styles.heroSubtitle}>Renews on {renewsOn}</Text>
          ) : null}
        </LinearGradient>

        <Text style={styles.sectionLabel}>YOUR BALANCE</Text>

        <View style={styles.statsCard}>
          <BalanceRow
            icon="calendar"
            label="Available pickups"
            value={allowance.pickupsRemaining}
            suffix={allowance.pickupsRemaining === 1 ? 'pickup' : 'pickups'}
          />
          <View style={styles.divider} />
          <BalanceRow
            icon="shopping-bag"
            label="Clothes allowance"
            value={allowance.itemsRemaining}
            suffix="clothes available"
          />
          <View style={styles.divider} />
          <BalanceRow
            icon="layers"
            label="Large items"
            value={allowance.largeRemaining}
            suffix="large items"
          />
        </View>

        {hasRollovers && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionSpacing]}>
              ROLLED OVER FROM PREVIOUS PLAN
            </Text>
            <View style={styles.statsCard}>
              {allowance.rolloverPickups > 0 && (
                <BalanceRow
                  icon="repeat"
                  label="Pickups carried over"
                  value={allowance.rolloverPickups}
                  suffix={allowance.rolloverPickups === 1 ? 'pickup' : 'pickups'}
                  muted
                />
              )}
              {allowance.rolloverItems > 0 && (
                <>
                  {allowance.rolloverPickups > 0 && <View style={styles.divider} />}
                  <BalanceRow
                    icon="repeat"
                    label="Clothes carried over"
                    value={allowance.rolloverItems}
                    suffix="clothes"
                    muted
                  />
                </>
              )}
              {allowance.rolloverLarge > 0 && (
                <>
                  {(allowance.rolloverPickups > 0 || allowance.rolloverItems > 0) && (
                    <View style={styles.divider} />
                  )}
                  <BalanceRow
                    icon="repeat"
                    label="Large items carried over"
                    value={allowance.rolloverLarge}
                    suffix="large items"
                    muted
                  />
                </>
              )}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.push('/choose-plan?mode=switch' as any)}
        >
          <Text style={styles.secondaryButtonText}>Switch to Another Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function BalanceRow({
  icon,
  label,
  value,
  suffix,
  muted = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  suffix: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.balanceRow}>
      <View style={styles.balanceLeft}>
        <View style={[styles.balanceIcon, muted && styles.balanceIconMuted]}>
          <Feather
            name={icon}
            size={ms(14)}
            color={muted ? foodColors.textMuted : foodColors.primary}
          />
        </View>
        <Text style={styles.balanceLabel}>{label}</Text>
      </View>
      <Text style={styles.balanceValue}>
        {value} <Text style={styles.balanceSuffix}>{suffix}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(32),
    gap: ms(10),
  },
  emptyTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  emptyText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(28) },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(20),
    marginBottom: ms(16),
  },
  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },

  heroCard: { borderRadius: ms(24), padding: ms(22), marginBottom: ms(24) },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: ms(12),
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    marginBottom: ms(12),
  },
  badgeText: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  heroTitle: {
    fontSize: ms(24),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: ms(6),
  },
  heroSubtitle: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
  },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: ms(10),
  },
  sectionSpacing: { marginTop: ms(20) },

  statsCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    marginBottom: ms(4),
  },
  divider: { height: 1, backgroundColor: foodColors.border },

  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(14),
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    flex: 1,
  },
  balanceIcon: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceIconMuted: { backgroundColor: 'rgba(0,0,0,0.05)' },
  balanceLabel: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  balanceValue: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },
  balanceSuffix: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },

  primaryButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: foodColors.primary,
    paddingVertical: ms(16),
    borderRadius: ms(28),
    marginTop: ms(24),
  },
  primaryButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  secondaryButton: {
    alignItems: 'center',
    paddingVertical: ms(14),
    borderRadius: ms(28),
    borderWidth: 1.5,
    borderColor: foodColors.border,
    marginTop: ms(24),
  },
  secondaryButtonText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },
});