import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { useReferral, RewardType } from '../../context/ReferralContext';
import { ms } from '../../utils/responsive';

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
            <Feather name="gift" size={ms(24)} color={foodColors.primary} />
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
                <Feather name="coffee" size={ms(16)} color="#fff" />
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
                <MaterialCommunityIcons name="washing-machine" size={ms(18)} color={foodColors.badgeBlue} />
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
    width: '100%',
    maxWidth: ms(420),
    alignSelf: 'center',
    backgroundColor: foodColors.surface,
    borderRadius: ms(22),
    padding: ms(22),
    alignItems: 'center',
  },
  iconWrap: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(16),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(14),
  },
  title: {
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    lineHeight: ms(19),
    marginTop: ms(8),
    marginBottom: ms(18),
  },
  error: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: ms(12),
  },
  primaryBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: foodColors.primary,
    paddingVertical: ms(14),
    borderRadius: ms(26),
  },
  primaryBtnText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
  secondaryBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: 'rgba(46,90,172,0.1)',
    paddingVertical: ms(14),
    borderRadius: ms(26),
    marginTop: ms(10),
  },
  secondaryBtnText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },
  laterBtn: { paddingVertical: ms(12), marginTop: ms(4) },
  laterText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
});