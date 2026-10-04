import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { REFERRAL_FOOD_DISCOUNT, REFERRAL_LAUNDRY_PERCENT } from '../src/constants/referral';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useReferral, type Referral, type RewardType } from '../src/context/ReferralContext';
import { ms } from '../src/utils/responsive';

const FOOD_REWARD = `₦${REFERRAL_FOOD_DISCOUNT.toLocaleString('en-US')}`;
const LAUNDRY_REWARD = `${REFERRAL_LAUNDRY_PERCENT}%`;

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
    subtitle: `Pick ${FOOD_REWARD} off your next food order or ${LAUNDRY_REWARD} off your next laundry plan`,
  },
  {
    id: '4',
    icon: 'award',
    title: 'Milestone Challenge',
    subtitle: 'Refer 50 friends and get 1 month of Standard Plan free!',
  },
] as const;

type InviteRow = Referral & { number: number };

function describeInvite(invite: InviteRow): string {
  const rewardText =
    invite.rewardType === 'laundry'
      ? `${LAUNDRY_REWARD} off your next laundry plan`
      : `${FOOD_REWARD} off your next food order`;

  switch (invite.status) {
    case 'pending':
      return 'Signed up — waiting on their first order';
    case 'earned':
      return 'First order done — choose your reward';
    case 'claimed':
      return `Reward ready — ${rewardText}`;
    case 'redeemed':
      return 'Reward used';
    default:
      return '';
  }
}

