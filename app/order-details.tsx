import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { useAppData } from '../src/context/AppDataContext';

type StepIcon = keyof typeof MaterialCommunityIcons.glyphMap;

type Step = {
  key: string;
  title: string;
  description: string;
  icon: StepIcon;
};

type OrderItem = {
  key: string;
  name: string;
  quantity: number;
};

const STEPS: Step[] = [
  { key: 'scheduled', title: 'Scheduled', description: 'Your pickup is booked.', icon: 'calendar' },
  { key: 'picked-up', title: 'Picked Up', description: 'Your laundry has been picked up.', icon: 'truck' },
  {
    key: 'processing',
    title: 'Processing',
    description: 'Your clothes are being pampered at the hub.',
    icon: 'washing-machine',
  },
  { key: 'ready', title: 'Ready', description: 'Clean, folded, and ready for delivery.', icon: 'check-circle-outline' },
  { key: 'out-for-delivery', title: 'Out for Delivery', description: 'On its way back to you.', icon: 'moped' },
  { key: 'delivered', title: 'Delivered', description: 'Delivered. Enjoy!', icon: 'check-circle-outline' },
];

const CURRENT_STEP = 0;
const PLACED_AT = 'Jun 6, 2026 2:27 AM';
const PICKUP_DATE = 'Sunday, June 7, 2026';
const TIME_SLOT = 'Evening · 4 PM – 8 PM';

const ITEMS: OrderItem[] = [
  { key: 'mens-shirt', name: "Men's Shirt", quantity: 4 },
  { key: 'mens-trousers', name: "Men's Trousers", quantity: 4 },
];

const PAYMENT = {
  title: 'Plan credit',
  description: '1 pickup deducted from your active plan.',
  totalLabel: 'Total paid',
  totalValue: 'Covered by plan',
};

