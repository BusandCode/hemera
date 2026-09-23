// src/components/profile/OrderCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

export type OrderStatus = 'Delivered' | 'In Progress' | 'Cancelled' | 'Scheduled';
export type OrderType = 'echop' | 'ewash';

export type Order = {
  id: string;
  type: OrderType;
  title: string;
  meta: string;
  date: string;
  amount: number;
  status: OrderStatus;
};

const statusStyles: Record<OrderStatus, { bg: string; text: string }> = {
  Delivered: { bg: 'rgba(52,199,89,0.12)', text: foodColors.success },
  'In Progress': { bg: 'rgba(46,90,172,0.1)', text: foodColors.badgeBlue },
  Scheduled: { bg: 'rgba(226,58,46,0.1)', text: foodColors.primary },
  Cancelled: { bg: 'rgba(255,59,48,0.1)', text: '#FF3B30' },
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function OrderCard({ order, onPress }: { order: Order; onPress?: () => void }) {
  const statusStyle = statusStyles[order.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.iconWrap}>
        {order.type === 'echop' ? (
          <Feather name="coffee" size={17} color={foodColors.primary} />
        ) : (
          <MaterialCommunityIcons name="washing-machine" size={18} color={foodColors.badgeBlue} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {order.title}
          </Text>
          <Text style={styles.amount}>{formatNaira(order.amount)}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {order.meta}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.date}>{order.date}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{order.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  amount: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  meta: { fontSize: 12, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: 2, marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10.5, fontFamily: fonts.poppins.bold },
});