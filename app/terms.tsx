import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';

type Section = {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  points: string[];
};

const LAST_UPDATED = 'October 2, 2026';

const sections: Section[] = [
  {
    title: 'Subscription plans',
    icon: 'repeat',
    points: [
      'Your plan starts on the day payment is confirmed and runs for the duration you select (1, 3, 6 or 12 months).',
      'Each plan includes a set number of pickups, items and large items per month, as shown on the plan.',
      'Monthly pickups and item allowances reset at the start of each billing month and do not roll over.',
      'Items beyond your monthly allowance are charged at the standard pay-per-order rate.',
      'Plans do not renew automatically. We will remind you before your plan expires so you can renew.',
    ],
  },
  {
    title: 'Billing & payments',
    icon: 'credit-card',
    points: [
      'Plans are paid upfront for the full duration selected, using your wallet or card.',
      'Discounts on longer durations are applied at checkout and shown before you pay.',
      'Express delivery and other add-ons are charged separately at the time of the order.',
    ],
  },
  {
    title: 'Pickups & delivery',
    icon: 'truck',
    points: [
      'Pickups and deliveries are made to the address on your account unless you update it before the pickup.',
      'Please have your laundry bagged and ready at the scheduled time.',
      'A missed pickup counts toward your monthly allowance.',
      'Turnaround times depend on your plan and start from when your items are picked up.',
    ],
  },
  {
    title: 'Item care & damage',
    icon: 'shield',
    points: [
      'We inspect every item before processing and will report any existing stains or damage to you.',
      'We are not responsible for items damaged due to faulty fabric, missing care labels, or items left in pockets.',
      'Report any issue with a returned order within 2 hours of delivery so we can investigate.',
      'Where we are at fault, compensation is limited to 3x price of the washing value and up to 25,000 NGN compensation.',
    ],
  },
  {
    title: 'Cancellations & refunds',
    icon: 'rotate-ccw',
    points: [
      'You can cancel your plan within 24 hours of purchase for a full refund, provided no pickup has been made.',
    //   'Payments are non-refundable once your first pickup under the plan has been completed.',
      'Unused pickups or items at the end of your plan are not refunded.',
    ],
  },
  {
    title: 'Changes to these terms',
    icon: 'edit-3',
    points: [
      'We may update these terms from time to time. Changes will be shown in the app with a new “last updated” date.',
      'Changes do not affect a plan you have already paid for until it expires.',
    ],
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={ms(18)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms & Conditions</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.updatedPill}>
            <Feather name="clock" size={ms(11)} color={washColors.navySolid} />
            <Text style={styles.updatedText}>Last updated {LAST_UPDATED}</Text>
          </View>
          <Text style={styles.introText}>
            These terms explain how our laundry plans, pickups and deliveries work. By subscribing to a
            plan or requesting a pickup, you agree to them.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={section.title} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Feather name={section.icon} size={ms(16)} color={washColors.navySolid} />
              </View>
              <Text style={styles.sectionTitle}>
                {index + 1}. {section.title}
              </Text>
            </View>

            {section.points.map((point) => (
              <View key={point} style={styles.pointRow}>
                <View style={styles.pointDot} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Feather name="help-circle" size={ms(18)} color={washColors.textPrimary} />
          <Text style={styles.contactText}>
            Questions about these terms? Reach our support team from the Help section in the app.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.doneButtonText}>Got it</Text>
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

  introCard: {
    backgroundColor: '#FBF3D9',
    borderRadius: ms(18),
    padding: ms(16),
    marginBottom: ms(16),
  },
  updatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    alignSelf: 'flex-start',
    backgroundColor: washColors.surface,
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: ms(12),
    marginBottom: ms(10),
  },
  updatedText: { fontSize: ms(11), fontFamily: fonts.poppins.bold, color: washColors.navySolid },
  introText: {
    fontSize: ms(13),
    lineHeight: ms(20),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },

  sectionCard: {
    backgroundColor: washColors.surface,
    borderRadius: ms(18),
    padding: ms(16),
    marginBottom: ms(12),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginBottom: ms(12),
  },
  sectionIconWrap: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: washColors.textPrimary },

  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(10),
    marginBottom: ms(8),
  },
  pointDot: {
    width: 5,
    height: 5,
    borderRadius: ms(3),
    backgroundColor: washColors.red,
    marginTop: ms(8),
  },
  pointText: {
    flex: 1,
    fontSize: ms(12.5),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    backgroundColor: washColors.coveredBg,
    borderRadius: ms(16),
    padding: ms(14),
    marginTop: ms(4),
  },
  contactText: {
    flex: 1,
    fontSize: ms(12.5),
    lineHeight: ms(18),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },

  bottomSpacer: { height: ms(20) },

  footer: {
    backgroundColor: washColors.background,
    paddingHorizontal: ms(20),
    paddingTop: ms(12),
    borderTopWidth: 1,
    borderTopColor: washColors.divider,
  },
  doneButton: {
    backgroundColor: washColors.navySolid,
    paddingVertical: ms(16),
    borderRadius: ms(28),
    alignItems: 'center',
  },
  doneButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});