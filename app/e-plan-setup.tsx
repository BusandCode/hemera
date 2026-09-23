import { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, TextInput, Switch, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EPlanHeader } from '../../src/components/eplan/EPlanHeader';
import { foodColors } from '../../src/constants/foodColors';
import { fonts } from '../../src/constants/typography';
import { useProfile } from '../../src/context/ProfileContext';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const ACCENT_BLUE = '#1E3FEA';

// TODO: wire this up to a real wallet balance once a WalletContext exists —
// there's no wallet source in AppDataContext/AuthContext yet.
const WALLET_BALANCE = 45000;

type DurationKey = '1w' | '2w';

const DURATIONS: { key: DurationKey; label: string; meals: string }[] = [
  { key: '1w', label: '1 Week', meals: '4–6 meals' },
  { key: '2w', label: '2 Weeks', meals: '8–12 meals' },
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

  const [amount, setAmount] = useState(20000);
  const [duration, setDuration] = useState<DurationKey>('1w');
  const [lunchWindow, setLunchWindow] = useState(true);
  const [dinnerWindow, setDinnerWindow] = useState(true);

  const selectedDuration = DURATIONS.find((d) => d.key === duration)!;

  const handleAmountChange = (raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    setAmount(digitsOnly ? Number(digitsOnly) : 0);
  };

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
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Setup E-Plan</Text>
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
        <Text style={styles.amountHelper}>
          {formatNaira(amount)} will be locked • Est. {selectedDuration.meals}
        </Text>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>CHOOSE YOUR DURATION</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => {
            const selected = d.key === duration;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.durationCard, selected && styles.durationCardSelected]}
                activeOpacity={0.85}
                onPress={() => setDuration(d.key)}
              >
                <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                  {selected && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={[styles.durationLabel, selected && styles.durationLabelSelected]}>{d.label}</Text>
                <Text style={[styles.durationMeals, selected && styles.durationMealsSelected]}>~{d.meals}</Text>
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
          style={styles.continueBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/e-plan/exclusions' as any)}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: 26, paddingBottom: 8 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 26 },

  titleRow: { marginTop: 8, marginBottom: 14 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: { fontSize: 27, fontFamily: serif, fontWeight: '700', color: foodColors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: 18 },

  progressTrack: { height: 4, borderRadius: 2, backgroundColor: foodColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: foodColors.primary, borderRadius: 2 },
  progressLabel: {
    alignSelf: 'center',
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: 6,
    marginBottom: 24,
  },

  sectionLabel: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.6, marginBottom: 10 },
  sectionSpacing: { marginTop: 26 },

  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
  },
  nairaSign: { fontSize: 26, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  amountInput: { flex: 1, fontSize: 30, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, padding: 0 },
  amountHelper: { fontSize: 12, fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: 8 },

  durationRow: { flexDirection: 'row', gap: 12 },
  durationCard: {
    flex: 1,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    padding: 16,
  },
  durationCardSelected: { backgroundColor: 'rgba(30,63,234,0.08)', borderColor: ACCENT_BLUE },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    alignSelf: 'flex-end',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE },
  durationLabel: { fontSize: 16, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 4 },
  durationLabelSelected: { color: foodColors.textPrimary },
  durationMeals: { fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  durationMealsSelected: { color: ACCENT_BLUE, fontFamily: fonts.poppins.semiBold },

  windowsCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  windowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  windowLabel: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginBottom: 3 },
  windowTime: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  windowDivider: { height: 1, backgroundColor: foodColors.border },

  continueBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161311',
    borderRadius: 26,
    paddingVertical: 16,
    marginTop: 30,
  },
  continueBtnText: { fontSize: 15, fontFamily: fonts.poppins.bold, color: '#fff' },
});