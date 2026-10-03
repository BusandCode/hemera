import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Modal,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const REFERRAL_CODE = 'SULE-4K92';
const SHARE_URL = `${REFERRAL_CODE}`;

const steps = [
  {
    id: '1',
    icon: 'share-2',
    title: 'Share your invite link',
    subtitle: 'One link for everything — send it to friends and family',
  },
  {
    id: '2',
    icon: 'user-plus',
    title: 'They sign up & order',
    subtitle: 'Your friend creates an account and completes their first order or laundry plan',
  },
  {
    id: '3',
    icon: 'gift',
    title: 'Choose your reward',
    subtitle: 'Pick ₦1,000 off your next food order or 5% off your next laundry plan',
  },
  {
    id: '4',
    icon: 'award',
    title: 'Milestone Challenge',
    subtitle: 'Refer 50 friends and get 1 month of Standard Plan free!',
  },
] as const;

type Invite = {
  id: string;
  name: string;
  status: string;
  reward?: string;
  rewardType?: 'food' | 'laundry';
  pending?: boolean;
};

const invites: Invite[] = [
  {
    id: 'i1',
    name: 'Chidinma O.',
    status: 'Reward applied — ₦1,000 off your next food order',
    reward: '₦1,000 Food',
    rewardType: 'food',
  },
  {
    id: 'i2',
    name: 'Amina Y.',
    status: 'Reward applied — 5% off your next laundry plan',
    reward: '5% Laundry',
    rewardType: 'laundry',
  },
  {
    id: 'i3',
    name: 'Yusuf B.',
    status: 'Waiting on their first order',
    pending: true,
  },
];

type RewardChoice = 'food' | 'laundry';

