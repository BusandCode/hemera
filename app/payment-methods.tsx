import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
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
            <View
              key={card.id}
              style={[styles.cardTile, { backgroundColor: brandColors[card.brand] }]}
            >
              <View style={styles.cardTopRow}>
                <MaterialCommunityIcons
                  name="credit-card-chip-outline"
                  size={26}
                  color="rgba(255,255,255,0.9)"
                />
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
  defaultPillText: {
    fontSize: 10,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  cardNumber: {
    fontSize: 17,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 1.5,
    color: '#fff',
    marginTop: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  cardMetaLabel: {
    fontSize: 9,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  cardMetaValue: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  cardBrand: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  emptyText: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },

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
  actionsLabel: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    flexShrink: 1,
  },
  actionsButtons: { flexDirection: 'row', gap: 16 },
  actionText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },
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
  addButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});