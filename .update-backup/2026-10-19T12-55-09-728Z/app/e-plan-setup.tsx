import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
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
import { useEPlanDraft } from '../src/context/EPlanDraftContext';
import { getEPlanTier, weeksFor, EPlanDuration } from '../src/lib/eplanTiers';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const ACCENT_BLUE = '#1E3FEA';

type DurationKey = EPlanDuration;

const DURATIONS: { key: DurationKey; label: string }[] = [
  { key: '1w', label: '1 Week' },
  { key: '2w', label: '2 Weeks' },
];

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function EPlanSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { session } = useAuth();
  const { balanceNaira } = useWalletBalance();
  const { draft, updateDraft } = useEPlanDraft();

  const [amount, setAmount] = useState(draft.amount);
  const [duration, setDuration] = useState<DurationKey>(draft.duration);
  // Delivery windows always start off; the user turns them on themselves.
  const [lunchWindow, setLunchWindow] = useState(false);
  const [dinnerWindow, setDinnerWindow] = useState(false);
  const [showActivePlanModal, setShowActivePlanModal] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(false);

  const tier = getEPlanTier(amount, duration);
  // What the user's amount is worth per week, used to preview the other duration.
  const weeklyAmount = amount / weeksFor(duration);

  // True when the user already runs an E-Plan. If the lookup itself fails we let them carry on:
  // the server still refuses a second plan, and the payment screen checks again before any money moves.
  const userHasActivePlan = async () => {
    if (!session?.user.id) return false;
    const { data, error } = await supabase
      .from('eplan_plans')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .limit(1); // a user can hold more than one active plan, so don't expect exactly one row
    if (error) return false;
    return (data?.length ?? 0) > 0;
  };

  // Tell the user straight away if they land here with a plan already running.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const active = await userHasActivePlan();
        if (active && !cancelled) setShowActivePlanModal(true);
      })();
      return () => {
        cancelled = true;
      };
    }, [session?.user.id])
  );

  // Duration scales the amount: the number typed is the 1-week budget, so 2 weeks doubles it
  // and switching back halves it again.
  const handleDurationChange = (next: DurationKey) => {
    if (next === duration) return;
    setAmount((current) => (next === '2w' ? current * 2 : Math.round(current / 2)));
    setDuration(next);
  };

  const handleAmountChange = (raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    setAmount(digitsOnly ? Number(digitsOnly) : 0);
  };

  const handleContinue = async () => {
    if (checkingPlan) return;

    // Check again at the moment of tapping, in case a plan became active since this screen opened.
    setCheckingPlan(true);
    const active = await userHasActivePlan();
    setCheckingPlan(false);
    if (active) {
      setShowActivePlanModal(true);
      return;
    }

    updateDraft({ amount, duration, lunchWindow, dinnerWindow, fixedPlan: null });
    // Choice is saved in the draft; reset the switches so they're off next time.
    setLunchWindow(false);
    setDinnerWindow(false);
    router.push('/e-plan-exclusions' as any);
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Setup E-Plan</Text>
        </View>

        <Text style={styles.subtitle}>Step 1 of 3 — Budget & Duration</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>
        <Text style={styles.progressLabel}>33%</Text>

        <Text style={styles.sectionLabel}>HOW MUCH DO YOU WANT TO LOCK?</Text>
        <View style={styles.amountBox}>
          <Text style={styles.nairaSign}>₦</Text>
          <TextInput
            style={styles.amountInput}
            value={amount ? amount.toLocaleString() : ''}
            onChangeText={handleAmountChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={foodColors.textMuted}
          />
        </View>
        {tier.valid ? (
          <>
            <Text style={styles.amountHelper}>
              {formatNaira(tier.locked)} will be locked • Est. {tier.meals} meals
              {tier.locked > balanceNaira ? ' • Exceeds wallet balance' : ''}
            </Text>
            {tier.surplus > 0 && (
              <Text style={styles.surplusHelper}>
                You have {formatNaira(tier.surplus)} excess that won't cover a new meal tier. It
                goes back to your wallet, or add {formatNaira(tier.toNextTier)} more to unlock the
                next level.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.errorHelper}>
            Minimum for {duration === '2w' ? '2 weeks' : '1 week'} is {formatNaira(tier.min)}
          </Text>
        )}

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>CHOOSE YOUR DURATION</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => {
            const selected = d.key === duration;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.durationCard, selected && styles.durationCardSelected]}
                activeOpacity={0.85}
                onPress={() => handleDurationChange(d.key)}
              >
                <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                  {selected && <Feather name="check" size={ms(11)} color="#fff" />}
                </View>
                <Text style={[styles.durationLabel, selected && styles.durationLabelSelected]}>{d.label}</Text>
                <Text style={[styles.durationMeals, selected && styles.durationMealsSelected]}>
                  ~{getEPlanTier(weeklyAmount * weeksFor(d.key), d.key).meals} meals
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>DELIVERY SURPRISE WINDOWS</Text>
        <View style={styles.windowsCard}>
          <View style={styles.windowRow}>
            <View>
              <Text style={styles.windowLabel}>Lunch Window</Text>
              <Text style={styles.windowTime}>12:00 PM – 2:00 PM</Text>
            </View>
            <Switch
              value={lunchWindow}
              onValueChange={setLunchWindow}
              trackColor={{ false: '#e3e0da', true: ACCENT_BLUE }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.windowDivider} />
          <View style={styles.windowRow}>
            <View>
              <Text style={styles.windowLabel}>Dinner Window</Text>
              <Text style={styles.windowTime}>5:00 PM – 8:00 PM</Text>
            </View>
            <Switch
              value={dinnerWindow}
              onValueChange={setDinnerWindow}
              trackColor={{ false: '#e3e0da', true: ACCENT_BLUE }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, (!tier.valid || checkingPlan) && styles.continueBtnDisabled]}
          activeOpacity={0.85}
          disabled={!tier.valid || checkingPlan}
          onPress={handleContinue}
        >
          {checkingPlan ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>Continue</Text>
              <Feather name="arrow-right" size={ms(16)} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <BottomTabs />

      <Modal
        visible={showActivePlanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActivePlanModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRing}>
              <View style={styles.modalIcon}>
                <Feather name="lock" size={ms(22)} color="#fff" />
              </View>
            </View>

            <Text style={styles.modalTitle}>You have an active plan already</Text>
            <Text style={styles.modalBody}>
              You can only run one E-Plan at a time. Check on your current plan, or come back once it
              ends or is cancelled.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimary}
              activeOpacity={0.85}
              onPress={() => {
                setShowActivePlanModal(false);
                router.push('/my-plan' as any);
              }}
            >
              <Text style={styles.modalPrimaryText}>View My Plan</Text>
              <Feather name="arrow-right" size={ms(15)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondary}
              activeOpacity={0.7}
              onPress={() => setShowActivePlanModal(false)}
            >
              <Text style={styles.modalSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: ms(26), paddingBottom: ms(8) },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(26) },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12), marginTop: ms(8), marginBottom: ms(4) },
  backBtn: {
    width: ms(38), height: ms(38), borderRadius: ms(19),
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },

  title: { fontSize: ms(27), fontFamily: serif, fontWeight: '700', color: foodColors.textPrimary },
  subtitle: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: ms(18) },

  progressTrack: { height: 4, borderRadius: ms(2), backgroundColor: foodColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: foodColors.primary, borderRadius: ms(2) },
  progressLabel: {
    alignSelf: 'center', fontSize: ms(11), fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted, marginTop: ms(6), marginBottom: ms(24),
  },

  sectionLabel: { fontSize: ms(11), fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.6, marginBottom: ms(10) },
  sectionSpacing: { marginTop: ms(26) },

  amountBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: foodColors.surface,
    borderRadius: ms(16), borderWidth: 1, borderColor: foodColors.border, paddingHorizontal: ms(18), paddingVertical: ms(16), gap: ms(8),
  },
  nairaSign: { fontSize: ms(26), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  amountInput: { flex: 1, fontSize: ms(30), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, padding: 0 },
  amountHelper: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: ms(8) },
  surplusHelper: { fontSize: ms(12), lineHeight: ms(17), fontFamily: fonts.poppins.regular, color: ACCENT_BLUE, marginTop: ms(6) },
  errorHelper: { fontSize: ms(12), fontFamily: fonts.poppins.medium, color: '#FF3B30', marginTop: ms(8) },

  durationRow: { flexDirection: 'row', gap: ms(12) },
  durationCard: {
    flex: 1, backgroundColor: foodColors.surface, borderRadius: ms(16),
    borderWidth: 1.5, borderColor: foodColors.border, padding: ms(16),
  },
  durationCardSelected: { backgroundColor: 'rgba(30,63,234,0.08)', borderColor: ACCENT_BLUE },
  radioCircle: {
    width: ms(18), height: ms(18), borderRadius: ms(9), borderWidth: 1.5, borderColor: foodColors.border,
    alignSelf: 'flex-end', marginBottom: ms(8), justifyContent: 'center', alignItems: 'center',
  },
  radioCircleSelected: { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE },
  durationLabel: { fontSize: ms(16), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: ms(4) },
  durationLabelSelected: { color: foodColors.textPrimary },
  durationMeals: { fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  durationMealsSelected: { color: ACCENT_BLUE, fontFamily: fonts.poppins.semiBold },

  windowsCard: {
    backgroundColor: foodColors.surface, borderRadius: ms(16), borderWidth: 1,
    borderColor: foodColors.border, paddingHorizontal: ms(16), paddingVertical: ms(6),
  },
  windowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: ms(14) },
  windowLabel: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginBottom: ms(3) },
  windowTime: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  windowDivider: { height: 1, backgroundColor: foodColors.border },

  continueBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: ms(8),
    backgroundColor: '#161311', borderRadius: ms(26), paddingVertical: ms(16), marginTop: ms(30),
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: '#fff' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11,16,32,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: ms(28) },
  modalCard: {
    width: '100%', backgroundColor: foodColors.surface, borderRadius: ms(26), paddingHorizontal: ms(24),
    paddingTop: ms(28), paddingBottom: ms(18), alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  modalIconRing: { width: ms(84), height: ms(84), borderRadius: ms(42), backgroundColor: 'rgba(226,58,46,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: ms(18) },
  modalIcon: { width: ms(54), height: ms(54), borderRadius: ms(27), backgroundColor: '#161311', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: ms(19), lineHeight: ms(26), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, textAlign: 'center', marginBottom: ms(8) },
  modalBody: { fontSize: ms(13), lineHeight: ms(19), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, textAlign: 'center', marginBottom: ms(22) },
  modalPrimary: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: ms(8), backgroundColor: '#161311', borderRadius: ms(26), paddingVertical: ms(15) },
  modalPrimaryText: { fontSize: ms(14.5), fontFamily: fonts.poppins.bold, color: '#fff' },
  modalSecondary: { paddingVertical: ms(14), paddingHorizontal: ms(20) },
  modalSecondaryText: { fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
});