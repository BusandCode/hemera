import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { ms } from '../../utils/responsive';

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
            <Feather name="arrow-left" size={ms(18)} color={foodColors.textPrimary} />
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
            <Feather name="credit-card" size={ms(13)} color={foodColors.primary} />
            <Text style={styles.walletText}>{wallet}</Text>
          </TouchableOpacity>
        )}

        {/* {initials && onPressAvatar && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={onPressAvatar}
            activeOpacity={0.85}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        )} */}
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
    gap: ms(10),
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  backBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: serif,
    fontWeight: '700',
    fontSize: ms(20),
    color: foodColors.textPrimary,
  },
  logoAccent: {
    color: foodColors.primary,
    fontStyle: 'italic',
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: foodColors.surface,
    borderRadius: ms(20),
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
    borderWidth: 1,
    borderColor: foodColors.border,
  },
  walletText: {
    fontSize: ms(13),
    fontWeight: '600',
    color: foodColors.textPrimary,
  },
  avatar: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: ms(13),
    fontWeight: '700',
    color: '#fff',
  },
});