import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';

// TODO: swap for the real display-serif asset once it's added to the project —
// falling back to the platform serif in the meantime.
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export function EPlanHeader({
  wallet,
  initials,
  onPressWallet,
  onPressAvatar,
  onPressBack,
}: {
  wallet: string;
  initials: string;
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
        <TouchableOpacity style={styles.walletChip} onPress={onPressWallet} activeOpacity={0.85}>
          <Feather name="credit-card" size={13} color={foodColors.textPrimary} />
          <Text style={styles.walletLabel}>
            Wallet: <Text style={styles.walletValue}>{wallet}</Text>
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.avatar} onPress={onPressAvatar} activeOpacity={0.85}>
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { fontFamily: serif, fontWeight: '700', fontSize: 24, color: foodColors.textPrimary },
  logoAccent: { color: foodColors.primary, fontStyle: 'italic' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: foodColors.surface,
  },
  walletLabel: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  walletValue: { fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E3FEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontFamily: fonts.poppins.bold, fontSize: 13, color: '#fff' },
});