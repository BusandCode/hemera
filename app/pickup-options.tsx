import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

// TODO: replace with the user's real plan status (same source as planStatus on the wash screen).
const HAS_ACTIVE_PLAN = false;

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={26} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REQUEST PICKUP</Text>
        <View style={styles.closeBtn} />
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 80 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.optionCard, styles.subscriberCard]}
          onPress={() => router.push((HAS_ACTIVE_PLAN ? '/request-pickup' : '/choose-plan') as any)}
        >
          <View style={[styles.iconTile, { backgroundColor: ui.subscriberTile }]}>
            <MaterialCommunityIcons name="washing-machine" size={34} color={ui.onCard} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>REQUEST A PICKUP</Text>
            <Text style={styles.optionSubtitle}>(Subscribers, get a plan first)</Text>
            <Text style={styles.optionDescription}>Tap to choose a subscription plan.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.optionCard, styles.payCard]}
          onPress={() => router.push('/pay-per-pickup' as any)}
        >
          <View style={[styles.iconTile, { backgroundColor: ui.payTile }]}>
            <MaterialCommunityIcons name="cash-multiple" size={34} color={ui.onCard} />
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
    paddingHorizontal: 20,
  },
  closeBtn: { width: 32, height: 40, justifyContent: 'center' },
  headerTitle: {
    fontSize: 20,
    letterSpacing: 0.8,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },

  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
    elevation: 8,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
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
    width: 92,
    height: 92,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.poppins.medium,
    color: ui.onCard,
  },
  optionSubtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.poppins.medium,
    color: ui.onCard,
  },
  optionDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.poppins.regular,
    color: ui.onCardSoft,
    marginTop: 6,
  },
});