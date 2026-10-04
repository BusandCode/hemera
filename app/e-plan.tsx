import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EPlanHeader } from '../src/components/eplan/EPlanHeader';
import { BottomTabs } from '../src/components/eplan/BottomTabs';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useProfile } from '../src/context/ProfileContext';
import { useAuth } from '../src/context/AuthContext';
import { useWalletBalance } from '../src/hooks/useWalletBalance';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

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

export default function EPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { session } = useAuth();
  const { balanceNaira } = useWalletBalance();
  const [hasActivePlan, setHasActivePlan] = useState<boolean | null>(null);

  const planReady = hasActivePlan !== null;
  const active = hasActivePlan === true;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!session?.user.id) {
          setHasActivePlan((prev) => prev ?? false);
          return;
        }
        const { data, error } = await supabase
          .from('eplan_plans')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (error) {
          setHasActivePlan((prev) => prev ?? false);
          return;
        }
        setHasActivePlan(!!data);
      })();
    }, [session?.user.id])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
       <EPlanHeader
        wallet={formatNaira(balanceNaira)}
        initials={getInitials(profile.fullName)}
        onPressWallet={() => router.push('/wallet' as any)}
        onPressAvatar={() => router.push('/profile' as any)}
        onPressBack={() => router.push('/(tabs)' as any)}
      />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            Food that{'\n'}finds <Text style={styles.bannerTitleAccent}>you.</Text>
          </Text>
          <Text style={styles.bannerSubtitle}>
            Subscribe to E-Plan and let us{'\n'}surprise you with delicious meals — when you least expect it.
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
              <Feather name="gift" size={ms(20)} color="#fff" />
            </View>
            {hasActivePlan === false && (
              <View style={styles.newPill}>
                <Text style={styles.newPillText}>NEW</Text>
              </View>
            )}
          </View>

          <Text style={styles.planTitle}>E-Plan</Text>
          <Text style={[styles.planDescription, !planReady && styles.hidden]}>
            {active
              ? 'You have an active E-Plan running right now.'
              : "Lock your budget, tell us what you won't eat, and we'll handle everything else."}
          </Text>

          <View style={styles.planDivider} />

          <View style={[styles.planFooter, !planReady && styles.hidden]}>
            <View>
              <Text style={styles.planFromLabel}>{active ? 'Status' : 'From'}</Text>
              <Text style={styles.planPrice}>{active ? 'Active' : formatNaira(20000)}</Text>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.8}
              disabled={!planReady}
              onPress={() => router.push((active ? '/my-plan' : '/e-plan-setup') as any)}
            >
              <Text style={styles.startBtnText}>{active ? 'View Plan' : 'Start'}</Text>
              <Feather name="arrow-right" size={ms(15)} color={foodColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: ms(26), paddingBottom: ms(16) },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(26) },

  banner: { backgroundColor: '#161311', borderRadius: ms(24), padding: ms(22), marginBottom: ms(24), overflow: 'hidden' },
  bannerTitle: { fontSize: ms(34), lineHeight: ms(36), fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: ms(12) },
  bannerTitleAccent: { color: foodColors.primary, fontStyle: 'italic' },
  bannerSubtitle: {
    fontSize: ms(13), lineHeight: ms(19), fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.7)', maxWidth: '78%', marginBottom: ms(26),
  },
  dishBadge: {
    position: 'absolute', top: 18, right: 18, width: ms(84), height: ms(84), borderRadius: ms(42),
    backgroundColor: 'rgba(226,58,46,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  dishEmoji: { fontSize: ms(34) },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statBlock: { flex: 1 },
  statValue: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: '#fff' },
  statLabel: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.55)', marginTop: ms(2) },
  statDivider: { width: 1, height: ms(26), backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: ms(10) },

  sectionLabel: { fontSize: ms(11), fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.6, marginBottom: ms(10) },

  planCard: {
    backgroundColor: foodColors.surface, borderRadius: ms(20), padding: ms(18),
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  planCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ms(12) },
  giftBadge: { width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: '#161311', justifyContent: 'center', alignItems: 'center' },
  newPill: { backgroundColor: foodColors.primary, borderRadius: ms(10), paddingHorizontal: ms(10), paddingVertical: ms(4) },
  newPillText: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.4 },

  planTitle: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(6) },
  planDescription: { fontSize: ms(13), lineHeight: ms(19), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  hidden: { opacity: 0 },

  planDivider: { height: 1, backgroundColor: foodColors.border, marginVertical: ms(16) },

  planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planFromLabel: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginBottom: ms(2) },
  planPrice: { fontSize: ms(17), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  startBtnText: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
});