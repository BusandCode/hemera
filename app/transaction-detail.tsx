import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';

const ui = {
  background: '#F7F8FC',
  surface: '#FFFFFF',
  border: '#EEF0F6',
  blue: '#1B3BD8',
  blueSoft: '#EEF2FF',
  textPrimary: '#0B1020',
  textSecondary: '#6B7185',
  green: '#22A35A',
  greenSoft: 'rgba(34,163,90,0.12)',
  orange: '#F59E0B',
  orangeSoft: 'rgba(245,158,11,0.14)',
  red: '#E23A2E',
  redSoft: 'rgba(226,58,46,0.12)',
};

const ACCOUNT_NAME = process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME || 'Webby Stay';

const PAID_STATUSES = ['success', 'successful', 'completed', 'paid'];
const FAILED_STATUSES = ['failed', 'expired', 'cancelled', 'canceled'];

const PURPOSE_LABELS: Record<string, string> = {
  funding: 'Wallet funding',
  eplan: 'E-Plan payment',
  echop: 'E-Chop order payment',
  ewash: 'E-Wash payment',
  subscription: 'Store payment',
};

type Txn = {
  tx_ref: string;
  status?: string | null;
  amount_kobo?: number | string | null;
  purpose?: string | null;
  title?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  created_at?: string | null;
};

function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-US')}`;
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusMeta(status?: string | null) {
  const s = String(status ?? '').toLowerCase();
  if (PAID_STATUSES.includes(s)) {
    return { label: 'Successful', color: ui.green, bg: ui.greenSoft, icon: 'check' as const, paid: true };
  }
  if (FAILED_STATUSES.includes(s)) {
    return { label: 'Failed', color: ui.red, bg: ui.redSoft, icon: 'x' as const, paid: false };
  }
  return { label: 'Pending', color: ui.orange, bg: ui.orangeSoft, icon: 'clock' as const, paid: false };
}

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReceiptHtml(r: {
  title: string;
  amount: string;
  status: string;
  date: string;
  reference: string;
  bank: string;
  account: string;
  accountName: string;
  customerName: string;
  customerEmail: string;
}) {
  const row = (label: string, value: string) =>
    value
      ? `<tr><td class="l">${esc(label)}</td><td class="v">${esc(value)}</td></tr>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #0B1020; margin: 0; padding: 40px 32px; }
  .brand { font-size: 13px; font-weight: 700; letter-spacing: 3px; color: #1B3BD8; }
  h1 { font-size: 22px; margin: 6px 0 24px; }
  .amount { text-align: center; padding: 24px 0; border-top: 1px solid #EEF0F6; border-bottom: 1px solid #EEF0F6; }
  .amount .n { font-size: 34px; font-weight: 700; }
  .amount .s { display: inline-block; margin-top: 10px; padding: 4px 14px; border-radius: 14px; background: #E8F6EE; color: #22A35A; font-size: 12px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; }
  td { padding: 11px 0; border-bottom: 1px solid #EEF0F6; font-size: 13px; vertical-align: top; }
  td.l { color: #6B7185; width: 38%; }
  td.v { text-align: right; font-weight: 600; word-break: break-all; }
  .foot { margin-top: 36px; text-align: center; font-size: 11px; color: #6B7185; }
</style>
</head>
<body>
  <div class="brand">HEMERA</div>
  <h1>Payment Receipt</h1>
  <div class="amount">
    <div class="n">${esc(r.amount)}</div>
    <div class="s">${esc(r.status)}</div>
  </div>
  <table>
    ${row('Description', r.title)}
    ${row('Date', r.date)}
    ${row('Reference', r.reference)}
    ${row('Payment method', 'Bank transfer')}
    ${row('Bank', r.bank)}
    ${row('Account number', r.account)}
    ${row('Account name', r.accountName)}
    ${row('Customer', r.customerName)}
    ${row('Email', r.customerEmail)}
  </table>
  <div class="foot">Thank you for using Hemera. This receipt was generated automatically.</div>
</body>
</html>`;
}

