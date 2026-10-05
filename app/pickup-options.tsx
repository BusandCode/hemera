import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { usePlanStatus } from '../src/hooks/usePlanStatus';
import { ms } from '../src/utils/responsive';

const ui = {
  heading: foodColors.badgeBlue,
  subscriberCard: foodColors.primary,
  subscriberBorder: '#E27272',
  subscriberTile: 'rgba(255,255,255,0.22)',
  payCard: foodColors.badgeBlue,
  payBorder: '#5B8DF0',
  payTile: 'rgba(255,255,255,0.2)',
  onCard: '#FFFFFF',
  onCardSoft: 'rgba(255,255,255,0.88)',
};

export default function PickupOptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status: planStatus } = usePlanStatus();

  const hasActivePlan = planStatus === 'active';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={ms(26)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REQUEST PICKUP</Text>
        <View style={styles.closeBtn} />
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 80 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.optionCard, styles.subscriberCard]}
          onPress={() =>
            router.push(
              (hasActivePlan ? '/request-pickup' : '/choose-plan') as any
            )
          }
        >
          <View style={[styles.iconTile, { backgroundColor: ui.subscriberTile }]}>
            <MaterialCommunityIcons name="washing-machine" size={ms(34)} color={ui.onCard} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>
              {hasActivePlan ? 'USE YOUR PLAN' : 'REQUEST A PICKUP'}
            </Text>
            <Text style={styles.optionSubtitle}>
              {hasActivePlan
                ? '(Covered by your subscription)'
                : '(Subscribers, get a plan first)'}
            </Text>
            <Text style={styles.optionDescription}>
              {hasActivePlan
                ? 'Tap to send laundry with your plan.'
                : 'Tap to choose a subscription plan.'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.optionCard, styles.payCard]}
          onPress={() => router.push('/pay-per-pickup' as any)}
        >
          <View style={[styles.iconTile, { backgroundColor: ui.payTile }]}>
            <MaterialCommunityIcons name="cash-multiple" size={ms(34)} color={ui.onCard} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>REQUEST A PICKUP</Text>
            <Text style={styles.optionSubtitle}>(Outside your plan)</Text>
            <Text style={styles.optionDescription}>
              Need a pickup beyond your plan? Pay per order, no monthly subscription required.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
  },
  closeBtn: { width: ms(32), height: ms(40), justifyContent: 'center' },
  headerTitle: {
    fontSize: ms(20),
    letterSpacing: 0.8,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: ms(16),
    gap: ms(16),
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(16),
    borderRadius: ms(26),
    borderWidth: 1,
    paddingHorizontal: ms(20),
    paddingVertical: ms(22),
    elevation: 8,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: ms(8) },
  },
  subscriberCard: {
    backgroundColor: ui.subscriberCard,
    borderColor: ui.subscriberBorder,
    shadowColor: ui.subscriberCard,
  },
  payCard: {
    backgroundColor: ui.payCard,
    borderColor: ui.payBorder,
    shadowColor: ui.payCard,
  },

  iconTile: {
    width: ms(92),
    height: ms(92),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: ms(22),
    lineHeight: ms(28),
    fontFamily: fonts.poppins.medium,
    color: ui.onCard,
  },
  optionSubtitle: {
    fontSize: ms(18),
    lineHeight: ms(24),
    fontFamily: fonts.poppins.medium,
    color: ui.onCard,
  },
  optionDescription: {
    fontSize: ms(15),
    lineHeight: ms(22),
    fontFamily: fonts.poppins.regular,
    color: ui.onCardSoft,
    marginTop: ms(6),
  },
});