import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

type IconDef =
  | { lib: 'feather'; name: keyof typeof Feather.glyphMap }
  | { lib: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };

type PromiseItem = {
  id: string;
  icon: IconDef;
  title: string;
  body: string;
  accent: string;
  accentBg: string;
};

const PROMISES: PromiseItem[] = [
  {
    id: 'echop',
    icon: { lib: 'feather', name: 'coffee' },
    title: 'E-Chop — Fresh, Every Time',
    body: 'Every meal is cooked to order in verified kitchens, sealed hot, and delivered fast so it reaches you at its best.',
    accent: foodColors.primary,
    accentBg: 'rgba(255,107,53,0.10)',
  },
  {
    id: 'ewash',
    icon: { lib: 'feather', name: 'droplet' },
    title: 'E-Wash — Handled With Care',
    body: 'Fabrics are sorted, washed with premium detergents, and pressed by trained professionals.',
    accent: foodColors.badgeBlue,
    accentBg: 'rgba(46,90,172,0.10)',
  },
  {
    id: 'eplan',
    icon: { lib: 'feather', name: 'calendar' },
    title: 'E-Plan — Locked In & Guaranteed',
    body: 'Your E-Plan balance is securely held. If you cancel, the unused portion is refunded to your wallet — no hidden fees.',
    accent: foodColors.forestGreen,
    accentBg: 'rgba(31,122,74,0.10)',
  },
  {
    id: 'refund',
    icon: { lib: 'mci', name: 'cash-refund' },
    title: 'Not Happy? We Make It Right',
    body: 'Wrong item, poor quality, or a missing order? Report it within 24 hours and we\'ll redo it or refund you in full.',
    accent: '#D97706',
    accentBg: 'rgba(217,119,6,0.10)',
  },
];

const STATS = [
  { value: '500+', label: 'Verified Partners' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Quality Support' },
];

function PromiseIcon({ icon, color }: { icon: IconDef; color: string }) {
  if (icon.lib === 'feather') {
    return <Feather name={icon.name} size={16} color={color} />;
  }
  return <MaterialCommunityIcons name={icon.name} size={18} color={color} />;
}

export default function QualityPromiseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Quality Promise</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="shield-check" size={32} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Our Promise to You</Text>
          <Text style={styles.heroSubtitle}>
            Whether it's a meal, your laundry, or a locked-in E-Plan — we hold every partner and rider to the highest standard.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Guarantees */}
        <Text style={styles.sectionLabel}>WHAT WE GUARANTEE</Text>
        <View style={styles.promisesGroup}>
          {PROMISES.map((p, index) => (
            <View
              key={p.id}
              style={[styles.promiseRow, index === PROMISES.length - 1 && styles.rowLast]}
            >
              <View style={[styles.promiseIconWrap, { backgroundColor: p.accentBg }]}>
                <PromiseIcon icon={p.icon} color={p.accent} />
              </View>
              <View style={styles.promiseInfo}>
                <Text style={styles.promiseTitle}>{p.title}</Text>
                <Text style={styles.promiseBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => router.push('/contact-support' as any)}
        >
          <Feather name="message-circle" size={16} color="#fff" />
          <Text style={styles.ctaText}>Report a Quality Issue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },

  heroCard: {
    backgroundColor: '#161311',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 18,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 19,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  promisesGroup: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  promiseRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  promiseIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promiseInfo: { flex: 1, minWidth: 0 },
  promiseTitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  promiseBody: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});