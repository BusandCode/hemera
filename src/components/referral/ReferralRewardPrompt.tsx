import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { useReferral, RewardType } from '../../context/ReferralContext';

export function ReferralRewardPrompt() {
  const { earned, claimReward } = useReferral();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<RewardType | null>(null);
  const [error, setError] = useState('');

  const current = earned.find((r) => !dismissedIds.includes(r.id));

  const choose = async (choice: RewardType) => {
    if (!current || busy) return;
    setBusy(choice);
    setError('');
    try {
      await claimReward(current.id, choice);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const dismiss = () => {
    if (!current || busy) return;
    setError('');
    setDismissedIds((ids) => [...ids, current.id]);
  };

  return (
    <Modal visible={!!current} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name="gift" size={24} color={foodColors.primary} />
          </View>
          <Text style={styles.title}>You've earned a reward!</Text>
          <Text style={styles.body}>
            Apply 1,000 Naira off your next food order OR a 5% discount to your next laundry
            subscription?
          </Text>

          {error.length > 0 && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => choose('food')}
            disabled={!!busy}
            activeOpacity={0.85}
          >
            {busy === 'food' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="coffee" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>₦1,000 off food order</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => choose('laundry')}
            disabled={!!busy}
            activeOpacity={0.85}
          >
            {busy === 'laundry' ? (
              <ActivityIndicator color={foodColors.badgeBlue} />
            ) : (
              <>
                <MaterialCommunityIcons name="washing-machine" size={18} color={foodColors.badgeBlue} />
                <Text style={styles.secondaryBtnText}>5% off laundry subscription</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={dismiss} disabled={!!busy}>
            <Text style={styles.laterText}>Decide later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: '7%',
  },
  card: {
    backgroundColor: foodColors.surface,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 18,
  },
  error: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 14,
    borderRadius: 26,
  },
  primaryBtnText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },
  secondaryBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(46,90,172,0.1)',
    paddingVertical: 14,
    borderRadius: 26,
    marginTop: 10,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },
  laterBtn: { paddingVertical: 12, marginTop: 4 },
  laterText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
});