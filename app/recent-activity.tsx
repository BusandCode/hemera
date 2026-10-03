import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { FilterTabs } from '../src/components/profile/FilterTabs';
import type { Order } from '../src/components/profile/OrderCard';
import { useOrders } from '../src/hooks/useOrders';

type ActivityLabel = 'Completed' | 'In Progress' | 'Scheduled' | 'Cancelled';

const statusStyles: Record<ActivityLabel, { bg: string; text: string }> = {
  Completed: { bg: 'rgba(52,199,89,0.12)', text: foodColors.success },
  'In Progress': { bg: 'rgba(46,90,172,0.1)', text: foodColors.badgeBlue },
  Scheduled: { bg: 'rgba(226,58,46,0.1)', text: foodColors.primary },
  Cancelled: { bg: 'rgba(255,59,48,0.1)', text: '#FF3B30' },
};

const tabs = ['All', 'E-Chop', 'E-Wash'] as const;

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function toLabel(status: Order['status']): ActivityLabel {
  return status === 'Delivered' ? 'Completed' : (status as ActivityLabel);
}

function ActivityRow({ item }: { item: Order }) {
  const label = toLabel(item.status);
  const statusStyle = statusStyles[label];
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
        <Text style={styles.rowSubtitle} numberOfLines={1}>{item.meta}</Text>
        <View style={styles.rowBottom}>
          <View style={styles.dateRow}>
            <Feather name="clock" size={11} color={foodColors.textMuted} />
            <Text style={styles.rowDate}>{item.date}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{label}</Text>
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
  const { orders, loading, error } = useOrders();

  const filtered = useMemo(() => {
    if (activeTab === 'All') return orders;
    const type: Order['type'] = activeTab === 'E-Chop' ? 'echop' : 'ewash';
    return orders.filter((o) => o.type === type);
  }, [activeTab, orders]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

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

      <View style={styles.tabsWrap}>
        <FilterTabs
          tabs={tabs as unknown as string[]}
          active={activeTab}
          onSelect={(t) => setActiveTab(t as any)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={foodColors.primary} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Feather name="alert-circle" size={38} color={foodColors.textMuted} />
            <Text style={styles.emptyTitle}>Couldn't load activity</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
          </View>
        ) : (
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
        )}
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
  loader: { marginTop: 48 },

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