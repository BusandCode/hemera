import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EPlanHeader } from '../../src/components/eplan/EPlanHeader';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { useProfile } from '../../src/context/ProfileContext';

// TODO: wire this up to a real wallet balance once a WalletContext exists —
// there's no wallet source in AppDataContext/AuthContext yet.
const WALLET_BALANCE = 45000;

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const STATS = [
  { value: '2,400+', label: 'Active Plans' },
  { value: '98%', label: 'Delight Rate' },
  { value: '30min', label: 'Avg. Delivery' },
];

export default function EPlanLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <EPlanHeader
          wallet={formatNaira(WALLET_BALANCE)}
          initials={getInitials(profile.fullName)}
          onPressWallet={() => router.push('/wallet' as any)}
          onPressAvatar={() => router.push('/profile' as any)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            Food that{'\n'}finds <Text style={styles.bannerTitleAccent}>you.</Text>
          </Text>
          <Text style={styles.bannerSubtitle}>
            Subscribe to E-Plan and let us surprise you with delicious meals — when you least expect it.
          </Text>

          <View style={styles.dishBadge}>
            <Text style={styles.dishEmoji}>🍲</Text>
          </View>

          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={s.label} style={styles.statsItem}>
                <View style={styles.statBlock}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={styles.statDivider} />}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionLabel}>FEATURED PLAN</Text>

        <View style={styles.planCard}>
          <View style={styles.planCardTop}>
            <View style={styles.giftBadge}>
              <Feather name="gift" size={20} color="#fff" />
            </View>
            <View style={styles.newPill}>
              <Text style={styles.newPillText}>NEW</Text>
            </View>
          </View>

          <Text style={styles.planTitle}>E-Plan</Text>
          <Text style={styles.planDescription}>
            Lock your budget, tell us what you won't eat, and we'll handle everything else.
          </Text>

          <View style={styles.planDivider} />

          <View style={styles.planFooter}>
            <View>
              <Text style={styles.planFromLabel}>From</Text>
              <Text style={styles.planPrice}>{formatNaira(20000)}</Text>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/e-plan/setup' as any)}
            >
              <Text style={styles.startBtnText}>Start</Text>
              <Feather name="arrow-right" size={15} color={foodColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: 26, paddingBottom: 16 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 26 },

  banner: {
    backgroundColor: '#161311',
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    overflow: 'hidden',
  },
  bannerTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: 12,
  },
  bannerTitleAccent: { color: foodColors.primary, fontStyle: 'italic' },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.7)',
    maxWidth: '78%',
    marginBottom: 26,
  },
  dishBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(226,58,46,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishEmoji: { fontSize: 34 },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statBlock: { flex: 1 },
  statValue: { fontSize: 16, fontFamily: fonts.poppins.bold, color: '#fff' },
  statLabel: { fontSize: 11, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 10 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  planCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  giftBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#161311',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPill: { backgroundColor: foodColors.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  newPillText: { fontSize: 10, fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.4 },

  planTitle: { fontSize: 20, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 6 },
  planDescription: { fontSize: 13, lineHeight: 19, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },

  planDivider: { height: 1, backgroundColor: foodColors.border, marginVertical: 16 },

  planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planFromLabel: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginBottom: 2 },
  planPrice: { fontSize: 17, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  startBtnText: { fontSize: 15, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
});