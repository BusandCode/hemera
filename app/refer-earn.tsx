import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const REFERRAL_CODE = 'SULE-4K92';

const steps = [
  { id: '1', icon: 'share-2', title: 'Share your code', subtitle: 'Send your referral code to friends and family' },
  { id: '2', icon: 'user-plus', title: 'They sign up', subtitle: 'Your friend creates an account using your code' },
  { id: '3', icon: 'gift', title: 'You both earn', subtitle: 'Get ₦1,000 credit once they complete their first order' },
] as const;

const invites = [
  { id: 'i1', name: 'Chidinma O.', status: 'Joined', reward: 1000 },
  { id: 'i2', name: 'Yusuf B.', status: 'Pending first order', reward: 0 },
];

export default function ReferEarnScreen() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Share.share({
      message: `Use my code ${REFERRAL_CODE} to sign up and we both earn ₦1,000 credit!`,
    }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Refer & Earn" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[foodColors.primary, foodColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Give ₦1,000, Get ₦1,000</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends to BusandCode and earn credit for every successful referral.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Feather
                name={copied ? 'check' : 'copy'}
                size={14}
                color={foodColors.primaryDark}
              />
              <Text style={styles.copyButtonText}>{copied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
            <Feather name="share-2" size={15} color="#fff" />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.earningsRow}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>₦1,000</Text>
            <Text style={styles.earningsLabel}>Total Earned</Text>
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>2</Text>
            <Text style={styles.earningsLabel}>Friends Invited</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>How it works</Text>
        <View style={styles.stepsGroup}>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <Feather
                  name={step.icon as keyof typeof Feather.glyphMap}
                  size={16}
                  color={foodColors.primary}
                />
              </View>
              <View style={styles.stepTextBlock}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Your Invites</Text>
        <View style={styles.stepsGroup}>
          {invites.map((invite) => (
            <View key={invite.id} style={styles.inviteRow}>
              <View style={styles.inviteAvatar}>
                <Text style={styles.inviteAvatarText}>{invite.name.charAt(0)}</Text>
              </View>
              <View style={styles.stepTextBlock}>
                <Text style={styles.stepTitle}>{invite.name}</Text>
                <Text style={styles.stepSubtitle}>{invite.status}</Text>
              </View>
              {invite.reward > 0 && (
                <Text style={styles.inviteReward}>+₦{invite.reward.toLocaleString()}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  heroCard: { borderRadius: 22, padding: 20, marginBottom: 14 },
  heroTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 18,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  codeText: {
    fontSize: 16,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 1,
    color: '#fff',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  copyButtonText: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.primaryDark,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 13,
    borderRadius: 24,
  },
  shareButtonText: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  earningsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  earningsCard: {
    flex: 1,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  earningsValue: {
    fontSize: 18,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  earningsLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 10,
  },
  stepsGroup: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextBlock: { flex: 1, minWidth: 0 },
  stepTitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  inviteAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: foodColors.badgeBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteAvatarText: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  inviteReward: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.success,
  },

  bottomSpacer: { height: 20 },
});