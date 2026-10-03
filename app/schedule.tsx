import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

type PickupStatus = 'scheduled' | 'out-for-delivery';

type Pickup = {
  id: string;
  month: string;
  day: number;
  slot: string;
  status: PickupStatus;
};

type StatusIcon = keyof typeof MaterialCommunityIcons.glyphMap;

const STATUS_STYLE: Record<
  PickupStatus,
  { label: string; icon: StatusIcon; bg: string; fg: string }
> = {
  scheduled: { label: 'Scheduled', icon: 'calendar', bg: '#EDEEF1', fg: '#5F6B77' },
  'out-for-delivery': { label: 'Out for Delivery', icon: 'moped', bg: '#E3F1E8', fg: '#1F7A4A' },
};

const INITIAL_PICKUPS: Pickup[] = [
  { id: '781126', month: 'MAY', day: 4, slot: 'Evening · 4 PM – 8 PM', status: 'out-for-delivery' },
  { id: '239604', month: 'JUN', day: 7, slot: 'Evening · 4 PM – 8 PM', status: 'scheduled' },
  { id: '193021', month: 'JUN', day: 7, slot: 'Morning · 8 AM – 12 PM', status: 'scheduled' },
  { id: '217452', month: 'JUN', day: 9, slot: 'Morning · 8 AM – 12 PM', status: 'scheduled' },
];

const ui = {
  border: '#E8E3D0',
  heading: '#1E3A9F',
  blue: '#2563EB',
  dateTile: '#DBEAFE',
  slate: '#5F6B77',
  chevron: '#8A94A3',
  noticeBg: '#FBF1D5',
  noticeText: '#1E3A9F',
  noticeIcon: '#E0A91F',
  heroStart: '#1E3FAE',
  heroMid: '#2563EB',
  heroEnd: '#5B9BF5',
};

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pickups, setPickups] = useState<Pickup[]>(INITIAL_PICKUPS);

  const openOrder = (id: string) => {
    router.push({ pathname: '/order-details', params: { id } } as any);
  };

  const cancelPickup = (id: string) => {
    Alert.alert('Cancel pickup?', `Order #${id} will be removed from your schedule.`, [
      { text: 'Keep pickup', style: 'cancel' },
      {
        text: 'Cancel pickup',
        style: 'destructive',
        onPress: () => setPickups((current) => current.filter((p) => p.id !== id)),
      },
    ]);
  };

  const requestCancelViaSupport = (id: string) => {
    router.push('/contact-support' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.85}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Schedule</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[ui.heroStart, ui.heroMid, ui.heroEnd]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.hero}
        >
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Schedule a pickup</Text>
            <Text style={styles.heroSubtitle}>Pick a date and time, we handle the rest.</Text>
          </View>
          <TouchableOpacity
            style={styles.heroPlus}
            onPress={() => router.push('/pickup-options' as any)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Upcoming pickups</Text>

        {pickups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No upcoming pickups</Text>
            <Text style={styles.emptyText}>Schedule a pickup and it will show up here.</Text>
          </View>
        ) : (
          pickups.map((pickup) => {
            const status = STATUS_STYLE[pickup.status];
            const locked = pickup.status !== 'scheduled';

            return (
              <View key={pickup.id} style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.cardTop}
                  onPress={() => openOrder(pickup.id)}
                >
                  <View style={styles.dateTile}>
                    <Text style={styles.dateMonth}>{pickup.month}</Text>
                    <Text style={styles.dateDay}>{pickup.day}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.orderId}>Order #{pickup.id}</Text>
                    <Text style={styles.slot}>{pickup.slot}</Text>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                      <MaterialCommunityIcons name={status.icon} size={15} color={status.fg} />
                      <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={22} color={ui.chevron} />
                </TouchableOpacity>

                {locked ? (
                  <>
                    <View style={styles.notice}>
                      <Feather name="headphones" size={18} color={ui.noticeIcon} />
                      <Text style={styles.noticeText}>
                        Already with our team — message support to request a cancel.
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.actionButton, styles.supportButton]}
                      onPress={() => requestCancelViaSupport(pickup.id)}
                    >
                      <Feather name="message-square" size={20} color={ui.blue} />
                      <Text style={[styles.actionText, { color: ui.blue }]}>Request cancel via support</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => cancelPickup(pickup.id)}
                  >
                    <Feather name="x-circle" size={20} color={foodColors.primary} />
                    <Text style={[styles.actionText, { color: foodColors.primary }]}>Cancel pickup</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    elevation: 8,
    shadowColor: ui.heroMid,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  heroText: { flex: 1, paddingRight: 12 },
  heroTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: fonts.poppins.medium,
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  heroPlus: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: foodColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  sectionTitle: {
    fontSize: 22,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
    marginTop: 28,
    marginBottom: 14,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateTile: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: ui.dateTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: 15,
    letterSpacing: 0.6,
    fontFamily: fonts.poppins.regular,
    color: ui.heading,
  },
  dateDay: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  cardInfo: { flex: 1 },
  orderId: {
    fontSize: 20,
    fontFamily: fonts.poppins.medium,
    color: ui.heading,
  },
  slot: {
    fontSize: 15,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontFamily: fonts.poppins.medium,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ui.noticeBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.poppins.regular,
    color: ui.noticeText,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 16,
    marginTop: 14,
  },
  cancelButton: { borderColor: foodColors.primary },
  supportButton: { borderColor: ui.blue },
  actionText: {
    fontSize: 18,
    fontFamily: fonts.poppins.medium,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ui.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.poppins.medium,
    color: foodColors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});