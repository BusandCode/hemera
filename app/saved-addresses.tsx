import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData } from '../src/context/AppDataContext';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { addresses, setDefaultAddress, removeAddress } = useAppData();

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
          These addresses are shared across E-Chop deliveries and E-Wash pickups — set one as
          default under Delivery Preferences.
        </Text>

        <View style={styles.list}>
          {addresses.map((address) => (
            <View key={address.id} style={styles.card}>
              <View style={styles.iconWrap}>
                <Feather name={address.icon} size={17} color={foodColors.primary} />
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
                    <TouchableOpacity onPress={() => setDefaultAddress(address.id)}>
                      <Text style={styles.actionText}>Set as default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => removeAddress(address.id)}>
                    <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {addresses.length === 0 && (
            <Text style={styles.emptyText}>You have no saved addresses yet.</Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => router.push('/add-address' as any)}
        >
          <Feather name="plus" size={17} color="#fff" />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  hint: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    lineHeight: 17,
    color: foodColors.textSecondary,
    marginBottom: 16,
  },

  list: { gap: 12 },
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
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: {
    fontSize: 15,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  defaultPill: {
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultPillText: {
    fontSize: 10,
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
  },
  line: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    lineHeight: 18,
  },
  details: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  actionsRow: { flexDirection: 'row', gap: 18 },
  actionText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },
  removeText: { color: '#FF3B30' },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },

  bottomSpacer: { height: 90 },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});