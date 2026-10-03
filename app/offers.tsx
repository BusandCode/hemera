import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { FilterTabs } from '../src/components/profile/FilterTabs';

type Offer = {
  id: string;
  category: 'E-Chop' | 'E-Wash' | 'All';
  title: string;
  subtitle: string;
  code: string;
  expires: string;
  accent: string;
  icon: keyof typeof Feather.glyphMap;
};

const OFFERS: Offer[] = [
  {
    id: 'o1',
    category: 'E-Chop',
    title: '20% Off Your First Order',
    subtitle: 'On any meal from a verified partner kitchen',
    code: 'CHOP20',
    expires: 'Ends Dec 31',
    accent: foodColors.primary,
    icon: 'coffee',
  },
  {
    id: 'o2',
    category: 'E-Wash',
    title: 'Free Pickup & Delivery',
    subtitle: 'On laundry orders above ₦5,000',
    code: 'WASHFREE',
    expires: 'Ends Nov 30',
    accent: foodColors.badgeBlue,
    icon: 'droplet',
  },
  {
    id: 'o3',
    category: 'All',
    title: '₦1,000 Referral Bonus',
    subtitle: 'Invite a friend and earn when they order',
    code: 'REFER1K',
    expires: 'Ongoing',
    accent: foodColors.forestGreen,
    icon: 'gift',
  },
  {
    id: 'o4',
    category: 'E-Chop',
    title: 'Buy 1 Get 1 Free',
    subtitle: 'On selected rice dishes every Friday',
    code: 'FRIRICE',
    expires: 'Ends Jan 15',
    accent: '#D97706',
    icon: 'tag',
  },
  {
    id: 'o5',
    category: 'E-Wash',
    title: 'Express Wash at Standard Price',
    subtitle: 'Upgrade to express for free this month',
    code: 'EXPRESS0',
    expires: 'Ends Dec 15',
    accent: '#7C3AED',
    icon: 'zap',
  },
];

const TABS = ['All', 'E-Chop', 'E-Wash'] as const;

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All');

  const filtered =
    activeTab === 'All'
      ? OFFERS
      : OFFERS.filter((o) => o.category === activeTab || o.category === 'All');

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
        <Text style={styles.title}>Offers</Text>
      </View>

      <View style={styles.tabsWrap}>
        <FilterTabs
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onSelect={(t) => setActiveTab(t as any)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Exclusive deals curated for you. Tap to copy a code and use it at checkout.
        </Text>

        <View style={styles.list}>
          {filtered.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={[styles.offerIconWrap, { backgroundColor: offer.accent }]}>
                <Feather name={offer.icon} size={20} color="#fff" />
              </View>

              <View style={styles.offerInfo}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle} numberOfLines={2}>
                    {offer.title}
                  </Text>
                  <View style={styles.expiryPill}>
                    <Text style={styles.expiryText}>{offer.expires}</Text>
                  </View>
                </View>

                <Text style={styles.offerSubtitle} numberOfLines={2}>
                  {offer.subtitle}
                </Text>

                <View style={styles.codeRow}>
                  <View style={styles.codeBox}>
                    <Feather name="tag" size={12} color={offer.accent} />
                    <Text style={[styles.codeText, { color: offer.accent }]}>
                      {offer.code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyBtn, { backgroundColor: offer.accent }]}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.copyBtnText}>Copy Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="tag" size={32} color={foodColors.textMuted} />
              <Text style={styles.emptyTitle}>No offers here yet</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon — new deals drop every week.
              </Text>
            </View>
          )}
        </View>
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

  tabsWrap: { paddingHorizontal: 20, marginBottom: 14 },

  subtitle: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
  },

  list: { gap: 14 },
  offerCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: foodColors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  offerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerInfo: { flex: 1, minWidth: 0 },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  offerTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    lineHeight: 19,
  },
  expiryPill: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  expiryText: {
    fontSize: 9.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
  offerSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: foodColors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  codeText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.8,
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyBtnText: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 17,
  },
});