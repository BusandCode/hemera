import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

export function EPlanHeader({
  wallet,
  initials,
  onPressWallet,
  onPressAvatar,
  onPressBack,
}: {
  wallet?: string;
  initials?: string;
  onPressWallet?: () => void;
  onPressAvatar?: () => void;
  onPressBack?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {onPressBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onPressBack}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
        )}

        <Text style={styles.logo}>
          Hem<Text style={styles.logoAccent}>era</Text>
        </Text>
      </View>

      <View style={styles.right}>
        {wallet && onPressWallet && (
          <TouchableOpacity
            style={styles.walletPill}
            onPress={onPressWallet}
            activeOpacity={0.85}
          >
            <Feather name="credit-card" size={13} color={foodColors.primary} />
            <Text style={styles.walletText}>{wallet}</Text>
          </TouchableOpacity>
        )}

        {initials && onPressAvatar && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={onPressAvatar}
            activeOpacity={0.85}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: serif,
    fontWeight: '700',
    fontSize: 24,
    color: foodColors.textPrimary,
  },
  logoAccent: {
    color: foodColors.primary,
    fontStyle: 'italic',
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: foodColors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  walletText: {
    fontSize: 13,
    fontWeight: '600',
    color: foodColors.textPrimary,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});