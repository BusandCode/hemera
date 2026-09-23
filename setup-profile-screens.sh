#!/usr/bin/env bash
# Scaffolds every Profile-flow screen + shared components into your Expo project.
# Run this from your project ROOT (the folder that contains app/ and src/).
set -e

echo "Creating directories..."
mkdir -p "app"
mkdir -p "app/(tabs)"
mkdir -p "src/components/profile"

echo "Writing src/components/profile/ScreenHeader.tsx"
cat > "src/components/profile/ScreenHeader.tsx" << 'EOF_MARKER'
// src/components/profile/ScreenHeader.tsx
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { foodColors } from '../../constants/foodColors';

type Props = {
  title: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  rightLabel?: string;
  onPressRight?: () => void;
};

export function ScreenHeader({ title, rightIcon, rightLabel, onPressRight }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.sideButton}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={22} color={foodColors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightIcon && onPressRight ? (
        <TouchableOpacity style={[styles.sideButton, styles.rightButton]} onPress={onPressRight}>
          <Feather name={rightIcon} size={15} color={foodColors.primary} />
          {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5.5%',
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
    paddingBottom: 14,
  },
  sideButton: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: foodColors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  rightLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: foodColors.primary,
  },
});
EOF_MARKER

echo "Writing src/components/profile/OrderCard.tsx"
cat > "src/components/profile/OrderCard.tsx" << 'EOF_MARKER'
// src/components/profile/OrderCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';

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
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: foodColors.textPrimary },
  amount: { fontSize: 13, fontWeight: '700', color: foodColors.textPrimary },
  meta: { fontSize: 12, color: foodColors.textSecondary, marginTop: 2, marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11.5, color: foodColors.textMuted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
});
EOF_MARKER

echo "Writing src/components/profile/FilterTabs.tsx"
cat > "src/components/profile/FilterTabs.tsx" << 'EOF_MARKER'
// src/components/profile/FilterTabs.tsx
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { foodColors } from '../../constants/foodColors';

type Props = {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
};

export function FilterTabs({ tabs, active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: foodColors.surface,
  },
  pillActive: {
    backgroundColor: foodColors.primary,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: foodColors.textSecondary,
  },
  pillTextActive: {
    color: '#fff',
  },
});
EOF_MARKER

echo "Writing app/personal-information.tsx"
cat > "app/personal-information.tsx" << 'EOF_MARKER'
// app/personal-information.tsx
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Field = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
};

const fields: Field[] = [
  { key: 'fullName', label: 'Full Name', icon: 'user' },
  { key: 'email', label: 'Email Address', icon: 'mail', keyboardType: 'email-address' },
  { key: 'phone', label: 'Phone Number', icon: 'phone', keyboardType: 'phone-pad' },
  { key: 'gender', label: 'Gender', icon: 'users' },
  { key: 'dob', label: 'Date of Birth', icon: 'calendar' },
];

export default function PersonalInformationScreen() {
  const [values, setValues] = useState<Record<string, string>>({
    fullName: 'Suleiman Abubakar',
    email: 'suleiman@example.com',
    phone: '+234 803 123 4567',
    gender: 'Male',
    dob: '14 March 1998',
  });
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Personal Information" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: 'https://ui-avatars.com/api/?name=Suleiman&background=FF6B35&color=fff&size=120',
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.avatarEditButton}>
              <Feather name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap the icon to change your photo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <View style={styles.fieldInputWrap}>
                <Feather name={field.icon} size={16} color={foodColors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  value={values[field.key]}
                  onChangeText={(text) => update(field.key, text)}
                  keyboardType={field.keyboardType ?? 'default'}
                  placeholderTextColor={foodColors.textMuted}
                />
              </View>
            </View>
          ))}
        </View>

        {saved && (
          <View style={styles.savedBanner}>
            <Feather name="check-circle" size={14} color={foodColors.success} />
            <Text style={styles.savedBannerText}>Your changes have been saved</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  avatarSection: { alignItems: 'center', marginBottom: 26 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: foodColors.background,
  },
  avatarHint: { fontSize: 12, color: foodColors.textSecondary, marginTop: 10 },

  form: { gap: 16 },
  fieldBlock: {},
  fieldLabel: { fontSize: 12, fontWeight: '600', color: foodColors.textSecondary, marginBottom: 6 },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 4,
  },
  fieldInput: { flex: 1, fontSize: 14, color: foodColors.textPrimary, padding: 0, minWidth: 0 },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  savedBannerText: { fontSize: 12, fontWeight: '600', color: foodColors.success },

  bottomSpacer: { height: 90 },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  saveButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
EOF_MARKER

echo "Writing app/saved-addresses.tsx"
cat > "app/saved-addresses.tsx" << 'EOF_MARKER'
// app/saved-addresses.tsx
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Address = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  line: string;
  details: string;
  isDefault: boolean;
};

const initialAddresses: Address[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    line: '14 Adekunle Fajuyi Road, GRA',
    details: 'Lokoja, Kogi State',
    isDefault: true,
  },
  {
    id: 'work',
    label: 'Work',
    icon: 'briefcase',
    line: 'Suite 4B, Zenith Plaza, Murtala Way',
    details: 'Lokoja, Kogi State',
    isDefault: false,
  },
  {
    id: 'other',
    label: "Mum's Place",
    icon: 'map-pin',
    line: '22 Crowther Street',
    details: 'Lokoja, Kogi State',
    isDefault: false,
  },
];