function DetailRow({
  label,
  value,
  copied,
  onCopy,
  last,
}: {
  label: string;
  value: string;
  copied?: boolean;
  onCopy?: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue} selectable>
          {value}
        </Text>
        {onCopy ? (
          <TouchableOpacity onPress={onCopy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? ui.green : ui.blue} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reference } = useLocalSearchParams<{ reference?: string }>();

  const [txn, setTxn] = useState<Txn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customer, setCustomer] = useState({ name: '', email: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!reference) {
        setError('Transaction not found.');
        setLoading(false);
        return;
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const { data, error: loadError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('tx_ref', reference)
          .maybeSingle();

        if (cancelled) return;

        if (loadError || !data) {
          setError('We could not load this transaction.');
        } else {
          setTxn(data as Txn);
          setCustomer({
            name: String(session?.user.user_metadata?.full_name ?? ''),
            email: session?.user.email ?? '',
          });
        }
      } catch {
        if (!cancelled) setError('We could not load this transaction.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const copyReference = async () => {
    if (!txn) return;
    try {
      await Clipboard.setStringAsync(txn.tx_ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Could not copy', `Please copy it manually:\n\n${txn.tx_ref}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={ui.blue} />
      </View>
    );
  }

  if (error || !txn) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <Feather name="alert-circle" size={32} color={ui.red} />
        <Text style={styles.errorText}>{error || 'Transaction not found.'}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = statusMeta(txn.status);
  const amount = formatNaira(Number(txn.amount_kobo ?? 0) / 100);
  const title = txn.title || PURPOSE_LABELS[txn.purpose ?? 'funding'] || 'Transaction';
  const date = formatDate(txn.created_at);

  const rows: { label: string; value: string; copy?: boolean }[] = [];
  rows.push({ label: 'Description', value: title });
  if (date) rows.push({ label: 'Date', value: date });
  rows.push({ label: 'Reference', value: txn.tx_ref, copy: true });
  rows.push({ label: 'Payment method', value: 'Bank transfer' });
  if (txn.bank_name) rows.push({ label: 'Bank', value: txn.bank_name });
  if (txn.account_number) {
    rows.push({ label: 'Account number', value: txn.account_number });
    rows.push({ label: 'Account name', value: ACCOUNT_NAME });
  }

  const downloadReceipt = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html = buildReceiptHtml({
        title,
        amount,
        status: meta.label,
        date,
        reference: txn.tx_ref,
        bank: txn.bank_name ?? '',
        account: txn.account_number ?? '',
        accountName: txn.account_number ? ACCOUNT_NAME : '',
        customerName: customer.name,
        customerEmail: customer.email,
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Save receipt',
        });
      } else {
        Alert.alert('Receipt ready', 'Sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Could not create receipt', 'Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={18} color={ui.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={[styles.statusCircle, { backgroundColor: meta.bg }]}>
            <Feather name={meta.icon} size={26} color={meta.color} />
          </View>
          <Text style={styles.amountText}>{amount}</Text>
          <Text style={styles.titleText}>{title}</Text>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          {rows.map((r, i) => (
            <DetailRow
              key={r.label}
              label={r.label}
              value={r.value}
              copied={r.copy ? copied : undefined}
              onCopy={r.copy ? copyReference : undefined}
              last={i === rows.length - 1}
            />
          ))}
        </View>

        {meta.paid && (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.downloadBtn, downloading && styles.btnDisabled]}
            onPress={downloadReceipt}
            disabled={downloading}
            activeOpacity={0.85}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="download" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Download Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 30 },
  errorText: { fontSize: 13, fontFamily: fonts.poppins.medium, color: ui.textSecondary, textAlign: 'center' },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ui.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontFamily: fonts.poppins.bold, color: ui.textPrimary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },

  summaryCard: {
    backgroundColor: ui.surface,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  amountText: { fontSize: 28, fontFamily: fonts.poppins.bold, color: ui.textPrimary },
  titleText: { fontSize: 13, fontFamily: fonts.poppins.medium, color: ui.textSecondary, marginTop: 2, textAlign: 'center' },
  statusPill: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  statusPillText: { fontSize: 12, fontFamily: fonts.poppins.bold },

  detailsCard: {
    backgroundColor: ui.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: ui.border },
  rowLabel: { fontSize: 12.5, fontFamily: fonts.poppins.regular, color: ui.textSecondary },
  rowRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  rowValue: { flexShrink: 1, fontSize: 13, fontFamily: fonts.poppins.semiBold, color: ui.textPrimary, textAlign: 'right' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ui.blue,
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  primaryBtnText: { fontSize: 13, fontFamily: fonts.poppins.semiBold, color: '#fff' },
  downloadBtn: { alignSelf: 'stretch' },
  btnDisabled: { opacity: 0.7 },
});