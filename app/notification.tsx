import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';

type NotificationItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
};

const notifications: NotificationItem[] = [
  {
    id: '1',
    icon: 'package',
    title: 'Order Delivered',
    message: 'Your order #239604 has been delivered. Enjoy!',
    time: '2h ago',
    unread: true,
  },
  {
    id: '2',
    icon: 'tag',
    title: 'Promo Available',
    message: '20% off your next E-Wash order — ends soon.',
    time: '5h ago',
    unread: true,
  },
  {
    id: '3',
    icon: 'truck',
    title: 'Pickup Scheduled',
    message: 'Your laundry pickup is scheduled for tomorrow, 9 AM.',
    time: '1d ago',
  },
  {
    id: '4',
    icon: 'gift',
    title: 'Referral Bonus',
    message: 'You earned ₦500 for referring a friend.',
    time: '3d ago',
  },
];

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={[styles.iconContainer, item.unread && styles.iconContainerUnread]}>
        <Feather
          name={item.icon}
          size={18}
          color={item.unread ? '#fff' : foodColors.textPrimary}
        />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          {item.unread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.rowMessage}>{item.message}</Text>
        <Text style={styles.rowTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.clearButton}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        </View>

        {notifications.length > 0 ? (
          <View style={styles.list}>
            {notifications.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="bell-off" size={40} color={foodColors.textMuted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 46, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  clearButton: { paddingHorizontal: 10, paddingVertical: 6 },
  clearText: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
  list: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerUnread: { backgroundColor: foodColors.primary },
  rowContent: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: foodColors.primary,
  },
  rowMessage: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowTime: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },
  bottomSpacer: { height: 20 },
});