export default function ReferEarnScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardChoice | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(REFERRAL_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = () => {
    Share.share({
      message: `Join me on Hemera! Use my invite code to sign up: ${SHARE_URL}`,
    }).catch(() => {});
  };

  const handleOpenRewardModal = () => {
    setSelectedReward(null);
    setModalVisible(true);
  };

  const handlePickReward = (choice: RewardChoice) => {
    setSelectedReward(choice);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedReward(null);
  };

  const successMessage =
    selectedReward === 'food'
      ? '₦1,000 credit locked in! It will apply automatically at your next food checkout.'
      : selectedReward === 'laundry'
        ? '5% discount locked in! It will apply automatically to your next laundry subscription renewal.'
        : '';

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
          <Text style={styles.heroTitle}>Get ₦1,000, Choose Your Reward</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends to Hemera. When they complete their first order, you choose
            your reward, ₦1,000 off food or 5% off laundry. It applies automatically.
          </Text>

          <TouchableOpacity
            style={styles.linkBox}
            onPress={handleCopyCode}
            activeOpacity={0.85}
          >
            <Feather name="gift" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.codeText} numberOfLines={1}>
              {REFERRAL_CODE}
            </Text>
            <View style={styles.copyChip}>
              <Feather
                name={copied ? 'check' : 'copy'}
                size={12}
                color={foodColors.primaryDark}
              />
              <Text style={styles.copyChipText}>{copied ? 'Copied' : 'Copy'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={15} color="#fff" />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.earningsRow}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>₦2,000</Text>
            <Text style={styles.earningsLabel}>Total Earned</Text>
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>3</Text>
            <Text style={styles.earningsLabel}>Friends Invited</Text>
          </View>
        </View>

        {/* Dev preview trigger — remove in production, hook to backend instead */}
        <TouchableOpacity
          style={styles.previewButton}
          onPress={handleOpenRewardModal}
          activeOpacity={0.85}
        >
          <Feather name="gift" size={14} color={foodColors.primary} />
          <Text style={styles.previewButtonText}>Preview reward</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>How it works</Text>
          <TouchableOpacity
            onPress={() => router.push('/refer-terms' as any)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.sectionLink}>T&C Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stepsGroup}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <View key={step.id} style={[styles.stepRow, isLast && styles.stepRowLast]}>
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
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Your Invites</Text>
        <View style={styles.stepsGroup}>
          {invites.map((invite, index) => {
            const isLast = index === invites.length - 1;
            return (
              <View key={invite.id} style={[styles.inviteRow, isLast && styles.inviteRowLast]}>
                <View style={styles.inviteAvatar}>
                  <Text style={styles.inviteAvatarText}>{invite.name.charAt(0)}</Text>
                </View>
                <View style={styles.stepTextBlock}>
                  <Text style={styles.stepTitle}>{invite.name}</Text>
                  <Text style={styles.stepSubtitle}>{invite.status}</Text>
                </View>
                {invite.reward && (
                  <View
                    style={[
                      styles.rewardChip,
                      invite.rewardType === 'laundry'
                        ? styles.rewardChipLaundry
                        : styles.rewardChipFood,
                    ]}
                  >
                    <Feather
                      name={invite.rewardType === 'laundry' ? 'droplet' : 'coffee'}
                      size={10}
                      color={
                        invite.rewardType === 'laundry'
                          ? foodColors.badgeBlue
                          : foodColors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.rewardChipText,
                        {
                          color:
                            invite.rewardType === 'laundry'
                              ? foodColors.badgeBlue
                              : foodColors.primary,
                        },
                      ]}
                    >
                      {invite.reward}
                    </Text>
                  </View>
                )}
                {invite.pending && (
                  <View style={styles.pendingChip}>
                    <Text style={styles.pendingChipText}>Pending</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Reward selection modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseModal}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />

            {selectedReward === null ? (
              <>
                <View style={styles.celebrateIconWrap}>
                  <Text style={styles.celebrateEmoji}>🎉</Text>
                </View>

                <Text style={styles.modalTitle}>Referral Successful!</Text>
                <Text style={styles.modalBody}>
                  Amina just completed her first order using your invite link. You've
                  unlocked a reward!
                </Text>

                <Text style={styles.modalSectionLabel}>Choose your reward</Text>

                <TouchableOpacity
                  style={styles.rewardOption}
                  activeOpacity={0.85}
                  onPress={() => handlePickReward('food')}
                >
                  <View style={styles.rewardOptionIcon}>
                    <Feather name="coffee" size={20} color={foodColors.primary} />
                  </View>
                  <View style={styles.rewardOptionTextBlock}>
                    <Text style={styles.rewardOptionTitle}>
                      ₦1,000 off your next food order
                    </Text>
                    <Text style={styles.rewardOptionSubtitle}>
                      Applied automatically at checkout — no code needed
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rewardOption}
                  activeOpacity={0.85}
                  onPress={() => handlePickReward('laundry')}
                >
                  <View style={styles.rewardOptionIcon}>
                    <Feather name="droplet" size={20} color={foodColors.badgeBlue} />
                  </View>
                  <View style={styles.rewardOptionTextBlock}>
                    <Text style={styles.rewardOptionTitle}>
                      5% off your next laundry plan
                    </Text>
                    <Text style={styles.rewardOptionSubtitle}>
                      Applied automatically to your next subscription renewal
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.modalFootnote}>
                  Select one to apply automatically to your account
                </Text>
              </>
            ) : (
              <>
                <View style={styles.successIconWrap}>
                  <Feather name="check" size={30} color="#fff" />
                </View>

                <Text style={styles.modalTitle}>Reward locked in!</Text>
                <Text style={styles.modalBody}>{successMessage}</Text>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleCloseModal}
                  activeOpacity={0.85}
                >
                  <Text style={styles.doneButtonText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    marginBottom: 14,
  },
  codeText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 1.5,
    color: '#fff',
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  copyChipText: {
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

  earningsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
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

  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: foodColors.primaryLight,
    backgroundColor: foodColors.primaryLight,
    marginBottom: 20,
  },
  previewButtonText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
  fontSize: 13,
  fontFamily: fonts.poppins.bold,
  color: foodColors.textPrimary,
},
  sectionLink: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
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
  stepRowLast: { borderBottomWidth: 0 },
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
  inviteRowLast: { borderBottomWidth: 0 },
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
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardChipFood: { backgroundColor: foodColors.primaryLight },
  rewardChipLaundry: { backgroundColor: 'rgba(37,93,222,0.1)' },
  rewardChipText: {
    fontSize: 10.5,
    fontFamily: fonts.poppins.bold,
  },
  pendingChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(181,175,168,0.18)',
  },
  pendingChipText: {
    fontSize: 10.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
  },

  bottomSpacer: { height: 20 },

  // ----- Modal -----
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: foodColors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: foodColors.border,
    marginBottom: 16,
  },
  celebrateIconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: foodColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  celebrateEmoji: { fontSize: 30 },
  successIconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: foodColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalBody: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    lineHeight: 19,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSectionLabel: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 10,
  },
  rewardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: foodColors.border,
    marginBottom: 10,
  },
  rewardOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: foodColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardOptionTextBlock: { flex: 1, minWidth: 0 },
  rewardOptionTitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  rewardOptionSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },
  modalFootnote: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  doneButton: {
    backgroundColor: foodColors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});