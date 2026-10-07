import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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

const WALLET_BLUE = '#0032C1';
const TRANSIT_ORANGE = '#F59E0B';
const SURPRISE_PURPLE = '#7C3AED';

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function formatDelivered(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  const day =
    diff === 0
      ? 'Today'
      : diff === 1
      ? 'Yesterday'
      : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { day, time };
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

const STATUS_ORDER: Record<DeliveryRow['status'], number> = {
  delivered: 0,
  in_transit: 1,
  surprise_pending: 2,
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
    const refundNaira = Math.round(plan.balance_kobo / 100);
    Alert.alert(
      'Cancel Plan',
      refundNaira > 0
        ? `Only the unused part of your plan is refunded: ${formatNaira(refundNaira)} will go back to your wallet. Meals already delivered are not refunded. Continue?`
        : 'There is no unused balance left on this plan, so nothing will be refunded. Continue?',
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
              Alert.alert('Error', error.message || 'Could not cancel plan. Please try again.');
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

  const sortedDeliveries = [...deliveries].sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (a.status === 'delivered') {
      return new Date(b.delivered_at ?? 0).getTime() - new Date(a.delivered_at ?? 0).getTime();
    }
    return 0;
  });

  const renderMeta = (d: DeliveryRow) => {
    if (d.status === 'delivered' && d.delivered_at) {
      const { day, time } = formatDelivered(d.delivered_at);
      return (
        <View style={styles.metaWrap}>
          <Text style={styles.metaDay}>{day}</Text>
          <Text style={styles.metaTime}>{time}</Text>
        </View>
      );
    }
    if (d.status === 'in_transit') {
      return <Text style={[styles.metaStatus, { color: TRANSIT_ORANGE }]}>On the way</Text>;
    }
    if (d.status === 'surprise_pending') {
      return <Text style={[styles.metaStatus, { color: SURPRISE_PURPLE }]}>???</Text>;
    }
    return null;
  };

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
          <Feather name="gift" size={ms(36)} color={foodColors.textMuted} />
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

            <Text style={styles.planTitle}>Your E-Plan{'\n'}is Running <Feather name="lock" size={ms(20)} color="#fff" /></Text>
            <Text style={styles.planSubtitle}>We know what's coming.{'\n'}You don't. That's how we like it.</Text>

            <View style={styles.balanceRow}>
              <View style={styles.balanceBlock}>
                <Text style={styles.balanceLabel}>Locked Balance</Text>
                <Text style={styles.balanceValue}>{formatNaira(Math.round(plan.balance_kobo / 100))}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceBlock}>
                <View style={styles.fromRow}>
                  <Feather name="lock" size={ms(11)} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.fromLabel}>From {formatNaira(Math.round(plan.locked_amount_kobo / 100))}</Text>
                </View>
                <Text style={styles.daysLeft}>{daysLeft} day{daysLeft === 1 ? '' : 's'} left</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>DELIVERY HISTORY</Text>

          {sortedDeliveries.map((d) => (
            <View key={d.id} style={styles.deliveryCard}>
              <View
                style={[
                  styles.deliveryIconWrap,
                  d.status === 'delivered' && styles.deliveryIconDelivered,
                  d.status === 'in_transit' && styles.deliveryIconTransit,
                  d.status === 'surprise_pending' && styles.deliveryIconPending,
                ]}
              >
                {d.status === 'delivered' && <Feather name="check" size={ms(20)} color={foodColors.success} />}
                {d.status === 'in_transit' && <MaterialCommunityIcons name="moped" size={ms(22)} color={TRANSIT_ORANGE} />}
                {d.status === 'surprise_pending' && <Feather name="gift" size={ms(20)} color={SURPRISE_PURPLE} />}
              </View>
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryTitle} numberOfLines={1}>{d.title}</Text>
                {!!d.subtitle && <Text style={styles.deliverySubtitle} numberOfLines={1}>{d.subtitle}</Text>}
              </View>
              {renderMeta(d)}
            </View>
          ))}

          {sortedDeliveries.length === 0 && (
            <View style={styles.deliveryEmpty}>
              <Text style={styles.deliveryEmptyText}>No deliveries yet — surprises are on the way.</Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Feather name="info" size={ms(22)} color={WALLET_BLUE} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>Your plan ends {endsLabel}.</Text>
                <Text style={styles.infoText}>Unused balance will be refunded to your wallet.</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
              activeOpacity={0.85}
              disabled={cancelling}
              onPress={handleCancel}
            >
              {cancelling ? <ActivityIndicator color={foodColors.textPrimary} /> : <Text style={styles.cancelBtnText}>Cancel Plan</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: ms(26), paddingBottom: ms(16) },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(26) },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(30), gap: ms(10) },
  emptyTitle: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: ms(6) },
  emptySubtitle: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: '#161311', paddingHorizontal: ms(22), paddingVertical: ms(13), borderRadius: ms(24), marginTop: ms(10) },
  emptyBtnText: { fontSize: ms(13.5), fontFamily: fonts.poppins.bold, color: '#fff' },

  planCard: { backgroundColor: WALLET_BLUE, borderRadius: ms(24), padding: ms(22), marginBottom: ms(24) },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: ms(6), alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: ms(12), paddingHorizontal: ms(10), paddingVertical: ms(5), marginBottom: ms(14),
  },
  activeDot: { width: 6, height: 6, borderRadius: ms(3), backgroundColor: '#34D399' },
  activeBadgeText: { fontSize: ms(10), fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.5 },
  planTitle: { fontSize: ms(26), lineHeight: ms(31), fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: ms(10) },
  planSubtitle: { fontSize: ms(13), lineHeight: ms(18), fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.8)', marginBottom: ms(20) },

  balanceRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: ms(16), padding: ms(16), gap: ms(16),
  },
  balanceBlock: { flex: 1 },
  balanceLabel: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.75)', marginBottom: ms(4) },
  balanceValue: { fontSize: ms(22), fontFamily: fonts.poppins.bold, color: '#fff' },
  balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: ms(5), marginBottom: ms(4) },
  fromLabel: { fontSize: ms(11), fontFamily: fonts.poppins.regular, color: 'rgba(255,255,255,0.75)' },
  daysLeft: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: '#fff' },

  sectionLabel: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: foodColors.textMuted, letterSpacing: 1, marginBottom: ms(12) },

  deliveryCard: {
    flexDirection: 'row', alignItems: 'center', gap: ms(14),
    backgroundColor: foodColors.surface, borderRadius: ms(14), borderWidth: 1, borderColor: foodColors.border,
    paddingHorizontal: ms(14), paddingVertical: ms(14), marginBottom: ms(10),
  },
  deliveryIconWrap: { width: ms(48), height: ms(48), borderRadius: ms(24), justifyContent: 'center', alignItems: 'center' },
  deliveryIconDelivered: { backgroundColor: 'rgba(52,199,89,0.12)' },
  deliveryIconTransit: { backgroundColor: 'rgba(245,158,11,0.12)' },
  deliveryIconPending: { backgroundColor: 'rgba(124,58,237,0.1)' },
  deliveryInfo: { flex: 1, minWidth: 0 },
  deliveryTitle: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  deliverySubtitle: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(3) },
  metaWrap: { alignItems: 'flex-end' },
  metaDay: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  metaTime: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(3) },
  metaStatus: { fontSize: ms(13), fontFamily: fonts.poppins.bold },
  deliveryEmpty: {
    backgroundColor: foodColors.surface, borderRadius: ms(14), borderWidth: 1, borderColor: foodColors.border,
    paddingVertical: ms(20), paddingHorizontal: ms(14), marginBottom: ms(10),
  },
  deliveryEmptyText: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center' },

  infoCard: {
    backgroundColor: foodColors.surface, borderRadius: ms(18), borderWidth: 1, borderColor: foodColors.border,
    padding: ms(16), marginTop: ms(6),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: ms(16) },
  infoIconWrap: {
    width: ms(52), height: ms(52), borderRadius: ms(26), backgroundColor: 'rgba(0,50,193,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoTitle: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  infoText: { fontSize: ms(12.5), lineHeight: ms(18), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(3) },

  cancelBtn: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: ms(14), borderRadius: ms(14),
    borderWidth: 1.5, borderColor: foodColors.textPrimary, marginTop: ms(16),
  },
  cancelBtnDisabled: { opacity: 0.6 },
  cancelBtnText: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
});