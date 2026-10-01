import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

const WALLET_BLUE = '#0032C1';
const ACCOUNT_NUMBER_LENGTH = 10;

type Bank = { name: string; code: string };

// Verify these codes against your payment provider's bank list before going live.
const BANKS: Bank[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'FCMB', code: '214' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Globus Bank', code: '00103' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'SunTrust Bank', code: '100' },
  { name: 'Taj Bank', code: '000026' },
  { name: 'Titan Trust Bank', code: '000025' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

export default function AddBankAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [bank, setBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [nameVerified, setNameVerified] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveFailed, setResolveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Guards against a slow lookup for an old number overwriting a newer one
  const resolveRequestId = useRef(0);

  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? BANKS.filter((b) => b.name.toLowerCase().includes(q)) : BANKS;
  }, [search]);

  // Try to auto-fill the account name once we have a bank and a full account number.
  // This calls an optional Supabase Edge Function named "resolve-bank-account".
  // If it isn't deployed or fails, the user can simply type the name.
  useEffect(() => {
    const requestId = ++resolveRequestId.current;

    if (!bank || accountNumber.length !== ACCOUNT_NUMBER_LENGTH) {
      if (nameVerified) {
        setAccountName('');
        setNameVerified(false);
      }
      setResolveFailed(false);
      setResolving(false);
      return;
    }

    setResolving(true);
    setResolveFailed(false);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('resolve-bank-account', {
          body: { account_number: accountNumber, bank_code: bank.code },
        });
        if (requestId !== resolveRequestId.current) return;

        if (error || !data?.account_name) {
          setResolveFailed(true);
          setNameVerified(false);
        } else {
          setAccountName(String(data.account_name));
          setNameVerified(true);
        }
      } catch {
        if (requestId !== resolveRequestId.current) return;
        setResolveFailed(true);
        setNameVerified(false);
      } finally {
        if (requestId === resolveRequestId.current) setResolving(false);
      }
    })();
  }, [bank, accountNumber]);

  const canSave =
    !!bank &&
    accountNumber.length === ACCOUNT_NUMBER_LENGTH &&
    accountName.trim().length >= 3 &&
    !resolving &&
    !saving;

  const handleSave = async () => {
    const userId = session?.user.id;
    if (!userId || !bank || !canSave) return;

    setSaving(true);
    try {
      // The new account becomes the default, so clear the current default first
      const { error: clearError } = await supabase
        .from('bank_accounts')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
      if (clearError) throw clearError;

      const { error: insertError } = await supabase.from('bank_accounts').insert({
        user_id: userId,
        bank_name: bank.name,
        bank_code: bank.code,
        account_name: accountName.trim(),
        account_number: accountNumber,
        is_default: true,
      });
      if (insertError) throw insertError;

      router.back();
    } catch (e: any) {
      console.warn('Failed to save bank account:', e?.message ?? e);
      Alert.alert('Could not save account', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <StatusBar style="dark" />

        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Add Bank Account</Text>
          <Text style={styles.subtitle}>This is where your withdrawals will be sent.</Text>

          <Text style={styles.fieldLabel}>Bank</Text>
          <TouchableOpacity style={styles.selectRow} activeOpacity={0.85} onPress={() => setPickerOpen(true)}>
            <Text style={[styles.selectText, !bank && styles.placeholderText]}>
              {bank ? bank.name : 'Select your bank'}
            </Text>
            <Feather name="chevron-down" size={18} color={foodColors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Account number</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, '').slice(0, ACCOUNT_NUMBER_LENGTH))}
              keyboardType="number-pad"
              placeholder="0123456789"
              placeholderTextColor={foodColors.textMuted}
              maxLength={ACCOUNT_NUMBER_LENGTH}
              returnKeyType="done"
            />
            {resolving ? <ActivityIndicator size="small" color={WALLET_BLUE} /> : null}
          </View>
          <Text style={styles.hint}>
            {accountNumber.length}/{ACCOUNT_NUMBER_LENGTH} digits
          </Text>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Account name</Text>
          <View style={[styles.inputRow, nameVerified && styles.inputRowVerified]}>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              editable={!nameVerified && !resolving}
              autoCapitalize="characters"
              placeholder={resolving ? 'Looking up account name…' : 'Name on the account'}
              placeholderTextColor={foodColors.textMuted}
              returnKeyType="done"
            />
            {nameVerified ? <Feather name="check-circle" size={18} color={foodColors.success} /> : null}
          </View>
          {resolveFailed ? (
            <Text style={styles.hint}>We couldn't verify this account automatically. Enter the name exactly as it appears on the account.</Text>
          ) : null}

          <View style={styles.infoCard}>
            <Feather name="info" size={18} color={WALLET_BLUE} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>Use your own account</Text>
              <Text style={styles.infoSubtitle}>
                The account name should match the name on your Hemera profile, otherwise withdrawals may be delayed or rejected.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.continueButton, !canSave && styles.continueButtonDisabled]}
            activeOpacity={0.85}
            disabled={!canSave}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Save Bank Account</Text>
                <Feather name="check" size={16} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select bank</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={foodColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Feather name="search" size={16} color={foodColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search banks"
                placeholderTextColor={foodColors.textMuted}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.emptyText}>No banks match your search.</Text>}
              renderItem={({ item }) => {
                const selected = bank?.code === item.code;
                return (
                  <TouchableOpacity
                    style={styles.bankOption}
                    activeOpacity={0.8}
                    onPress={() => {
                      setBank(item);
                      setPickerOpen(false);
                      setSearch('');
                    }}
                  >
                    <Text style={[styles.bankOptionText, selected && styles.bankOptionTextSelected]}>{item.name}</Text>
                    {selected ? <Feather name="check" size={18} color={WALLET_BLUE} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: foodColors.background },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  titleRow: { paddingHorizontal: 20, marginBottom: 4 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: foodColors.surface, justifyContent: 'center', alignItems: 'center',
  },

  title: { fontSize: 28, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginTop: 10, marginBottom: 6 },
  subtitle: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 18, marginBottom: 22 },

  fieldLabel: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 10 },
  fieldSpacing: { marginTop: 18 },

  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: foodColors.surface, borderWidth: 1.5, borderColor: foodColors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
  },
  selectText: { fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  placeholderText: { color: foodColors.textMuted, fontFamily: fonts.poppins.regular },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: foodColors.surface, borderWidth: 1.5, borderColor: foodColors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputRowVerified: { borderColor: foodColors.success },
  input: { flex: 1, fontSize: 14, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, padding: 0 },
  hint: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textMuted, marginTop: 6, lineHeight: 15 },

  infoCard: {
    flexDirection: 'row', gap: 12, backgroundColor: 'rgba(0,50,193,0.06)',
    borderRadius: 16, padding: 14, marginTop: 24,
  },
  infoTextBlock: { flex: 1 },
  infoTitle: { fontSize: 13, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary, marginBottom: 3 },
  infoSubtitle: { fontSize: 11.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, lineHeight: 16 },

  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: foodColors.border },
  continueButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0B1020', paddingVertical: 16, borderRadius: 26, minHeight: 52,
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: 14, fontFamily: fonts.poppins.bold, color: '#fff' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: foodColors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 18, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: foodColors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 13.5, fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, padding: 0 },
  bankOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: foodColors.border,
  },
  bankOptionText: { fontSize: 14, fontFamily: fonts.poppins.regular, color: foodColors.textPrimary },
  bankOptionTextSelected: { fontFamily: fonts.poppins.bold, color: WALLET_BLUE },
  emptyText: { textAlign: 'center', paddingVertical: 24, fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
});