export default function SavedAddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);

  const setDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const removeAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
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
                    <TouchableOpacity onPress={() => setDefault(address.id)}>
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
        <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
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
  label: { fontSize: 15, fontWeight: '700', color: foodColors.textPrimary },
  defaultPill: {
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultPillText: { fontSize: 10, fontWeight: '700', color: foodColors.primary },
  line: { fontSize: 13, color: foodColors.textPrimary, lineHeight: 18 },
  details: { fontSize: 12, color: foodColors.textSecondary, marginTop: 2, marginBottom: 10 },
  actionsRow: { flexDirection: 'row', gap: 18 },
  actionText: { fontSize: 12, fontWeight: '700', color: foodColors.badgeBlue },
  removeText: { color: '#FF3B30' },
  emptyText: { fontSize: 13, color: foodColors.textSecondary, textAlign: 'center', marginTop: 40 },

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
  addButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
EOF_MARKER

echo "Writing app/payment-methods.tsx"
cat > "app/payment-methods.tsx" << 'EOF_MARKER'
// app/payment-methods.tsx
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Card = {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Verve';
  last4: string;
  expiry: string;
  isDefault: boolean;
};

const brandColors: Record<Card['brand'], string> = {
  Visa: '#1A1F71',
  Mastercard: '#EB001B',
  Verve: '#1B4332',
};

const initialCards: Card[] = [
  { id: 'card-1', brand: 'Verve', last4: '4821', expiry: '09/28', isDefault: true },
  { id: 'card-2', brand: 'Mastercard', last4: '7734', expiry: '02/27', isDefault: false },
];

export default function PaymentMethodsScreen() {
  const [cards, setCards] = useState<Card[]>(initialCards);

  const setDefault = (id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Payment Methods" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {cards.map((card) => (
            <View key={card.id} style={[styles.cardTile, { backgroundColor: brandColors[card.brand] }]}>
              <View style={styles.cardTopRow}>
                <MaterialCommunityIcons name="credit-card-chip-outline" size={26} color="rgba(255,255,255,0.9)" />
                {card.isDefault && (
                  <View style={styles.defaultPill}>
                    <Text style={styles.defaultPillText}>Default</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardMetaLabel}>Expires</Text>
                  <Text style={styles.cardMetaValue}>{card.expiry}</Text>
                </View>
                <Text style={styles.cardBrand}>{card.brand}</Text>
              </View>
            </View>
          ))}

          {cards.length === 0 && (
            <Text style={styles.emptyText}>No payment methods saved yet.</Text>
          )}

          <View style={styles.actionsGroup}>
            {cards.map((card) => (
              <View key={`actions-${card.id}`} style={styles.actionsRow}>
                <Text style={styles.actionsLabel}>
                  {card.brand} •••• {card.last4}
                </Text>
                <View style={styles.actionsButtons}>
                  {!card.isDefault && (
                    <TouchableOpacity onPress={() => setDefault(card.id)}>
                      <Text style={styles.actionText}>Set default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => removeCard(card.id)}>
                    <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
          <Feather name="plus" size={17} color="#fff" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  list: { gap: 14 },
  cardTile: {
    borderRadius: 18,
    padding: 18,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  defaultPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  defaultPillText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  cardNumber: { fontSize: 17, fontWeight: '700', letterSpacing: 1.5, color: '#fff', marginTop: 18 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  cardMetaLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  cardMetaValue: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cardBrand: { fontSize: 13, fontWeight: '700', color: '#fff' },

  emptyText: { fontSize: 13, color: foodColors.textSecondary, textAlign: 'center', marginTop: 20 },

  actionsGroup: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  actionsLabel: { fontSize: 12, fontWeight: '600', color: foodColors.textPrimary, flexShrink: 1 },
  actionsButtons: { flexDirection: 'row', gap: 16 },
  actionText: { fontSize: 12, fontWeight: '700', color: foodColors.badgeBlue },
  removeText: { color: '#FF3B30' },

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
  addButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
EOF_MARKER

echo "Writing app/security.tsx"
cat > "app/security.tsx" << 'EOF_MARKER'
// app/security.tsx
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Session = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
};

const sessions: Session[] = [
  { id: 's1', device: 'iPhone 14 — Lokoja App', location: 'Lokoja, Nigeria', lastActive: 'Active now', current: true },
  { id: 's2', device: 'Chrome — Windows PC', location: 'Abuja, Nigeria', lastActive: '2 days ago', current: false },
];

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIconWrap}>
        <Feather name={icon} size={16} color={foodColors.textPrimary} />
      </View>
      <View style={styles.actionTextBlock}>
        <Text style={styles.actionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionIconWrap}>
        <Feather name={icon} size={16} color={foodColors.textPrimary} />
      </View>
      <View style={styles.actionTextBlock}>
        <Text style={styles.actionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: foodColors.border, true: foodColors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function SecurityScreen() {
  const [biometric, setBiometric] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Security" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Login & Access</Text>
        <View style={styles.group}>
          <ActionRow icon="lock" title="Change Password" subtitle="Last changed 3 months ago" />
          <ActionRow icon="hash" title="Change Transaction PIN" subtitle="Used for payments" />
          <ToggleRow
            icon="smartphone"
            title="Biometric Login"
            subtitle="Use Face ID or fingerprint"
            value={biometric}
            onValueChange={setBiometric}
          />
          <ToggleRow
            icon="shield"
            title="Two-Factor Authentication"
            subtitle="Extra layer of protection"
            value={twoFactor}
            onValueChange={setTwoFactor}
          />
        </View>

        <Text style={styles.sectionLabel}>Active Sessions</Text>
        <View style={styles.group}>
          {sessions.map((session) => (
            <View key={session.id} style={styles.sessionRow}>
              <View style={styles.actionIconWrap}>
                <Feather name="monitor" size={16} color={foodColors.textPrimary} />
              </View>
              <View style={styles.actionTextBlock}>
                <View style={styles.sessionTitleRow}>
                  <Text style={styles.actionTitle} numberOfLines={1}>
                    {session.device}
                  </Text>
                  {session.current && (
                    <View style={styles.currentPill}>
                      <Text style={styles.currentPillText}>This device</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionSubtitle}>
                  {session.location} · {session.lastActive}
                </Text>
              </View>
              {!session.current && (
                <TouchableOpacity>
                  <Text style={styles.logOutText}>Log out</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 30 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: 8,
    marginTop: 18,
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextBlock: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 13.5, fontWeight: '600', color: foodColors.textPrimary },
  actionSubtitle: { fontSize: 11.5, color: foodColors.textSecondary, marginTop: 2 },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentPill: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentPillText: { fontSize: 9, fontWeight: '700', color: foodColors.success },
  logOutText: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },

  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/my-orders.tsx"
cat > "app/my-orders.tsx" << 'EOF_MARKER'
// app/my-orders.tsx
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';
import { FilterTabs } from '../src/components/profile/FilterTabs';

const allOrders: Order[] = [
  { id: 'o1', type: 'echop', title: 'Party Jollof Rice', meta: "Mama Titi's · 2 items", date: 'Today, 1:20 PM', amount: 7700, status: 'In Progress' },
  { id: 'o2', type: 'ewash', title: 'Laundry Pickup #239604', meta: '10 items · Standard wash', date: 'July 05, 2026', amount: 3500, status: 'Scheduled' },
  { id: 'o3', type: 'echop', title: 'Beef Suya Platter', meta: 'Suya Spot · 1 item', date: 'June 28, 2026', amount: 3200, status: 'Delivered' },
  { id: 'o4', type: 'ewash', title: 'Dry Cleaning #239580', meta: '4 items · Express', date: 'June 20, 2026', amount: 5200, status: 'Delivered' },
  { id: 'o5', type: 'echop', title: 'Amala & Ewedu Combo', meta: "Mama Titi's · 3 items", date: 'June 10, 2026', amount: 4600, status: 'Cancelled' },
];

const tabs = ['All', 'E-Chop', 'E-Wash'] as const;

export default function MyOrdersScreen() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');

  const filtered = useMemo(() => {
    if (activeTab === 'All') return allOrders;
    const type = activeTab === 'E-Chop' ? 'echop' : 'ewash';
    return allOrders.filter((o) => o.type === type);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="My Orders" />

      <View style={styles.tabsWrap}>
        <FilterTabs tabs={tabs as unknown as string[]} active={activeTab} onSelect={(t) => setActiveTab(t as any)} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>No orders in this category yet.</Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  tabsWrap: { paddingHorizontal: '5.5%', marginBottom: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },
  list: { gap: 12 },
  emptyText: { fontSize: 13, color: foodColors.textSecondary, textAlign: 'center', marginTop: 40 },
  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/echop-orders.tsx"
cat > "app/echop-orders.tsx" << 'EOF_MARKER'
// app/echop-orders.tsx
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';

const echopOrders: Order[] = [
  { id: 'e1', type: 'echop', title: 'Party Jollof Rice', meta: "Mama Titi's · 2 items", date: 'Today, 1:20 PM', amount: 7700, status: 'In Progress' },
  { id: 'e2', type: 'echop', title: 'Beef Suya Platter', meta: 'Suya Spot · 1 item', date: 'June 28, 2026', amount: 3200, status: 'Delivered' },
  { id: 'e3', type: 'echop', title: 'Amala & Ewedu Combo', meta: "Mama Titi's · 3 items", date: 'June 10, 2026', amount: 4600, status: 'Cancelled' },
  { id: 'e4', type: 'echop', title: 'Pepper Soup Special', meta: 'Suya Spot · 1 item', date: 'May 30, 2026', amount: 2800, status: 'Delivered' },
];

export default function EchopOrdersScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="E-Chop Orders" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {echopOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingTop: 4, paddingBottom: 16 },
  list: { gap: 12 },
  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/ewash-orders.tsx"
cat > "app/ewash-orders.tsx" << 'EOF_MARKER'
// app/ewash-orders.tsx
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';

const ewashOrders: Order[] = [
  { id: 'w1', type: 'ewash', title: 'Laundry Pickup #239604', meta: '10 items · Standard wash', date: 'July 05, 2026', amount: 3500, status: 'Scheduled' },
  { id: 'w2', type: 'ewash', title: 'Dry Cleaning #239580', meta: '4 items · Express', date: 'June 20, 2026', amount: 5200, status: 'Delivered' },
  { id: 'w3', type: 'ewash', title: 'Laundry Pickup #239471', meta: '7 items · Standard wash', date: 'May 28, 2026', amount: 2900, status: 'Delivered' },
];

export default function EwashOrdersScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="E-Wash Orders" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {ewashOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingTop: 4, paddingBottom: 16 },
  list: { gap: 12 },
  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/order-history.tsx"
cat > "app/order-history.tsx" << 'EOF_MARKER'
// app/order-history.tsx
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { OrderCard, Order } from '../src/components/profile/OrderCard';

const history: Order[] = [
  { id: 'h1', type: 'echop', title: 'Beef Suya Platter', meta: 'Suya Spot · 1 item', date: 'June 28, 2026', amount: 3200, status: 'Delivered' },
  { id: 'h2', type: 'ewash', title: 'Dry Cleaning #239580', meta: '4 items · Express', date: 'June 20, 2026', amount: 5200, status: 'Delivered' },
  { id: 'h3', type: 'echop', title: 'Amala & Ewedu Combo', meta: "Mama Titi's · 3 items", date: 'June 10, 2026', amount: 4600, status: 'Cancelled' },
  { id: 'h4', type: 'echop', title: 'Pepper Soup Special', meta: 'Suya Spot · 1 item', date: 'May 30, 2026', amount: 2800, status: 'Delivered' },
  { id: 'h5', type: 'ewash', title: 'Laundry Pickup #239471', meta: '7 items · Standard wash', date: 'May 28, 2026', amount: 2900, status: 'Delivered' },
];

export default function OrderHistoryScreen() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return history;
    const q = query.toLowerCase();
    return history.filter(
      (o) => o.title.toLowerCase().includes(q) || o.meta.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Order History" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={foodColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search past orders"
            placeholderTextColor={foodColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>No orders match "{query}".</Text>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  searchWrap: { paddingHorizontal: '5.5%', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: foodColors.textPrimary, padding: 0, minWidth: 0 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },
  list: { gap: 12 },
  emptyText: { fontSize: 13, color: foodColors.textSecondary, textAlign: 'center', marginTop: 40 },
  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/refer-earn.tsx"
cat > "app/refer-earn.tsx" << 'EOF_MARKER'
// app/refer-earn.tsx
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const REFERRAL_CODE = 'SULE-4K92';

const steps = [
  { id: '1', icon: 'share-2', title: 'Share your code', subtitle: 'Send your referral code to friends and family' },
  { id: '2', icon: 'user-plus', title: 'They sign up', subtitle: 'Your friend creates an account using your code' },
  { id: '3', icon: 'gift', title: 'You both earn', subtitle: 'Get ₦1,000 credit once they complete their first order' },
] as const;

const invites = [
  { id: 'i1', name: 'Chidinma O.', status: 'Joined', reward: 1000 },
  { id: 'i2', name: 'Yusuf B.', status: 'Pending first order', reward: 0 },
];

export default function ReferEarnScreen() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Share.share({
      message: `Use my code ${REFERRAL_CODE} to sign up and we both earn ₦1,000 credit!`,
    }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Refer & Earn" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[foodColors.primary, foodColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroTitle}>Give ₦1,000, Get ₦1,000</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends to BusandCode and earn credit for every successful referral.
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Feather name={copied ? 'check' : 'copy'} size={14} color={foodColors.primaryDark} />
              <Text style={styles.copyButtonText}>{copied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
            <Feather name="share-2" size={15} color="#fff" />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.earningsRow}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>₦1,000</Text>
            <Text style={styles.earningsLabel}>Total Earned</Text>
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsValue}>2</Text>
            <Text style={styles.earningsLabel}>Friends Invited</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>How it works</Text>
        <View style={styles.stepsGroup}>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <Feather name={step.icon as keyof typeof Feather.glyphMap} size={16} color={foodColors.primary} />
              </View>
              <View style={styles.stepTextBlock}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Your Invites</Text>
        <View style={styles.stepsGroup}>
          {invites.map((invite) => (
            <View key={invite.id} style={styles.inviteRow}>
              <View style={styles.inviteAvatar}>
                <Text style={styles.inviteAvatarText}>{invite.name.charAt(0)}</Text>
              </View>
              <View style={styles.stepTextBlock}>
                <Text style={styles.stepTitle}>{invite.name}</Text>
                <Text style={styles.stepSubtitle}>{invite.status}</Text>
              </View>
              {invite.reward > 0 && (
                <Text style={styles.inviteReward}>+₦{invite.reward.toLocaleString()}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  heroCard: { borderRadius: 22, padding: 20, marginBottom: 14 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  heroSubtitle: { fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 18 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  codeText: { fontSize: 16, fontWeight: '700', letterSpacing: 1, color: '#fff' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  copyButtonText: { fontSize: 11, fontWeight: '700', color: foodColors.primaryDark },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 13,
    borderRadius: 24,
  },
  shareButtonText: { fontSize: 13.5, fontWeight: '700', color: '#fff' },

  earningsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  earningsCard: {
    flex: 1,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  earningsValue: { fontSize: 18, fontWeight: '700', color: foodColors.textPrimary },
  earningsLabel: { fontSize: 11, color: foodColors.textSecondary, marginTop: 2 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: foodColors.textPrimary, marginBottom: 10 },
  stepsGroup: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextBlock: { flex: 1, minWidth: 0 },
  stepTitle: { fontSize: 13.5, fontWeight: '600', color: foodColors.textPrimary },
  stepSubtitle: { fontSize: 11.5, color: foodColors.textSecondary, marginTop: 2 },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  inviteAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: foodColors.badgeBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  inviteReward: { fontSize: 12.5, fontWeight: '700', color: foodColors.success },

  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/notification-settings.tsx"
cat > "app/notification-settings.tsx" << 'EOF_MARKER'
// app/notification-settings.tsx
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type ToggleKey =
  | 'orderUpdates'
  | 'promotions'
  | 'chatMessages'
  | 'pushEnabled'
  | 'emailEnabled'
  | 'smsEnabled';

type ToggleDef = {
  key: ToggleKey;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
};

const activityToggles: ToggleDef[] = [
  { key: 'orderUpdates', icon: 'package', title: 'Order Updates', subtitle: 'Status changes for E-Chop & E-Wash orders' },
  { key: 'promotions', icon: 'tag', title: 'Promotions & Offers', subtitle: 'Discounts, deals, and new features' },
  { key: 'chatMessages', icon: 'message-circle', title: 'Chat Messages', subtitle: 'Replies from support and riders' },
];

const channelToggles: ToggleDef[] = [
  { key: 'pushEnabled', icon: 'bell', title: 'Push Notifications', subtitle: 'Alerts on this device' },
  { key: 'emailEnabled', icon: 'mail', title: 'Email', subtitle: 'Sent to suleiman@example.com' },
  { key: 'smsEnabled', icon: 'message-square', title: 'SMS', subtitle: 'Sent to +234 803 123 4567' },
];

export default function NotificationSettingsScreen() {
  const [values, setValues] = useState<Record<ToggleKey, boolean>>({
    orderUpdates: true,
    promotions: true,
    chatMessages: true,
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: true,
  });

  const toggle = (key: ToggleKey) => {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderGroup = (items: ToggleDef[]) => (
    <View style={styles.group}>
      {items.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={styles.iconWrap}>
            <Feather name={item.icon} size={16} color={foodColors.textPrimary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Switch
            value={values[item.key]}
            onValueChange={() => toggle(item.key)}
            trackColor={{ false: foodColors.border, true: foodColors.primary }}
            thumbColor="#fff"
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Notifications" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>What you're notified about</Text>
        {renderGroup(activityToggles)}

        <Text style={styles.sectionLabel}>How you're notified</Text>
        {renderGroup(channelToggles)}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 30 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: 8,
    marginTop: 16,
  },
  group: {
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
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, fontWeight: '600', color: foodColors.textPrimary },
  subtitle: { fontSize: 11.5, color: foodColors.textSecondary, marginTop: 2 },

  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/language-location.tsx"
cat > "app/language-location.tsx" << 'EOF_MARKER'
// app/language-location.tsx
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const languages = ['English', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin'];

export default function LanguageLocationScreen() {
  const [language, setLanguage] = useState('English');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Language & Location" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Current Location</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationIconWrap}>
            <Feather name="map-pin" size={18} color={foodColors.primary} />
          </View>
          <View style={styles.locationTextBlock}>
            <Text style={styles.locationTitle}>Lokoja, Kogi State</Text>
            <Text style={styles.locationSubtitle}>Used for delivery estimates and nearby partners</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.changeLocationButton} activeOpacity={0.8}>
          <Feather name="navigation" size={14} color={foodColors.badgeBlue} />
          <Text style={styles.changeLocationText}>Change Location</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>App Language</Text>
        <View style={styles.group}>
          {languages.map((lang, index) => {
            const isActive = lang === language;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.langRow, index === languages.length - 1 && styles.langRowLast]}
                onPress={() => setLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text style={styles.langText}>{lang}</Text>
                {isActive && <Feather name="check" size={16} color={foodColors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 30 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: 8,
    marginTop: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextBlock: { flex: 1, minWidth: 0 },
  locationTitle: { fontSize: 14, fontWeight: '700', color: foodColors.textPrimary },
  locationSubtitle: { fontSize: 11.5, color: foodColors.textSecondary, marginTop: 2, lineHeight: 16 },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(46,90,172,0.08)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  changeLocationText: { fontSize: 13, fontWeight: '700', color: foodColors.badgeBlue },

  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  langRowLast: { borderBottomWidth: 0 },
  langText: { fontSize: 14, fontWeight: '600', color: foodColors.textPrimary },

  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/delivery-preferences.tsx"
cat > "app/delivery-preferences.tsx" << 'EOF_MARKER'
// app/delivery-preferences.tsx
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const timeSlots = ['As soon as possible', 'Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)'];

export default function DeliveryPreferencesScreen() {
  const [defaultAddress, setDefaultAddress] = useState<'home' | 'work'>('home');
  const [instructions, setInstructions] = useState('Call when you arrive at the gate.');
  const [contactless, setContactless] = useState(true);
  const [slot, setSlot] = useState(timeSlots[0]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Delivery Preferences" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Default Delivery Address</Text>
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.addressRow}
            onPress={() => setDefaultAddress('home')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name="home" size={16} color={foodColors.primary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title}>Home</Text>
              <Text style={styles.subtitle}>14 Adekunle Fajuyi Road, GRA, Lokoja</Text>
            </View>
            {defaultAddress === 'home' && (
              <Feather name="check-circle" size={18} color={foodColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addressRow, styles.rowLast]}
            onPress={() => setDefaultAddress('work')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name="briefcase" size={16} color={foodColors.primary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title}>Work</Text>
              <Text style={styles.subtitle}>Suite 4B, Zenith Plaza, Murtala Way</Text>
            </View>
            {defaultAddress === 'work' && (
              <Feather name="check-circle" size={18} color={foodColors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Preferred Delivery Time</Text>
        <View style={styles.group}>
          {timeSlots.map((item, index) => (
            <TouchableOpacity
              key={item}
              style={[styles.slotRow, index === timeSlots.length - 1 && styles.rowLast]}
              onPress={() => setSlot(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.title}>{item}</Text>
              {slot === item && <Feather name="check" size={16} color={foodColors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Delivery Instructions</Text>
        <TextInput
          style={styles.instructionsInput}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="e.g. Leave with the security guard"
          placeholderTextColor={foodColors.textMuted}
          multiline
        />

        <View style={styles.toggleRow}>
          <View style={styles.iconWrap}>
            <Feather name="shield" size={16} color={foodColors.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Contactless Delivery</Text>
            <Text style={styles.subtitle}>Rider leaves your order at the door</Text>
          </View>
          <Switch
            value={contactless}
            onValueChange={setContactless}
            trackColor={{ false: foodColors.border, true: foodColors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: 8,
    marginTop: 16,
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, fontWeight: '600', color: foodColors.textPrimary },
  subtitle: { fontSize: 11.5, color: foodColors.textSecondary, marginTop: 2 },

  instructionsInput: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: foodColors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
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
  saveButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
EOF_MARKER

echo "Writing app/live-chat.tsx"
cat > "app/live-chat.tsx" << 'EOF_MARKER'
// app/live-chat.tsx
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Message = {
  id: string;
  from: 'user' | 'agent';
  text: string;
  time: string;
};

const initialMessages: Message[] = [
  { id: 'm1', from: 'agent', text: "Hi Suleiman 👋 I'm Ada from BusandCode support. How can I help you today?", time: '10:02 AM' },
  { id: 'm2', from: 'user', text: 'Hey, my laundry order #239604 still shows "Scheduled" — is that normal?', time: '10:04 AM' },
  { id: 'm3', from: 'agent', text: "Yes, that's expected until the rider picks it up. Pickup is set for 2:00 PM today.", time: '10:05 AM' },
];

export default function LiveChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: 'user', text: trimmed, time: 'Now' },
    ]);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <StatusBar style="dark" />
      <ScreenHeader title="Live Chat" />

      <View style={styles.agentBar}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>A</Text>
        </View>
        <View>
          <Text style={styles.agentName}>Ada · Support Agent</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubbleRow,
              item.from === 'user' ? styles.bubbleRowUser : styles.bubbleRowAgent,
            ]}
          >
            <View
              style={[
                styles.bubble,
                item.from === 'user' ? styles.bubbleUser : styles.bubbleAgent,
              ]}
            >
              <Text style={[styles.bubbleText, item.from === 'user' && styles.bubbleTextUser]}>
                {item.text}
              </Text>
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={foodColors.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8}>
          <Feather name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  agentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: '5.5%',
    paddingBottom: 14,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: foodColors.badgeBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  agentName: { fontSize: 13, fontWeight: '700', color: foodColors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: foodColors.success },
  onlineText: { fontSize: 11, color: foodColors.textSecondary },

  list: { paddingHorizontal: '5.5%', paddingBottom: 12, gap: 14 },

  bubbleRow: { maxWidth: '82%' },
  bubbleRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowAgent: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAgent: { backgroundColor: foodColors.surface, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: foodColors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 13.5, lineHeight: 19, color: foodColors.textPrimary },
  bubbleTextUser: { color: '#fff' },
  timeText: { fontSize: 10, color: foodColors.textMuted, marginTop: 4 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: '5.5%',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    backgroundColor: foodColors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: foodColors.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: foodColors.textPrimary,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
EOF_MARKER

echo "Writing app/help-center.tsx"
cat > "app/help-center.tsx" << 'EOF_MARKER'
// app/help-center.tsx
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Faq = { id: string; question: string; answer: string };

const faqs: Faq[] = [
  { id: 'f1', question: 'How do I track my E-Chop order?', answer: 'Open My Orders from your profile, select the order, and you\'ll see live status updates from preparation to delivery.' },
  { id: 'f2', question: 'How long does E-Wash pickup take?', answer: 'Pickups are usually scheduled within 2–4 hours of booking, depending on your location and rider availability.' },
  { id: 'f3', question: 'Can I change my delivery address after ordering?', answer: 'Yes, as long as the order hasn\'t been picked up yet. Contact support or use Live Chat to update it quickly.' },
  { id: 'f4', question: 'How do referral rewards work?', answer: 'Share your code from Refer & Earn. Once your friend completes their first order, you both get ₦1,000 credit.' },
  { id: 'f5', question: 'What payment methods are supported?', answer: 'We support debit cards (Visa, Mastercard, Verve) and bank transfer. Add or manage cards under Payment Methods.' },
  { id: 'f6', question: 'How do I cancel an order?', answer: 'Go to My Orders, open the order, and tap Cancel Order. This is only available before the order is picked up.' },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return faqs;
    const q = query.toLowerCase();
    return faqs.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Help Center" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={foodColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={foodColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.group}>
          {filtered.map((faq, index) => {
            const isOpen = expandedId === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqRow, index === filtered.length - 1 && styles.faqRowLast]}
                onPress={() => setExpandedId(isOpen ? null : faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Feather
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={foodColors.textMuted}
                  />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>No results for "{query}".</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => router.push('/contact-support')}
          activeOpacity={0.8}
        >
          <View style={styles.contactIconWrap}>
            <Feather name="headphones" size={18} color={foodColors.primary} />
          </View>
          <View style={styles.contactTextBlock}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSubtitle}>Reach out to our support team directly</Text>
          </View>
          <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: foodColors.textPrimary, padding: 0, minWidth: 0 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: foodColors.textPrimary, marginBottom: 10 },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  faqRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  faqRowLast: { borderBottomWidth: 0 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  faqQuestion: { flex: 1, fontSize: 13.5, fontWeight: '600', color: foodColors.textPrimary },
  faqAnswer: { fontSize: 12.5, lineHeight: 18, color: foodColors.textSecondary, marginTop: 10 },
  emptyText: { fontSize: 13, color: foodColors.textSecondary, textAlign: 'center', paddingVertical: 20 },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTextBlock: { flex: 1, minWidth: 0 },
  contactTitle: { fontSize: 13.5, fontWeight: '700', color: foodColors.textPrimary },
  contactSubtitle: { fontSize: 11.5, color: foodColors.textSecondary, marginTop: 2 },

  bottomSpacer: { height: 20 },
});
EOF_MARKER

echo "Writing app/contact-support.tsx"
cat > "app/contact-support.tsx" << 'EOF_MARKER'
// app/contact-support.tsx
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const channels = [
  { id: 'call', icon: 'phone', label: 'Call Us', value: '+234 700 123 4567', action: () => Linking.openURL('tel:+2347001234567') },
  { id: 'whatsapp', icon: 'message-circle', label: 'WhatsApp', value: 'Chat with us', action: () => Linking.openURL('https://wa.me/2347001234567') },
  { id: 'email', icon: 'mail', label: 'Email', value: 'support@busandcode.com', action: () => Linking.openURL('mailto:support@busandcode.com') },
] as const;

export default function ContactSupportScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    setSent(true);
    setSubject('');
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Contact Support" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.liveChatCard}
          onPress={() => router.push('/live-chat')}
          activeOpacity={0.85}
        >
          <View style={styles.liveChatIconWrap}>
            <Feather name="message-square" size={18} color="#fff" />
          </View>
          <View style={styles.liveChatTextBlock}>
            <Text style={styles.liveChatTitle}>Chat with us live</Text>
            <Text style={styles.liveChatSubtitle}>Typical reply time: under 2 minutes</Text>
          </View>
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Other Ways to Reach Us</Text>
        <View style={styles.group}>
          {channels.map((channel, index) => (
            <TouchableOpacity
              key={channel.id}
              style={[styles.channelRow, index === channels.length - 1 && styles.rowLast]}
              onPress={channel.action}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Feather name={channel.icon as keyof typeof Feather.glyphMap} size={16} color={foodColors.primary} />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.title}>{channel.label}</Text>
                <Text style={styles.subtitle}>{channel.value}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={foodColors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Send a Message</Text>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            placeholder="Subject"
            placeholderTextColor={foodColors.textMuted}
            value={subject}
            onChangeText={(text) => {
              setSubject(text);
              setSent(false);
            }}
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Describe your issue..."
            placeholderTextColor={foodColors.textMuted}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              setSent(false);
            }}
            multiline
          />
        </View>

        {sent && (
          <View style={styles.sentBanner}>
            <Feather name="check-circle" size={14} color={foodColors.success} />
            <Text style={styles.sentBannerText}>Message sent — we'll get back to you shortly</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.85}>
          <Text style={styles.sendButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  liveChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.primary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  liveChatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveChatTextBlock: { flex: 1, minWidth: 0 },
  liveChatTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  liveChatSubtitle: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: foodColors.textPrimary, marginBottom: 10 },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, fontWeight: '600', color: foodColors.textPrimary },
  subtitle: { fontSize: 11.5, color: foodColors.textSecondary, marginTop: 2 },

  formGroup: { gap: 12, marginBottom: 4 },
  input: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13.5,
    color: foodColors.textPrimary,
  },
  messageInput: { minHeight: 100, textAlignVertical: 'top' },

  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sentBannerText: { fontSize: 12, fontWeight: '600', color: foodColors.success, flexShrink: 1 },

  bottomSpacer: { height: 90 },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  sendButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  sendButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
EOF_MARKER

echo "Writing app/cart.tsx"
cat > "app/cart.tsx" << 'EOF_MARKER'
// app/cart.tsx
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = SCREEN_WIDTH * 0.055; // ~22px on a 400px-wide screen, scales with device
const ITEM_IMAGE_SIZE = SCREEN_WIDTH * 0.18;
const DELIVERY_FEE = 500;
const SERVICE_FEE = 200;

type CartItem = {
  id: string;
  partnerName: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
};

const initialCart: CartItem[] = [
  {
    id: 'party-jollof',
    partnerName: "MAMA TITI'S",
    name: 'Party Jollof Rice',
    description: 'Smoky firewood jollof with fried plantain and coleslaw',
    price: 4000,
    quantity: 1,
    image:
      'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
  },
  {
    id: 'suya-platter',
    partnerName: 'SUYA SPOT',
    name: 'Beef Suya Platter',
    description: 'Spicy grilled beef skewers with onions and pepper mix',
    price: 3200,
    quantity: 1,
    image:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80',
  },
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export default function CartScreen() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const increment = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrement = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const applyPromo = () => {
    if (promoCode.trim().length > 0) {
      setPromoApplied(true);
    }
  };

  const { subtotal, discount, total, itemCount } = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
    const total =
      subtotal - discount + (cart.length > 0 ? DELIVERY_FEE + SERVICE_FEE : 0);
    return { subtotal, discount, total, itemCount };
  }, [cart, promoApplied]);

  const isEmpty = cart.length === 0;

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>My Cart</Text>
        {!isEmpty ? (
          <Text style={styles.headerCount}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="shopping-cart" size={34} color={foodColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything yet. Explore today's menu to
            get started.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/echop')}
          >
            <Text style={styles.browseButtonText}>Browse Menu</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Cart items */}
            <View style={styles.itemsSection}>
              {cart.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemPartner} numberOfLines={1}>
                      {item.partnerName}
                    </Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View style={styles.itemBottomRow}>
                      <Text style={styles.itemPrice}>
                        {formatNaira(item.price * item.quantity)}
                      </Text>

                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => decrement(item.id)}
                        >
                          <Feather
                            name={item.quantity === 1 ? 'trash-2' : 'minus'}
                            size={13}
                            color={foodColors.textPrimary}
                          />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={[styles.stepperButton, styles.stepperButtonPrimary]}
                          onPress={() => increment(item.id)}
                        >
                          <Feather name="plus" size={13} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={14} color={foodColors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Promo code */}
            <View style={styles.promoSection}>
              <Text style={styles.sectionLabel}>Promo Code</Text>
              <View style={styles.promoRow}>
                <View style={styles.promoInputWrap}>
                  <Feather name="tag" size={15} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={foodColors.textMuted}
                    value={promoCode}
                    onChangeText={(text) => {
                      setPromoCode(text);
                      if (promoApplied) setPromoApplied(false);
                    }}
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity style={styles.promoApplyButton} onPress={applyPromo}>
                  <Text style={styles.promoApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {promoApplied && (
                <View style={styles.promoAppliedRow}>
                  <Feather name="check-circle" size={13} color={foodColors.success} />
                  <Text style={styles.promoAppliedText}>
                    Promo applied — 10% off your subtotal
                  </Text>
                </View>
              )}
            </View>

            {/* Order summary */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionLabel}>Order Summary</Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatNaira(subtotal)}</Text>
                </View>

                {promoApplied && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.discountLabel]}>
                      Discount
                    </Text>
                    <Text style={[styles.summaryValue, styles.discountLabel]}>
                      -{formatNaira(discount)}
                    </Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>{formatNaira(DELIVERY_FEE)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service Fee</Text>
                  <Text style={styles.summaryValue}>{formatNaira(SERVICE_FEE)}</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatNaira(total)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Fixed checkout bar */}
          <View style={styles.checkoutBar}>
            <View style={styles.checkoutTotalBlock}>
              <Text style={styles.checkoutTotalLabel}>Total</Text>
              <Text style={styles.checkoutTotalValue}>{formatNaira(total)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} activeOpacity={0.85}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: foodColors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 16,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
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
    fontSize: 18,
    fontWeight: '700',
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  headerCount: {
    minWidth: 40,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: foodColors.textSecondary,
  },
  headerSpacer: {
    minWidth: 40,
  },

  /* Empty state */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING * 1.5,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: foodColors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  /* Items */
  itemsSection: {
    gap: 12,
    marginBottom: 22,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemImage: {
    width: ITEM_IMAGE_SIZE,
    height: ITEM_IMAGE_SIZE,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemPartner: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: foodColors.badgeBlue,
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: foodColors.textPrimary,
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 11,
    lineHeight: 15,
    color: foodColors.textSecondary,
    marginBottom: 10,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: foodColors.textPrimary,
    flexShrink: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonPrimary: {
    backgroundColor: foodColors.primary,
  },
  stepperValue: {
    minWidth: 16,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: foodColors.textPrimary,
  },
  removeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: foodColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Shared section label */
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: foodColors.textPrimary,
    marginBottom: 10,
  },

  /* Promo */
  promoSection: {
    marginBottom: 22,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  promoInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: foodColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    minWidth: 0,
  },
  promoInput: {
    flex: 1,
    fontSize: 13,
    color: foodColors.textPrimary,
    padding: 0,
  },
  promoApplyButton: {
    backgroundColor: foodColors.primaryDark,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  promoAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  promoAppliedText: {
    fontSize: 12,
    fontWeight: '600',
    color: foodColors.success,
    flexShrink: 1,
  },

  /* Summary */
  summarySection: {
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: foodColors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: foodColors.textPrimary,
  },
  discountLabel: {
    color: foodColors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: foodColors.border,
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: foodColors.textPrimary,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: foodColors.primary,
  },

  bottomSpacer: {
    height: 100,
  },

  /* Fixed checkout bar */
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    backgroundColor: foodColors.surface,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  checkoutTotalBlock: {
    flexShrink: 0,
  },
  checkoutTotalLabel: {
    fontSize: 11,
    color: foodColors.textSecondary,
    marginBottom: 2,
  },
  checkoutTotalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: foodColors.textPrimary,
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    maxWidth: '68%',
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
EOF_MARKER

echo "Writing app/(tabs)/echop.tsx"
cat > "app/(tabs)/echop.tsx" << 'EOF_MARKER'
// app/(tabs)/echop.tsx

import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { FoodHeader } from '../../src/components/food/FoodHeader';
import { SearchBar } from '../../src/components/food/SearchBar';
import { PromoBanner } from '../../src/components/food/PromoBanner';
import { CategoryTabs } from '../../src/components/food/CategoryTabs';
import { NearbyPartners } from '../../src/components/food/NearbyPartners';
import { TodaysMenu } from '../../src/components/food/TodaysMenu';
import { ViewOrderBar } from '../../src/components/food/ViewOrderBar';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';

import { foodColors } from '../../src/constants/foodColors';
import { FoodCategory } from '../../src/constants/foodData';

export default function FoodScreen() {
  const router = useRouter();

  const [category, setCategory] =
    useState<FoodCategory>('All');

  const [order] = useState<{
    count: number;
    total: number;
  }>({
    count: 2,
    total: 7700,
  });

  return (
    <View style={styles.container}>
      {/* ───────────────── HEADER ───────────────── */}
      <View style={styles.header}>
        <FoodHeader
          location="Lokoja, Kogi"
          notificationCount={1}
          cartCount={2}
          onPressProfile={() => router.push('/profile')}
          onPressNotifications={() =>
            router.push('/notification')
          }
        />
      </View>

      {/* ───────────────── MAIN CONTENT ───────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Search */}
        <View style={styles.searchSection}>
          <SearchBar />
        </View>

        {/* Promotional banner */}
        <View style={styles.bannerSection}>
          <PromoBanner />
        </View>

        {/* Categories */}
        <View style={styles.categorySection}>
          <CategoryTabs
            active={category}
            onSelect={setCategory}
          />
        </View>

        {/* Nearby restaurants */}
        <View style={styles.partnersSection}>
          <NearbyPartners />
        </View>

        {/* Today's menu */}
        <View style={styles.menuSection}>
          <TodaysMenu />
        </View>
      </ScrollView>

      {/* ───────────────── FIXED FOOTER ───────────────── */}
      <View style={styles.footer}>
        <View style={styles.orderBarContainer}>
          <ViewOrderBar
            itemCount={order.count}
            total={order.total}
            onPress={() => router.push('/cart')}
          />
        </View>

        <FoodTabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: foodColors.background,
  },

  /*
   * Header
   *
   * The reference has a relatively compact header.
   * We don't want the header taking too much vertical space.
   */
  header: {
    paddingHorizontal: 26,
    paddingTop: 42,
    paddingBottom: 8,
  },

  scroll: {
    flex: 1,
  },

  /*
   * No global gap here.
   *
   * Each section controls its own spacing so the
   * layout follows the reference more naturally.
   */
  content: {
    paddingHorizontal: 26,
    paddingBottom: 18,
  },

  /*
   * Search
   */
  searchSection: {
    marginBottom: 14,
  },

  /*
   * Promo banner
   */
  bannerSection: {
    marginBottom: 22,
  },

  /*
   * Category chips
   */
  categorySection: {
    marginBottom: 23,
  },

  /*
   * Nearby partners
   */
  partnersSection: {
    marginBottom: 24,
  },

  /*
   * Today's menu
   */
  menuSection: {
    marginBottom: 10,
  },

  /*
   * Bottom fixed area
   */
  footer: {
    backgroundColor: foodColors.background,

    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.025)',

    paddingTop: 4,
  },

  orderBarContainer: {
    paddingHorizontal: 0,
    paddingBottom: 4,
  },
});
EOF_MARKER

echo "Writing app/(tabs)/profile.tsx"
cat > "app/(tabs)/profile.tsx" << 'EOF_MARKER'
// app/(tabs)/profile.tsx
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { foodColors } from '../../src/constants/foodColors';
import { FoodTabBar } from '../../src/components/food/FoodTabBar';

type MenuItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  route: string;
};

const accountItems: MenuItem[] = [
  { id: 'personal', icon: 'user', title: 'Personal Information', route: '/personal-information' },
  { id: 'addresses', icon: 'map-pin', title: 'Saved Addresses', route: '/saved-addresses' },
  { id: 'payment', icon: 'credit-card', title: 'Payment Methods', route: '/payment-methods' },
  { id: 'security', icon: 'shield', title: 'Security', route: '/security' },
];

const orderItems: MenuItem[] = [
  { id: 'my-orders', icon: 'package', title: 'My Orders', route: '/my-orders' },
  { id: 'echop-orders', icon: 'coffee', title: 'E-Chop Orders', route: '/echop-orders' },
  { id: 'ewash-orders', icon: 'droplet', title: 'E-Wash Orders', route: '/ewash-orders' },
  { id: 'order-history', icon: 'clock', title: 'Order History', route: '/order-history' },
];

const referralItems: MenuItem[] = [
  { id: 'refer-earn', icon: 'gift', title: 'Refer & Earn', route: '/refer-earn' },
];

const preferenceItems: MenuItem[] = [
  { id: 'notifications', icon: 'bell', title: 'Notifications', route: '/notification-settings' },
  { id: 'language', icon: 'globe', title: 'Language & Location', route: '/language-location' },
  { id: 'delivery', icon: 'truck', title: 'Delivery Preferences', route: '/delivery-preferences' },
];

const supportItems: MenuItem[] = [
  { id: 'live-chat', icon: 'message-circle', title: 'Live Chat', route: '/live-chat' },
  { id: 'help', icon: 'help-circle', title: 'Help Center', route: '/help-center' },
  { id: 'contact', icon: 'phone', title: 'Contact Support', route: '/contact-support' },
];

function MenuSection({
  title,
  items,
  onPressItem,
}: {
  title: string;
  items: MenuItem[];
  onPressItem: (route: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.menuItemLast
            ]}
            onPress={() => onPressItem(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Feather name={item.icon} size={18} color={foodColors.textPrimary} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function FoodProfileScreen() {
  const router = useRouter();

  const goTo = (route: string) => router.push(route as any);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/personal-information' as any)}
          >
            <Feather name="edit-2" size={15} color={foodColors.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push('/personal-information' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: 'https://ui-avatars.com/api/?name=Suleiman&background=FF6B35&color=fff&size=80' }}
                style={styles.avatar}
              />
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Suleiman</Text>
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={13} color={foodColors.primary} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Sections */}
        <MenuSection title="ACCOUNT" items={accountItems} onPressItem={goTo} />
        <MenuSection title="ORDERS" items={orderItems} onPressItem={goTo} />
        <MenuSection title="REFERRAL" items={referralItems} onPressItem={goTo} />
        <MenuSection title="PREFERENCES" items={preferenceItems} onPressItem={goTo} />
        <MenuSection title="HELP & SUPPORT" items={supportItems} onPressItem={goTo} />

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutButton}>
          <Feather name="log-out" size={18} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FoodTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: foodColors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: foodColors.textPrimary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: foodColors.primary,
  },
  profileCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: foodColors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: foodColors.surface,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: foodColors.textPrimary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: foodColors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: foodColors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  bottomSpacer: {
    height: 20,
  },
});
EOF_MARKER

echo ""
echo "Done. 22 files written (3 shared components + 17 profile-flow screens + updated echop.tsx and profile.tsx)."
echo "Note: app/(tabs)/profile.tsx and app/(tabs)/echop.tsx were OVERWRITTEN with the wired-up versions."