import { useEffect, useRef, useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { FilterTabs } from '../src/components/profile/FilterTabs';
import { ms } from '../src/utils/responsive';

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
const COPIED_MS = 2000;

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const copyCode = async (offer: Offer) => {
    try {
      await Clipboard.setStringAsync(offer.code);
      setCopiedId(offer.id);
      setToast(`${offer.code} copied. Paste it at checkout.`);
    } catch {
      setCopiedId(null);
      setToast("Couldn't copy the code. Please try again.");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setCopiedId(null);
      setToast(null);
    }, COPIED_MS);
  };

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
          <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Exclusive deals curated for you. Tap a code to copy it and use it at checkout.
        </Text>

        <View style={styles.list}>
          {filtered.map((offer) => {
            const copied = copiedId === offer.id;
            return (
              <View key={offer.id} style={styles.offerCard}>
                <View style={[styles.offerIconWrap, { backgroundColor: offer.accent }]}>
                  <Feather name={offer.icon} size={ms(20)} color="#fff" />
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
                    <TouchableOpacity
                      style={[styles.codeBox, copied && { borderColor: offer.accent }]}
                      activeOpacity={0.7}
                      onPress={() => copyCode(offer)}
                      accessibilityRole="button"
                      accessibilityLabel={`Copy code ${offer.code}`}
                    >
                      <Feather name="tag" size={ms(12)} color={offer.accent} />
                      <Text style={[styles.codeText, { color: offer.accent }]} selectable>
                        {offer.code}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.copyBtn,
                        { backgroundColor: copied ? foodColors.forestGreen : offer.accent },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => copyCode(offer)}
                      accessibilityRole="button"
                      accessibilityLabel={copied ? 'Code copied' : `Copy code ${offer.code}`}
                    >
                      <Feather name={copied ? 'check' : 'copy'} size={ms(12)} color="#fff" />
                      <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="tag" size={ms(32)} color={foodColors.textMuted} />
              <Text style={styles.emptyTitle}>No offers here yet</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon — new deals drop every week.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {toast && (
        <View
          pointerEvents="none"
          style={[styles.toast, { bottom: insets.bottom + 20 }]}
          accessibilityLiveRegion="polite"
        >
          <Feather name="check-circle" size={ms(16)} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20) },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(20),
    marginBottom: ms(12),
  },
  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: ms(22),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },

  tabsWrap: { paddingHorizontal: ms(20), marginBottom: ms(14) },

  subtitle: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: ms(18),
    marginBottom: ms(18),
  },

  list: { gap: ms(14) },
  offerCard: {
    flexDirection: 'row',
    gap: ms(14),
    backgroundColor: foodColors.surface,
    borderRadius: ms(18),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  offerIconWrap: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerInfo: { flex: 1, minWidth: 0 },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ms(8),
  },
  offerTitle: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    lineHeight: ms(19),
  },
  expiryPill: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(8),
  },
  expiryText: {
    fontSize: ms(9.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
  offerSubtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: ms(16),
    marginTop: ms(4),
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginTop: ms(12),
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: foodColors.border,
    borderRadius: ms(10),
    paddingHorizontal: ms(10),
    paddingVertical: ms(6),
  },
  codeText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    borderRadius: ms(10),
  },
  copyBtnText: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  toast: {
    position: 'absolute',
    left: ms(20),
    right: ms(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: foodColors.textPrimary,
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderRadius: ms(14),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    flex: 1,
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: '#fff',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: ms(60),
    gap: ms(8),
  },
  emptyTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginTop: ms(6),
  },
  emptySubtitle: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: ms(24),
    lineHeight: ms(17),
  },
});