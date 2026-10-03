import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { supabase } from '../src/lib/supabase';

type OrderType = 'echop' | 'ewash';

type OrderStep = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
};

type TrackedOrder = {
  id: string;
  type: OrderType;
  title: string;
  currentStepIndex: number;
  steps: OrderStep[];
  eta: string;
  placedAt: string;
};

// ============ E-CHOP STEPS ============
const ECHOP_STEPS: OrderStep[] = [
  {
    key: 'received',
    label: 'Order Received',
    description: 'We have your order.',
    icon: 'receipt',
    color: '#5F6B77',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    description: 'Your meal is being cooked.',
    icon: 'chef-hat',
    color: '#E0A91F',
  },
  {
    key: 'ready',
    label: 'Ready',
    description: 'Your order is ready for pickup.',
    icon: 'check-circle-outline',
    color: '#4A90E2',
  },
  {
    key: 'picked-up',
    label: 'Picked Up',
    description: 'Rider has picked up your order.',
    icon: 'moped',
    color: '#2E9E5B',
  },
  {
    key: 'out-for-delivery',
    label: 'Out for Delivery',
    description: 'On the way to you.',
    icon: 'moped',
    color: '#1E7A3E',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Enjoy your meal!',
    icon: 'check-circle',
    color: '#3A3F45',
  },
];

// ============ E-WASH STEPS ============
const EWASH_STEPS: OrderStep[] = [
  {
    key: 'scheduled',
    label: 'Scheduled',
    description: 'Your pickup is booked.',
    icon: 'calendar',
    color: '#5F6B77',
  },
  {
    key: 'picked-up',
    label: 'Picked Up',
    description: 'Your laundry has been picked up.',
    icon: 'truck',
    color: '#4A90E2',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Your clothes are being washed.',
    icon: 'washing-machine',
    color: '#E0A91F',
  },
  {
    key: 'ready',
    label: 'Ready',
    description: 'Clean, folded, and ready.',
    icon: 'check-circle-outline',
    color: '#2E9E5B',
  },
  {
    key: 'out-for-delivery',
    label: 'Out for Delivery',
    description: 'On its way back to you.',
    icon: 'moped',
    color: '#1E7A3E',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Delivered. Enjoy!',
    icon: 'check-circle',
    color: '#3A3F45',
  },
];

function normalizeStatus(raw: string, type: OrderType): string {
  const s = String(raw ?? '').toLowerCase().replace(/\s+/g, '-');
  const aliases: Record<string, string> = {
    'in-progress': type === 'echop' ? 'preparing' : 'processing',
    picked_up: 'picked-up',
    out_for_delivery: 'out-for-delivery',
    'on-the-way': 'out-for-delivery',
    completed: 'delivered',
    placed: 'received',
    confirmed: 'received',
    cancel: 'scheduled',
    cancelled: 'scheduled',
    canceled: 'scheduled',
    active: type === 'echop' ? 'preparing' : 'processing',
  };
  return aliases[s] ?? s;
}

