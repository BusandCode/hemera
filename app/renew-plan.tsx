import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';

type Duration = {
  key: string;
  label: string;
  months: number;
  price: number;
  perMonth: number;
  savePct?: number;
};

const DURATIONS: Duration[] = [
  { key: '1m', label: '1 Month', months: 1, price: 12000, perMonth: 12000 },
  { key: '3m', label: '3 Months', months: 3, price: 32000, perMonth: 10667, savePct: 11 },
  { key: '6m', label: '6 Months', months: 6, price: 58000, perMonth: 9667, savePct: 19 },
  { key: '12m', label: '12 Months', months: 12, price: 104000, perMonth: 8667, savePct: 28 },
];

const FEATURES = [
  { icon: 'basket-outline', label: 'Unlimited pickup requests' },
  { icon: 'truck-fast-outline', label: 'Free delivery on every order' },
  { icon: 'flash-outline', label: 'Priority processing (24hr turnaround)' },
  { icon: 'shield-check-outline', label: 'Damage protection on all items' },
] as const;

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

export default function RenewPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>('3m');

  const activeDuration = DURATIONS.find((d) => d.key === selected) ?? DURATIONS[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={ms(18)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Renew Plan</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[washColors.navyStart, washColors.navyEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <Text style={styles.planTitle}>Standard Plan</Text>
          <View style={styles.expiredBadge}>
            <Feather name="clock" size={ms(12)} color="#fff" />
            <Text style={styles.expiredText}>Expired July 6, 2026</Text>
          </View>
          <Text style={styles.planDescription}>
            Pick a duration below to renew and keep enjoying unlimited pickups and free delivery.
          </Text>
        </LinearGradient>

        <Text style={styles.sectionLabel}>CHOOSE DURATION</Text>
        <View style={styles.durationList}>
          {DURATIONS.map((d) => {
            const isSelected = d.key === selected;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.durationCard, isSelected && styles.durationCardSelected]}
                activeOpacity={0.85}
                onPress={() => setSelected(d.key)}
              >
                <View style={styles.radioOuter}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                <View style={styles.durationInfo}>
                  <Text style={styles.durationLabel}>{d.label}</Text>
                  <Text style={styles.durationSub}>{formatNaira(d.perMonth)} / month</Text>
                </View>

                <View style={styles.durationRight}>
                  {d.savePct ? (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>SAVE {d.savePct}%</Text>
                    </View>
                  ) : null}
                  <Text style={styles.durationPrice}>{formatNaira(d.price)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>WHAT'S INCLUDED</Text>
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={[styles.featureRow, i !== FEATURES.length - 1 && styles.featureRowDivider]}>
              <View style={styles.featureIconWrap}>
                <MaterialCommunityIcons name={f.icon} size={ms(18)} color={washColors.navySolid} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerSummaryLabel}>Total</Text>
          <Text style={styles.footerSummaryPrice}>{formatNaira(activeDuration.price)}</Text>
        </View>
        <TouchableOpacity
          style={styles.renewButton}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Text style={styles.renewButtonText}>Renew Now</Text>
          <Feather name="arrow-right" size={ms(16)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(20) },

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
    backgroundColor: washColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  planCard: {
    borderRadius: ms(24),
    padding: ms(20),
    marginBottom: ms(24),
  },
  planTitle: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: ms(12) },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    alignSelf: 'flex-start',
    backgroundColor: washColors.overlay,
    borderWidth: 1,
    borderColor: washColors.overlayBorder,
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(14),
    marginBottom: ms(14),
  },
  expiredText: { fontSize: ms(12), fontFamily: fonts.poppins.bold, color: '#fff' },
  planDescription: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(19),
    color: washColors.whiteText85,
  },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: washColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: ms(12),
  },
  sectionSpacing: { marginTop: ms(26) },

  durationList: { gap: ms(10) },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: washColors.surface,
    borderRadius: ms(16),
    borderWidth: 1.5,
    borderColor: washColors.grayBorder,
    paddingVertical: ms(14),
    paddingHorizontal: ms(14),
  },
  durationCardSelected: {
    borderColor: washColors.navySolid,
    backgroundColor: washColors.coveredBg,
  },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: washColors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: washColors.navySolid,
  },
  durationInfo: { flex: 1 },
  durationLabel: { fontSize: ms(14.5), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  durationSub: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: washColors.textSecondary, marginTop: ms(2) },
  durationRight: { alignItems: 'flex-end', gap: ms(4) },
  saveBadge: {
    backgroundColor: washColors.red,
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(10),
  },
  saveBadgeText: { fontSize: ms(9.5), fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.3 },
  durationPrice: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  featuresCard: {
    backgroundColor: washColors.surface,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingVertical: ms(14),
  },
  featureRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: washColors.divider,
  },
  featureIconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: washColors.coveredBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { flex: 1, fontSize: ms(13), fontFamily: fonts.poppins.regular, color: washColors.textPrimary },

  bottomSpacer: { height: ms(100) },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
    backgroundColor: washColors.background,
    paddingHorizontal: ms(20),
    paddingTop: ms(14),
    borderTopWidth: 1,
    borderTopColor: washColors.divider,
  },
  footerSummary: { flex: 1 },
  footerSummaryLabel: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  footerSummaryPrice: { fontSize: ms(20), fontFamily: fonts.poppins.bold, color: washColors.textPrimary, marginTop: ms(2) },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: washColors.red,
    paddingHorizontal: ms(24),
    paddingVertical: ms(16),
    borderRadius: ms(26),
  },
  renewButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});