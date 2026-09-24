import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';

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
          <Feather name="arrow-left" size={18} color={washColors.textPrimary} />
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
            <Feather name="clock" size={12} color="#fff" />
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
                <MaterialCommunityIcons name={f.icon} size={18} color={washColors.navySolid} />
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
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: washColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  planCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  planTitle: { fontSize: 20, fontFamily: fonts.poppins.bold, color: '#fff', marginBottom: 12 },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: washColors.overlay,
    borderWidth: 1,
    borderColor: washColors.overlayBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  expiredText: { fontSize: 12, fontFamily: fonts.poppins.bold, color: '#fff' },
  planDescription: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    lineHeight: 19,
    color: washColors.whiteText85,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: washColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionSpacing: { marginTop: 26 },

  durationList: { gap: 10 },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: washColors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: washColors.grayBorder,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  durationCardSelected: {
    borderColor: washColors.navySolid,
    backgroundColor: washColors.coveredBg,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: washColors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: washColors.navySolid,
  },
  durationInfo: { flex: 1 },
  durationLabel: { fontSize: 14.5, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },
  durationSub: { fontSize: 12, fontFamily: fonts.poppins.regular, color: washColors.textSecondary, marginTop: 2 },
  durationRight: { alignItems: 'flex-end', gap: 4 },
  saveBadge: {
    backgroundColor: washColors.red,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveBadgeText: { fontSize: 9.5, fontFamily: fonts.poppins.bold, color: '#fff', letterSpacing: 0.3 },
  durationPrice: { fontSize: 14, fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  featuresCard: {
    backgroundColor: washColors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  featureRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: washColors.divider,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: washColors.coveredBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { flex: 1, fontSize: 13, fontFamily: fonts.poppins.regular, color: washColors.textPrimary },

  bottomSpacer: { height: 100 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: washColors.background,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: washColors.divider,
  },
  footerSummary: { flex: 1 },
  footerSummaryLabel: { fontSize: 12, fontFamily: fonts.poppins.regular, color: washColors.textSecondary },
  footerSummaryPrice: { fontSize: 20, fontFamily: fonts.poppins.bold, color: washColors.textPrimary, marginTop: 2 },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: washColors.red,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 26,
  },
  renewButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
});