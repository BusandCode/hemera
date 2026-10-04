import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData } from '../src/context/AppDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

export default function SavedAddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    addresses,
    addressesLoading,
    addressesError,
    refreshAddresses,
    setDefaultAddress,
    removeAddress,
  } = useAppData();

  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    try {
      await setDefaultAddress(id);
    } catch (e: any) {
      Alert.alert("Couldn't update default", e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = (id: string, label: string) => {
    Alert.alert('Remove address', `Remove your ${label} address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyId(id);
          try {
            await removeAddress(id);
          } catch (e: any) {
            Alert.alert("Couldn't remove address", e?.message ?? 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Saved Addresses" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          These addresses are shared across E-Chop deliveries and E-Wash pickups. Your default
          address sets your delivery location.
        </Text>

        {addressesLoading ? (
          <ActivityIndicator style={styles.loader} color={foodColors.primary} />
        ) : addressesError ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Couldn't load your addresses</Text>
            <Text style={styles.stateText}>{addressesError}</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={refreshAddresses} activeOpacity={0.8}>
              <Text style={styles.linkText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {addresses.map((address) => {
              const busy = busyId === address.id;
              return (
                <View key={address.id} style={[styles.card, busy && styles.cardBusy]}>
                  <View style={styles.iconWrap}>
                    <Feather name={address.icon} size={ms(17)} color={foodColors.primary} />
                  </View>

                  <View style={styles.info}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>{address.label}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultPill}>
                          <Text style={styles.defaultPillText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.line} numberOfLines={2}>
                      {address.line}
                    </Text>
                    <Text style={styles.details}>{address.details}</Text>

                    <View style={styles.actionsRow}>
                      {!address.isDefault && (
                        <TouchableOpacity
                          onPress={() => handleSetDefault(address.id)}
                          disabled={busy}
                        >
                          <Text style={styles.actionText}>Set as default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleRemove(address.id, address.label)}
                        disabled={busy}
                      >
                        <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {addresses.length === 0 && (
              <Text style={styles.emptyText}>You have no saved addresses yet.</Text>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => router.push('/add-address' as any)}
        >
          <Feather name="plus" size={ms(17)} color="#fff" />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  hint: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(17),
    color: foodColors.textSecondary,
    marginBottom: ms(16),
  },

  loader: { marginTop: ms(48) },
  stateBox: { alignItems: 'center', marginTop: ms(40), paddingHorizontal: ms(12) },
  stateTitle: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontSize: ms(13),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(6),
  },
  linkBtn: { marginTop: ms(16), paddingVertical: ms(8), paddingHorizontal: ms(12) },
  linkText: { fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },

  list: { gap: ms(12) },
  card: {
    flexDirection: 'row',
    gap: ms(12),
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(14),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardBusy: { opacity: 0.55 },
  iconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8), marginBottom: ms(4) },
  label: {
    fontSize: ms(15),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  defaultPill: {
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: ms(8),
    paddingVertical: ms(2),
    borderRadius: ms(8),
  },
  defaultPillText: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },
  line: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    lineHeight: ms(18),
  },
  details: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
    marginBottom: ms(10),
  },
  actionsRow: { flexDirection: 'row', gap: ms(18) },
  actionText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },
  removeText: { color: '#FF3B30' },
  emptyText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(40),
  },

  bottomSpacer: { height: ms(90) },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: ms(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
  },
  addButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});