import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { FilterTabs } from '../src/components/profile/FilterTabs';

type ActivityType = 'echop' | 'ewash';
type ActivityStatus = 'Completed' | 'In Progress' | 'Scheduled' | 'Cancelled';

type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  status: ActivityStatus;
};

const activities: Activity[] = [
  { id: 'a1', type: 'ewash', title: 'E-Wash Pickup', subtitle: 'Laundry · 10 items', date: 'Today, 10:30 AM', amount: 3500, status: 'In Progress' },
  { id: 'a2', type: 'echop', title: 'Party Jollof Rice', subtitle: "Mama Titi's · 2 items", date: 'Today, 1:20 PM', amount: 7700, status: 'In Progress' },
  { id: 'a3', type: 'ewash', title: 'Dry Cleaning', subtitle: 'Express · 4 items', date: 'June 20, 2026', amount: 5200, status: 'Completed' },
  { id: 'a4', type: 'echop', title: 'Beef Suya Platter', subtitle: 'Suya Spot · 1 item', date: 'June 28, 2026', amount: 3200, status: 'Completed' },
  { id: 'a5', type: 'ewash', title: 'Laundry Pickup', subtitle: 'Standard wash · 7 items', date: 'May 28, 2026', amount: 2900, status: 'Completed' },
  { id: 'a6', type: 'echop', title: 'Amala & Ewedu Combo', subtitle: "Mama Titi's · 3 items", date: 'June 10, 2026', amount: 4600, status: 'Cancelled' },
  { id: 'a7', type: 'ewash', title: 'Laundry Pickup', subtitle: 'Scheduled · 6 items', date: 'July 12, 2026', amount: 3100, status: 'Scheduled' },
];

const statusStyles: Record<ActivityStatus, { bg: string; text: string }> = {
  Completed: { bg: 'rgba(52,199,89,0.12)', text: foodColors.success },
  'In Progress': { bg: 'rgba(46,90,172,0.1)', text: foodColors.badgeBlue },
  Scheduled: { bg: 'rgba(226,58,46,0.1)', text: foodColors.primary },
  Cancelled: { bg: 'rgba(255,59,48,0.1)', text: '#FF3B30' },
};

const tabs = ['All', 'E-Chop', 'E-Wash'] as const;

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function ActivityRow({ item }: { item: Activity }) {
  const statusStyle = statusStyles[item.status];
  const isEchop = item.type === 'echop';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, isEchop ? styles.iconWrapEchop : styles.iconWrapEwash]}>
        {isEchop ? (
          <Feather name="coffee" size={18} color={foodColors.primary} />
        ) : (
          <MaterialCommunityIcons name="washing-machine" size={19} color={foodColors.badgeBlue} />
        )}
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.rowAmount}>{formatNaira(item.amount)}</Text>
        </View>
        <Text style={styles.rowSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        <View style={styles.rowBottom}>
          <View style={styles.dateRow}>
            <Feather name="clock" size={11} color={foodColors.textMuted} />
            <Text style={styles.rowDate}>{item.date}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RecentActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');

  const filtered = useMemo(() => {
    if (activeTab === 'All') return activities;
    const type: ActivityType = activeTab === 'E-Chop' ? 'echop' : 'ewash';
    return activities.filter((a) => a.type === type);
  }, [activeTab]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Activity</Text>
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsWrap}>
        <FilterTabs
          tabs={tabs as unknown as string[]}
          active={activeTab}
          onSelect={(t) => setActiveTab(t as any)}
        />
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {filtered.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={38} color={foodColors.textMuted} />
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptySubtitle}>
                Your E-Chop orders and E-Wash pickups will appear here.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5.5%',
    paddingTop: Platform.OS === 'ios' ? 6 : 16,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  clearButton: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  clearText: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },

  tabsWrap: { paddingHorizontal: '5.5%', marginBottom: 14 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },
  list: { gap: 12 },

  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapEchop: { backgroundColor: foodColors.primaryLight },
  iconWrapEwash: { backgroundColor: 'rgba(46,90,172,0.1)' },

  rowInfo: { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  rowAmount: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowDate: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10.5, fontFamily: fonts.poppins.bold },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 17,
  },

  bottomSpacer: { height: 20 },
});