const ui = {
  border: '#E8E3D0',
  slate: '#5F6B77',
  pillBg: '#EDEEF1',
  circleIdle: '#EFE8D8',
  iconIdle: '#F8F4EA',
  line: '#EFE8D8',
  titleIdle: '#A3A8B4',
  value: '#4A5563',
  blue: '#2253C9',
  blueTile: '#DCEAFF',
  blueTileSoft: '#E6EDFF',
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addresses } = useAppData();

  const orderId = id ?? '239604';
  const address = addresses.find((a) => a.isDefault) ?? addresses[0];
  const addressLine = address?.line ?? 'No address on file';
  const addressDetails = address?.details ?? '';
  const totalItems = ITEMS.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Order details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <Text style={styles.orderNumber}>Order #{orderId}</Text>
            <View style={styles.statusPill}>
              <Feather name="calendar" size={15} color={ui.slate} />
              <Text style={styles.statusPillText}>{STEPS[CURRENT_STEP].title}</Text>
            </View>
          </View>
          <Text style={styles.placed}>Placed {PLACED_AT}</Text>
        </View>

        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={[styles.card, styles.timelineCard]}>
          {STEPS.map((step, index) => {
            const reached = index <= CURRENT_STEP;
            const isLast = index === STEPS.length - 1;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepCircle, reached && styles.stepCircleReached]}>
                    <MaterialCommunityIcons
                      name={step.icon}
                      size={21}
                      color={reached ? '#fff' : ui.iconIdle}
                    />
                  </View>
                  {!isLast && (
                    <View style={[styles.stepLine, index < CURRENT_STEP && styles.stepLineReached]} />
                  )}
                </View>

                <View style={[styles.stepBody, !isLast && styles.stepBodySpacing]}>
                  <Text style={[styles.stepTitle, reached && styles.stepTitleReached]}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Pickup & delivery</Text>
        <View style={[styles.card, styles.detailsCard]}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Feather name="map-pin" size={20} color={washColors.textPrimary} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>Pickup address</Text>
              <Text style={styles.detailValue}>{addressLine}</Text>
              {addressDetails ? <Text style={styles.addressDetails}>{addressDetails}</Text> : null}
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialCommunityIcons name="calendar" size={22} color={washColors.textPrimary} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>Pickup date</Text>
              <Text style={styles.detailValue}>{PICKUP_DATE}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Feather name="clock" size={20} color={washColors.textPrimary} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>Time slot</Text>
              <Text style={styles.detailValue}>{TIME_SLOT}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Items ({totalItems})</Text>
        <View style={[styles.card, styles.itemsCard]}>
          {ITEMS.map((item) => (
            <View key={item.key} style={styles.itemRow}>
              <View style={styles.itemIconTile}>
                <MaterialCommunityIcons name="hanger" size={24} color={ui.blue} />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>× {item.quantity}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={[styles.card, styles.paymentCard]}>
          <View style={styles.paymentTop}>
            <View style={styles.paymentIconTile}>
              <MaterialCommunityIcons name="medal-outline" size={28} color={ui.blue} />
            </View>
            <View style={styles.paymentBody}>
              <Text style={styles.paymentTitle}>{PAYMENT.title}</Text>
              <Text style={styles.paymentDescription}>{PAYMENT.description}</Text>
            </View>
          </View>

          <View style={styles.paymentDivider} />

          <View style={styles.paymentTotalRow}>
            <Text style={styles.paymentTotalLabel}>{PAYMENT.totalLabel}</Text>
            <Text style={styles.paymentTotalValue}>{PAYMENT.totalValue}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: { width: 32, height: 40, justifyContent: 'center' },
  title: {
    fontSize: 20,
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    paddingHorizontal: 22,
    paddingVertical: 22,
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  orderNumber: {
    flexShrink: 1,
    fontSize: 24,
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ui.pillBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 14,
    fontFamily: fonts.poppins.medium,
    color: ui.slate,
  },
  placed: {
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
    marginTop: 26,
    marginBottom: 14,
    marginLeft: 4,
  },

  timelineCard: { paddingVertical: 20 },
  stepRow: { flexDirection: 'row', gap: 16 },
  stepRail: { alignItems: 'center', width: 44 },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ui.circleIdle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleReached: { backgroundColor: ui.slate },
  stepLine: { flex: 1, width: 3, backgroundColor: ui.line },
  stepLineReached: { backgroundColor: ui.slate },
  stepBody: { flex: 1, paddingTop: 1 },
  stepBodySpacing: { paddingBottom: 22 },
  stepTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.poppins.medium,
    color: ui.titleIdle,
  },
  stepTitleReached: { color: washColors.textPrimary },
  stepDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 1,
  },

  detailsCard: { paddingVertical: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 16 },
  detailIcon: { width: 28, alignItems: 'center', paddingTop: 2 },
  detailBody: { flex: 1 },
  detailLabel: {
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: ui.titleIdle,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fonts.poppins.regular,
    color: ui.value,
  },
  addressDetails: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 2,
  },
  detailDivider: { height: 1, backgroundColor: ui.line, marginLeft: 42 },

  itemsCard: { paddingVertical: 16 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  itemIconTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: ui.blueTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.poppins.regular,
    color: ui.value,
  },
  itemQty: {
    fontSize: 18,
    fontFamily: fonts.poppins.medium,
    color: washColors.textPrimary,
  },

  paymentCard: { paddingVertical: 20 },
  paymentTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  paymentIconTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: ui.blueTileSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBody: { flex: 1 },
  paymentTitle: {
    fontSize: 18,
    fontFamily: fonts.poppins.medium,
    color: ui.blue,
  },
  paymentDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.poppins.regular,
    color: ui.value,
    marginTop: 2,
  },
  paymentDivider: { height: 1, backgroundColor: ui.line, marginVertical: 16 },
  paymentTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentTotalLabel: {
    fontSize: 15,
    fontFamily: fonts.poppins.medium,
    color: ui.value,
  },
  paymentTotalValue: {
    fontSize: 22,
    fontFamily: fonts.poppins.medium,
    color: ui.blue,
  },
});