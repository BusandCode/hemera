import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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

const WALLET_BLUE = '#0032C1';

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

type PlanRow = {
  id: string;
  locked_amount_kobo: number;
  balance_kobo: number;
  ends_at: string;
};

type DeliveryRow = {
  id: string;
  title: string;
  subtitle: string | null;
  status: 'delivered' | 'in_transit' | 'surprise_pending';
  delivered_at: string | null;
};

export default function MyPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { session } = useAuth();
  const { balanceNaira, refresh: refreshWallet } = useWalletBalance();

  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const { data: planData } = await supabase
      .from('eplan_plans')
      .select('id, locked_amount_kobo, balance_kobo, ends_at')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    setPlan(planData);

    if (planData) {
      const { data: deliveryData } = await supabase
        .from('eplan_deliveries')
        .select('id, title, subtitle, status, delivered_at')
        .eq('plan_id', planData.id)
        .order('created_at', { ascending: true });
      setDeliveries(deliveryData ?? []);
    } else {
      setDeliveries([]);
    }
    setLoading(false);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCancel = () => {
    if (!plan) return;
    Alert.alert(
      'Cancel Plan',
      'Your remaining locked balance will be refunded to your wallet. Continue?',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Plan',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { error } = await supabase.rpc('cancel_eplan', { p_plan_id: plan.id });
            setCancelling(false);
            if (error) {
              Alert.alert('Error', 'Could not cancel plan. Please try again.');
              return;
            }
            await Promise.all([load(), refreshWallet()]);
          },
        },
      ]
    );
  };

  const daysLeft = plan ? Math.max(0, Math.ceil((new Date(plan.ends_at).getTime() - Date.now()) / 86400000)) : 0;
  const endsLabel = plan
    ? new Date(plan.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <EPlanHeader
          wallet={formatNaira(balanceNaira)}
          initials={getInitials(profile.fullName)}
          onPressWallet={() => router.push('/wallet' as any)}
          onPressAvatar={() => router.push('/profile' as any)}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={WALLET_BLUE} />
        </View>
      ) : !plan ? (
        <View style={styles.centered}>
          <Feather name="gift" size={36} color={foodColors.textMuted} />
          <Text style={styles.emptyTitle}>No active plan</Text>
          <Text style={styles.emptySubtitle}>Start an E-Plan to see it here.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/e-plan-setup' as any)} activeOpacity={0.85}>
            <Text style={styles.emptyBtnText}>Start E-Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.planCard}>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>

            <Text style={styles.planTitle}>Your E-Plan{'\n'}is Running <Feather name="lock" size={20} color="#fff" /></Text>
            <Text style={styles.planSubtitle}>We know what's coming.{'\n'}You don't. That's how we like it.</Text>

            <View style={styles.balanceRow}>
              <View style={styles.balanceBlock}>
                <Text style={styles.balanceLabel}>Locked Balance</Text>
                <Text style={styles.balanceValue}>{formatNaira(Math.round(plan.balance_kobo / 100))}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceBlock}>
                <View style={styles.fromRow}>
                  <Feather name="lock" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.fromLabel}>From {formatNaira(Math.round(plan.locked_amount_kobo / 100))}</Text>
                </View>
                <Text style={styles.daysLeft}>{daysLeft} day{daysLeft === 1 ? '' : 's'} left</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>DELIVERY HISTORY</Text>
          <View style={styles.deliveryGroup}>
            {deliveries.map((d) => (
              <View key={d.id} style={styles.deliveryRow}>
                <View
                  style={[
                    styles.deliveryIconWrap,
                    d.status === 'delivered' && styles.deliveryIconDelivered,
                    d.status === 'in_transit' && styles.deliveryIconTransit,
                    d.status === 'surprise_pending' && styles.deliveryIconPending,
                  ]}
                >
                  <Feather
                    name={d.status === 'delivered' ? 'check' : d.status === 'in_transit' ? 'navigation' : 'gift'}
                    size={15}
                    color={d.status === 'delivered' ? foodColors.success : d.status === 'in_transit' ? '#D97706' : WALLET_BLUE}
                  />
                </View>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryTitle}>{d.title}</Text>
                  <Text style={styles.deliverySubtitle}>{d.subtitle ?? ''}</Text>
                </View>
                <Text style={styles.deliveryMeta}>
                  {d.status === 'delivered' && d.delivered_at
                    ? new Date(d.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : d.status === 'surprise_pending'
                    ? '???'
                    : ''}
                </Text>
              </View>
            ))}
            {deliveries.length === 0 && (
              <View style={styles.deliveryEmpty}>
                <Text style={styles.deliveryEmptyText}>No deliveries yet — surprises are on the way.</Text>
              </View>
            )}
          </View>

          <View style={styles.infoBanner}>
            <Feather name="info" size={18} color={WALLET_BLUE} />
            <Text style={styles.infoBannerText}>
              Your plan ends {endsLabel}. Unused balance will be refunded to your wallet.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
            activeOpacity={0.85}
            disabled={cancelling}
            onPress={handleCancel}
          >
            {cancelling ? <ActivityIndicator color={foodColors.textPrimary} /> : <Text style={styles.cancelBtnText}>Cancel Plan</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: 26, paddingBottom: 16 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 26 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: 6 },
  emptySubtitle: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: '#161311', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 24, marginTop: 10 },
  emptyBtnText: { fontSize: 13.5, fontFamily: fonts.poppins.bold, color: '#fff' },

  planCard: { backgroundColor: WALLET_BLUE, borderRadius: 24, padding: 22, marginBottom: 24 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 14,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  activeBadgeText: { fontSize: 10, fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.5 },
  planTitle: { fontSize: 26, lineHeight: 31, fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 10 },
  planSubtitle: { fontSize: 13, lineHeight: 18, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },

  balanceRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, gap: 16,
  },
  balanceBlock: { flex: 1 },
  balanceLabel: { fontSize: 11, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  balanceValue: { fontSize: 22, fontFamily: fonts.poppins.bold, color: '#fff' },
  balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  fromLabel: { fontSize: 11, fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.75)' },
  daysLeft: { fontSize: 16, fontFamily: fonts.poppins.bold, color: '#fff' },

  sectionLabel: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.6, marginBottom: 10 },

  deliveryGroup: { backgroundColor: foodColors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  deliveryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  deliveryIconWrap: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  deliveryIconDelivered: { backgroundColor: 'rgba(52,199,89,0.12)' },
  deliveryIconTransit: { backgroundColor: 'rgba(217,119,6,0.1)' },
  deliveryIconPending: { backgroundColor: 'rgba(0,50,193,0.08)' },
  deliveryInfo: { flex: 1, minWidth: 0 },
  deliveryTitle: { fontSize: 13.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  deliverySubtitle: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 2 },
  deliveryMeta: { fontSize: 11.5, fontFamily: fonts.poppins.bold, color: foodColors.textMuted },
  deliveryEmpty: { paddingVertical: 20, paddingHorizontal: 14 },
  deliveryEmptyText: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center' },

  infoBanner: {
    flexDirection: 'row', gap: 10, backgroundColor: 'rgba(0,50,193,0.06)', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'flex-start',
  },
  infoBannerText: { flex: 1, fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16 },

  cancelBtn: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 26,
    borderWidth: 1.5, borderColor: foodColors.border,
  },
  cancelBtnDisabled: { opacity: 0.6 },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
});