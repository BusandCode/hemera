import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { ms } from '../src/utils/responsive';

type Term = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
};

const terms: Term[] = [
  {
    id: 'eligibility',
    icon: 'check-circle',
    title: 'Eligibility',
    body:
      'You earn a reward when a referred friend completes their first successful food order or laundry subscription using your code.',
  },
  {
    id: 'reward-choice',
    icon: 'gift',
    title: 'Reward Choice',
    body:
      'Referrers can choose between ₦1,000 off a food order or 5% off a laundry subscription plan for each successful referral.',
  },
  {
    id: 'milestone',
    icon: 'award',
    title: 'Milestone Bonus',
    body:
      'Reaching 50 successful referrals unlocks 1 month of the free Standard Plan.',
  },
  {
    id: 'no-cash',
    icon: 'x-circle',
    title: 'No Cash Value',
    body:
      'Referral rewards and milestone perks cannot be exchanged for cash, transferred, or combined with unsupported promotions, and are applied directly to your account.',
  },
  {
    id: 'fair-use',
    icon: 'shield',
    title: 'Fair Use',
    body:
      'The platform reserves the right to suspend or revoke rewards for suspicious, fraudulent, or abusive referral activity.',
  },
];

export default function ReferTermsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Referral Terms" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Referral Program Terms & Conditions</Text>
        <Text style={styles.pageSubtitle}>
          Please read these terms carefully. By participating in the Hemera referral
          program, you agree to the conditions below.
        </Text>

        <View style={styles.termsGroup}>
          {terms.map((term, index) => {
            const isLast = index === terms.length - 1;
            return (
              <View key={term.id} style={[styles.termRow, isLast && styles.termRowLast]}>
                <View style={styles.termIconWrap}>
                  <Feather name={term.icon} size={ms(16)} color={foodColors.primary} />
                </View>
                <View style={styles.termTextBlock}>
                  <Text style={styles.termTitle}>{term.title}</Text>
                  <Text style={styles.termBody}>{term.body}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footerNote}>
          <Feather name="info" size={ms(14)} color={foodColors.textMuted} />
          <Text style={styles.footerText}>
            These terms may be updated at any time. Continued use of the referral program
            constitutes acceptance of the latest version.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingTop: ms(4), paddingBottom: ms(16) },

  pageTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(6),
  },
  pageSubtitle: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(18),
    color: foodColors.textSecondary,
    marginBottom: ms(18),
  },

  termsGroup: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    overflow: 'hidden',
    marginBottom: ms(18),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  termRowLast: { borderBottomWidth: 0 },
  termIconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termTextBlock: { flex: 1, minWidth: 0 },
  termTitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(2),
  },
  termBody: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(18),
    color: foodColors.textSecondary,
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(8),
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    padding: ms(14),
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  footerText: {
    flex: 1,
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(17),
    color: foodColors.textMuted,
  },

  bottomSpacer: { height: ms(20) },
});