function stepIndexFor(type: OrderType, status: string): number {
  const steps = type === 'echop' ? ECHOP_STEPS : EWASH_STEPS;
  const idx = steps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} • ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export default function TrackOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderId?: string }>();

  const [orderId, setOrderId] = useState(
    String(params.orderId ?? '').replace(/^#/, '').trim().toUpperCase()
  );
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const canSubmit =
    orderId.trim().length >= 4 && /\S+@\S+\.\S+/.test(email.trim()) && !loading;

  const handleTrack = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');

    const cleanedRef = orderId.trim().replace(/^#/, '').toUpperCase();
    const inputEmail = email.trim().toLowerCase();

    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select('id, order_type, status, metadata, created_at')
        .eq('metadata->>ref', cleanedRef)
        .maybeSingle();

      if (err) throw err;

      if (!data) {
        setError(
          "We couldn't find an order with that ID. Please double-check and try again."
        );
        setLoading(false);
        return;
      }

      const meta = (data.metadata ?? {}) as Record<string, any>;
      const metaEmail = String(meta.customer_email ?? '').toLowerCase();

      if (metaEmail && metaEmail !== inputEmail) {
        setError(
          "We couldn't find an order with that ID and email. Please double-check and try again."
        );
        setLoading(false);
        return;
      }

      // Type from ref prefix (CHP = chop, WSH = wash), fallback to order_type.
      const prefix = cleanedRef.split('-')[0];
      let type: OrderType;
      if (prefix === 'CHP') type = 'echop';
      else if (prefix === 'WSH') type = 'ewash';
      else type = data.order_type === 'ewash' ? 'ewash' : 'echop';

      const steps = type === 'echop' ? ECHOP_STEPS : EWASH_STEPS;
      const normalizedStatus = normalizeStatus(data.status, type);
      const currentIndex = stepIndexFor(type, normalizedStatus);

      setOrder({
        id: String(meta.ref ?? data.id),
        type,
        title: meta.title ?? 'Order',
        currentStepIndex: currentIndex,
        steps,
        eta: meta.eta ?? 'Calculating…',
        placedAt: data.created_at ?? new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setOrder(null);
    setError('');
    setOrderId('');
    setEmail('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <StatusBar style="dark" />

        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (order ? reset() : router.back())}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {order ? 'Order Status' : 'Track Order'}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!order ? (
            <>
              <Text style={styles.subtitle}>
                Enter your Order ID and the email you used at checkout.
              </Text>

              <View style={styles.heroIconWrap}>
                <View style={styles.heroIconCircle}>
                  <MaterialCommunityIcons
                    name="map-marker-path"
                    size={34}
                    color={foodColors.primary}
                  />
                </View>
              </View>

              <Text style={styles.sectionLabel}>ORDER DETAILS</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Order ID</Text>
                <View style={styles.inputWrap}>
                  <Feather name="hash" size={16} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={orderId}
                    onChangeText={(t) => {
                      setOrderId(t);
                      if (error) setError('');
                    }}
                    placeholder="e.g. CHP-1001 or WSH-1234"
                    placeholderTextColor={foodColors.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <Feather name="mail" size={16} color={foodColors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (error) setError('');
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={foodColors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleTrack}
                    autoFocus={!!orderId}
                  />
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={14} color="#FF3B30" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
                onPress={handleTrack}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="search" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Track Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Summary card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View
                    style={[
                      styles.typeBadge,
                      order.type === 'echop'
                        ? styles.typeBadgeEchop
                        : styles.typeBadgeEwash,
                    ]}
                  >
                    <Feather
                      name={order.type === 'echop' ? 'coffee' : 'droplet'}
                      size={12}
                      color={
                        order.type === 'echop'
                          ? foodColors.primary
                          : foodColors.badgeBlue
                      }
                    />
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color:
                            order.type === 'echop'
                              ? foodColors.primary
                              : foodColors.badgeBlue,
                        },
                      ]}
                    >
                      {order.type === 'echop' ? 'E-CHOP' : 'E-WASH'}
                    </Text>
                  </View>
                  <Text style={styles.summaryId}>#{order.id}</Text>
                </View>

                <Text style={styles.summaryTitle} numberOfLines={2}>
                  {order.title}
                </Text>

                <View style={styles.summaryRow}>
                  <Feather name="clock" size={13} color={foodColors.textMuted} />
                  <Text style={styles.summaryMeta}>
                    Placed {formatDate(order.placedAt)}
                  </Text>
                </View>
              </View>

              {/* Timeline */}
              <Text style={styles.sectionLabel}>STATUS</Text>
              <View style={styles.timelineCard}>
                {order.steps.map((step, index) => {
                  const reached = index <= order.currentStepIndex;
                  const isCurrent = index === order.currentStepIndex;
                  const isLast = index === order.steps.length - 1;

                  const circleBg = reached ? step.color : '#EDEEF1';
                  const iconColor = reached ? '#fff' : '#A0A6AE';
                  const titleColor = reached ? '#0B1020' : '#A0A6AE';
                  const lineColor = reached ? step.color : '#EFE8D8';

                  return (
                    <View key={step.key} style={styles.stepRow}>
                      <View style={styles.stepRail}>
                        <View
                          style={[
                            styles.stepCircle,
                            { backgroundColor: circleBg },
                            isCurrent && styles.stepCircleCurrent,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={reached ? 'check' : step.icon}
                            size={16}
                            color={iconColor}
                          />
                        </View>
                        {!isLast && (
                          <View
                            style={[styles.stepLine, { backgroundColor: lineColor }]}
                          />
                        )}
                      </View>

                      <View
                        style={[
                          styles.stepBody,
                          !isLast && styles.stepBodySpacing,
                        ]}
                      >
                        <Text style={[styles.stepTitle, { color: titleColor }]}>
                          {step.label}
                        </Text>
                        <Text
                          style={[
                            styles.stepDescription,
                            !reached && styles.stepDescriptionMuted,
                          ]}
                        >
                          {step.description}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={reset}
                activeOpacity={0.85}
              >
                <Feather name="search" size={15} color={foodColors.textPrimary} />
                <Text style={styles.secondaryBtnText}>Track another order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpLink}
                onPress={() => router.push('/contact-support' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.helpLinkText}>
                  Need help with this order?
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    lineHeight: 19,
    marginBottom: 22,
  },

  heroIconWrap: { alignItems: 'center', marginBottom: 24 },
  heroIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  field: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.poppins.medium,
    color: '#FF3B30',
    flexShrink: 1,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: foodColors.primary,
    paddingVertical: 16,
    borderRadius: 26,
    marginTop: 4,
    minHeight: 52,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  // Summary card
  summaryCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeEchop: { backgroundColor: foodColors.primaryLight },
  typeBadgeEwash: { backgroundColor: 'rgba(46,90,172,0.10)' },
  typeBadgeText: {
    fontSize: 9.5,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
  },
  summaryId: {
    flexShrink: 1,
    fontSize: 11.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textMuted,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 8,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryMeta: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0EDE6',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 38 },
  stepCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleCurrent: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stepLine: {
    flex: 1,
    width: 3,
    borderRadius: 1.5,
    marginVertical: 2,
  },
  stepBody: { flex: 1, paddingTop: 4 },
  stepBodySpacing: { paddingBottom: 18 },
  stepTitle: {
    fontSize: 15,
    fontFamily: fonts.poppins.semiBold,
    lineHeight: 20,
  },
  stepDescription: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: '#5F6B77',
    lineHeight: 17,
    marginTop: 1,
  },
  stepDescriptionMuted: {
    color: '#A0A6AE',
  },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    backgroundColor: foodColors.surface,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },

  helpLink: { alignItems: 'center', paddingVertical: 16 },
  helpLinkText: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },
});