export default function ReferEarnScreen() {
  const router = useRouter();
  const {
    code,
    loading,
    invitedCount,
    qualifiedCount,
    referrals,
    claimReward,
    shareInvite,
    refresh,
  } = useReferral();

  const [claimTarget, setClaimTarget] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<RewardType | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Newest first, numbered in the order friends joined.
  const invites: InviteRow[] = referrals.map((r, i) => ({ ...r, number: i + 1 })).reverse();

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleOpenRewardModal = (referralId: string) => {
    setSelectedReward(null);
    setClaimError(null);
    setClaimTarget(referralId);
  };

  const handlePickReward = async (choice: RewardType) => {
    if (!claimTarget || claiming) return;
    setClaiming(true);
    setClaimError(null);
    try {
      await claimReward(claimTarget, choice);
      setSelectedReward(choice);
    } catch (e: any) {
      setClaimError(e?.message ?? 'Could not claim this reward. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleCloseModal = () => {
    setClaimTarget(null);
    setSelectedReward(null);
    setClaimError(null);
  };

  const successMessage =
    selectedReward === 'food'
      ? `${FOOD_REWARD} credit locked in! It will apply automatically at your next food checkout.`
      : selectedReward === 'laundry'
        ? `${LAUNDRY_REWARD} discount locked in! It will apply automatically to your next laundry subscription renewal.`
        : '';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Refer & Earn" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={foodColors.primary}
          />
        }
      >
        <LinearGradient
          colors={[foodColors.primary, foodColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Get {FOOD_REWARD}, Choose Your Reward</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends to Hemera. When they complete their first order, you choose
            your reward, {FOOD_REWARD} off food or {LAUNDRY_REWARD} off laundry. It applies
            automatically.
          </Text>

          <TouchableOpacity
            style={styles.linkBox}
            onPress={handleCopyCode}
            disabled={!code}
            activeOpacity={0.85}
          >
            <Feather name="gift" size={ms(14)} color="rgba(255,255,255,0.9)" />
            <Text style={styles.codeText} numberOfLines={1}>
              {code || 'Getting your code…'}
            </Text>
            <View style={styles.copyChip}>
              <Feather
                name={copied ? 'check' : 'copy'}
                size={ms(12)}
                color={foodColors.primaryDark}
              />
              <Text style={styles.copyChipText}>{copied ? 'Copied' : 'Copy'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, !code && styles.rewardOptionDisabled]}
            onPress={shareInvite}
            disabled={!code}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={ms(15)} color="#fff" />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.earningsRow}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>{qualifiedCount}</Text>
            <Text style={styles.earningsLabel}>Rewards Earned</Text>
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>{invitedCount}</Text>
            <Text style={styles.earningsLabel}>Friends Joined</Text>
          </View>
        </View>

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
                    size={ms(16)}
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

        <Text style={[styles.sectionLabel, styles.invitesLabel]}>Your Invites</Text>

        {loading ? (
          <ActivityIndicator style={styles.invitesLoader} color={foodColors.primary} />
        ) : invites.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="users" size={ms(22)} color={foodColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No invites yet</Text>
            <Text style={styles.emptyText}>
              When a friend signs up with your code, they'll show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.stepsGroup}>
            {invites.map((invite, index) => {
              const isLast = index === invites.length - 1;
              const isLaundry = invite.rewardType === 'laundry';
              const chipColor = isLaundry ? foodColors.badgeBlue : foodColors.primary;

              return (
                <View key={invite.id} style={[styles.inviteRow, isLast && styles.inviteRowLast]}>
                  <View style={styles.inviteAvatar}>
                    <Text style={styles.inviteAvatarText}>{invite.number}</Text>
                  </View>
                  <View style={styles.stepTextBlock}>
                    <Text style={styles.stepTitle}>Friend #{invite.number}</Text>
                    <Text style={styles.stepSubtitle}>{describeInvite(invite)}</Text>
                  </View>

                  {invite.status === 'pending' && (
                    <View style={styles.pendingChip}>
                      <Text style={styles.pendingChipText}>Pending</Text>
                    </View>
                  )}

                  {invite.status === 'earned' && (
                    <TouchableOpacity
                      style={styles.chooseChip}
                      onPress={() => handleOpenRewardModal(invite.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.chooseChipText}>Choose reward</Text>
                    </TouchableOpacity>
                  )}

                  {invite.status === 'claimed' && invite.rewardType && (
                    <View
                      style={[
                        styles.rewardChip,
                        isLaundry ? styles.rewardChipLaundry : styles.rewardChipFood,
                      ]}
                    >
                      <Feather
                        name={isLaundry ? 'droplet' : 'coffee'}
                        size={ms(10)}
                        color={chipColor}
                      />
                      <Text style={[styles.rewardChipText, { color: chipColor }]}>
                        {isLaundry ? `${LAUNDRY_REWARD} Laundry` : `${FOOD_REWARD} Food`}
                      </Text>
                    </View>
                  )}

                  {invite.status === 'redeemed' && (
                    <View style={styles.pendingChip}>
                      <Text style={styles.pendingChipText}>Used</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Reward selection modal */}
      <Modal
        visible={claimTarget !== null}
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
                  A friend just completed their first order using your invite link. You've
                  unlocked a reward!
                </Text>

                <Text style={styles.modalSectionLabel}>Choose your reward</Text>

                <TouchableOpacity
                  style={[styles.rewardOption, claiming && styles.rewardOptionDisabled]}
                  activeOpacity={0.85}
                  disabled={claiming}
                  onPress={() => handlePickReward('food')}
                >
                  <View style={styles.rewardOptionIcon}>
                    <Feather name="coffee" size={ms(20)} color={foodColors.primary} />
                  </View>
                  <View style={styles.rewardOptionTextBlock}>
                    <Text style={styles.rewardOptionTitle}>
                      {FOOD_REWARD} off your next food order
                    </Text>
                    <Text style={styles.rewardOptionSubtitle}>
                      Applied automatically at checkout — no code needed
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={ms(18)} color={foodColors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rewardOption, claiming && styles.rewardOptionDisabled]}
                  activeOpacity={0.85}
                  disabled={claiming}
                  onPress={() => handlePickReward('laundry')}
                >
                  <View style={styles.rewardOptionIcon}>
                    <Feather name="droplet" size={ms(20)} color={foodColors.badgeBlue} />
                  </View>
                  <View style={styles.rewardOptionTextBlock}>
                    <Text style={styles.rewardOptionTitle}>
                      {LAUNDRY_REWARD} off your next laundry plan
                    </Text>
                    <Text style={styles.rewardOptionSubtitle}>
                      Applied automatically to your next subscription renewal
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={ms(18)} color={foodColors.textMuted} />
                </TouchableOpacity>

                {claiming && <ActivityIndicator color={foodColors.primary} style={{ marginTop: 6 }} />}
                {claimError && <Text style={styles.claimError}>{claimError}</Text>}

                <Text style={styles.modalFootnote}>
                  Select one to apply automatically to your account
                </Text>
              </>
            ) : (
              <>
                <View style={styles.successIconWrap}>
                  <Feather name="check" size={ms(30)} color="#fff" />
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
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  heroCard: { borderRadius: ms(22), padding: ms(20), marginBottom: ms(14) },
  heroTitle: {
    fontSize: ms(20),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginBottom: ms(6),
  },
  heroSubtitle: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(18),
    color: 'rgba(255,255,255,0.85)',
    marginBottom: ms(18),
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: ms(14),
    paddingLeft: ms(14),
    paddingRight: ms(6),
    paddingVertical: ms(8),
    marginBottom: ms(14),
  },
  codeText: {
    flex: 1,
    fontSize: ms(16),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 1.5,
    color: '#fff',
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: '#fff',
    paddingHorizontal: ms(10),
    paddingVertical: ms(7),
    borderRadius: ms(10),
  },
  copyChipText: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primaryDark,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: ms(13),
    borderRadius: ms(24),
  },
  shareButtonText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  earningsRow: { flexDirection: 'row', gap: ms(12), marginBottom: ms(12) },
  earningsCard: {
    flex: 1,
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    paddingVertical: ms(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  earningsValue: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  earningsLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(10),
  },
  sectionLabel: {
  fontSize: ms(13),
  fontFamily: fonts.poppins.bold,
  color: foodColors.textPrimary,
},
  sectionLink: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  stepsGroup: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    overflow: 'hidden',
    marginBottom: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  stepRowLast: { borderBottomWidth: 0 },
  stepIconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextBlock: { flex: 1, minWidth: 0 },
  stepTitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  stepSubtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  inviteRowLast: { borderBottomWidth: 0 },
  inviteAvatar: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: foodColors.badgeBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteAvatarText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(12),
  },
  rewardChipFood: { backgroundColor: foodColors.primaryLight },
  rewardChipLaundry: { backgroundColor: 'rgba(37,93,222,0.1)' },
  rewardChipText: {
    fontSize: ms(10.5),
    fontFamily: fonts.poppins.bold,
  },
  pendingChip: {
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(12),
    backgroundColor: 'rgba(181,175,168,0.18)',
  },
  pendingChipText: {
    fontSize: ms(10.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
  },

  emptyCard: {
    alignItems: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    paddingVertical: ms(26),
    paddingHorizontal: ms(20),
    marginBottom: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emptyIconWrap: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    backgroundColor: foodColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(12),
  },
  emptyTitle: {
    fontSize: ms(14.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  emptyText: {
    fontSize: ms(12),
    lineHeight: ms(18),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(4),
  },
  invitesLoader: { marginVertical: ms(24) },
  chooseChip: {
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: ms(12),
    backgroundColor: foodColors.primary,
  },
  chooseChipText: {
    fontSize: ms(10.5),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  claimError: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
    textAlign: 'center',
    marginTop: ms(4),
  },
  rewardOptionDisabled: { opacity: 0.5 },
  invitesLabel: { marginBottom: ms(10) },

  bottomSpacer: { height: ms(20) },

  // ----- Modal -----
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: foodColors.surface,
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    paddingHorizontal: ms(22),
    paddingTop: ms(10),
    paddingBottom: ms(32),
    alignItems: 'stretch',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: ms(40),
    height: 4,
    borderRadius: ms(2),
    backgroundColor: foodColors.border,
    marginBottom: ms(16),
  },
  celebrateIconWrap: {
    alignSelf: 'center',
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: foodColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(12),
  },
  celebrateEmoji: { fontSize: ms(30) },
  successIconWrap: {
    alignSelf: 'center',
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: foodColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(12),
  },
  modalTitle: {
    fontSize: ms(19),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    marginBottom: ms(6),
  },
  modalBody: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(19),
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: ms(20),
  },
  modalSectionLabel: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(10),
  },
  rewardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: foodColors.background,
    borderRadius: ms(16),
    padding: ms(14),
    borderWidth: 1,
    borderColor: foodColors.border,
    marginBottom: ms(10),
  },
  rewardOptionIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: foodColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardOptionTextBlock: { flex: 1, minWidth: 0 },
  rewardOptionTitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  rewardOptionSubtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },
  modalFootnote: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    textAlign: 'center',
    marginTop: ms(8),
  },
  doneButton: {
    backgroundColor: foodColors.primary,
    borderRadius: ms(24),
    paddingVertical: ms(14),
    alignItems: 'center',
    marginTop: ms(8),
  },
  doneButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});