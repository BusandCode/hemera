import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

const CARD_RED = '#E4342D';

type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (!userId) {
          setAccount(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setLoadError(false);

        try {
          const { data, error } = await supabase
            .from('bank_accounts')
            .select('id, bank_name, account_name, account_number')
            .eq('user_id', userId)
            .eq('is_default', true)
            .limit(1)
            .maybeSingle();

          if (cancelled) return;

          if (error) {
            console.warn('Failed to load bank account:', error.message);
            setAccount(null);
            setLoadError(true);
          } else {
            setAccount(data);
          }
        } catch (e) {
          if (cancelled) return;
          console.warn('Failed to load bank account:', e);
          setAccount(null);
          setLoadError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [userId, reloadKey])
  );

  const confirmRemove = () => {
    if (!account) return;
    Alert.alert(
      'Remove bank account',
      'You will need to add a bank account again before you can withdraw.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: handleRemove },
      ]
    );
  };

  const handleRemove = async () => {
    if (!account || removing) return;
    setRemoving(true);
    try {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', account.id);
      if (error) throw error;
      setAccount(null);
    } catch (e: any) {
      console.warn('Failed to remove bank account:', e?.message ?? e);
      Alert.alert('Could not remove account', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setRemoving(false);
    }
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
        {loading ? (
          <ActivityIndicator color={CARD_RED} style={styles.loader} />
        ) : loadError ? (
          <TouchableOpacity style={styles.retryCard} activeOpacity={0.85} onPress={() => setReloadKey((k) => k + 1)}>
            <Feather name="refresh-cw" size={16} color={foodColors.badgeBlue} />
            <Text style={styles.retryText}>Couldn't load your bank account. Tap to retry</Text>
          </TouchableOpacity>
        ) : account ? (
          <View style={styles.list}>
            <View style={[styles.cardTile, { backgroundColor: CARD_RED }]}>
              <View style={styles.cardTopRow}>
                <MaterialCommunityIcons name="bank-outline" size={26} color="rgba(255,255,255,0.9)" />
                <View style={styles.defaultPill}>
                  <Text style={styles.defaultPillText}>Default</Text>
                </View>
              </View>

              <Text style={styles.bankName}>{account.bank_name}</Text>

              <View style={styles.cardBottomRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.cardMetaLabel}>Account name</Text>
                  <Text style={styles.cardMetaValue} numberOfLines={1}>{account.account_name}</Text>
                </View>
                <View style={styles.metaBlockRight}>
                  <Text style={styles.cardMetaLabel}>Account number</Text>
                  <Text style={styles.cardMetaValue}>{account.account_number}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsGroup}>
              <View style={styles.actionsRow}>
                <Text style={styles.actionsLabel} numberOfLines={1}>
                  {account.bank_name} • {account.account_number}
                </Text>
                <TouchableOpacity onPress={confirmRemove} disabled={removing}>
                  {removing ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No bank account linked yet.</Text>
        )}
      </ScrollView>

      {!loading && !loadError && !account && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => router.push('/add-bank-account' as any)}
          >
            <Feather name="plus" size={17} color="#fff" />
            <Text style={styles.addButtonText}>Add Bank Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  loader: { marginTop: 40 },

  retryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  retryText: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: foodColors.badgeBlue },

  list: { gap: 14 },
  cardTile: {
    borderRadius: 18,
    padding: 18,
    minHeight: 150,
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
  bankName: {
    fontSize: 18,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
    marginTop: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  metaBlock: { flex: 1 },
  metaBlockRight: { alignItems: 'flex-end' },
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
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionsLabel: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
    flexShrink: 1,
  },
  actionText: {
    fontSize: 12,
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },
  removeText: { color: '#FF3B30' },

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