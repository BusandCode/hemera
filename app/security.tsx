import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useAppData } from '../src/context/AppDataContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

type PinStatus = {
  loaded: boolean;
  hasPin: boolean;
  loginEnabled: boolean;
};

type PinStatusRow = {
  has_pin?: boolean | null;
  pin_login_enabled?: boolean | null;
};

type FeatherIcon = keyof typeof Feather.glyphMap;

type DialogTone = 'primary' | 'danger';

type DialogConfig = {
  icon: FeatherIcon;
  tone?: DialogTone;
  pill?: { icon: FeatherIcon; label: string };
  title: string;
  body: string;
  primary: { label: string; onPress?: () => void };
  secondary?: { label: string; onPress?: () => void };
};

const DANGER = '#FF3B30';
const DANGER_LIGHT = 'rgba(255,59,48,0.10)';

const UNAVAILABLE: Record<'biometric' | 'twoFactor', DialogConfig> = {
  biometric: {
    icon: 'smartphone',
    pill: { icon: 'clock', label: 'COMING SOON' },
    title: 'Biometric Login',
    body: "Face ID and fingerprint login aren't available yet. For now, use your PIN or password to open the app. We'll let you know as soon as it's ready.",
    primary: { label: 'Got it' },
  },
  twoFactor: {
    icon: 'shield',
    pill: { icon: 'clock', label: 'COMING SOON' },
    title: 'Two-Factor Authentication',
    body: "Two-factor authentication is not available at the moment. On our next update, you'll be able to turn it on soon.",
    primary: { label: 'Got it' },
  },
};

/**
 * Supabase RPCs return a single object for scalar/composite returns,
 * but an array for RETURNS TABLE / SETOF. Normalize to one row.
 */
function unwrapRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  return (data as T) ?? null;
}

/**
 * Normalize set_pin_login's response into a status string.
 * Accepts: 'ok' | 'pin_required' | true | { status: '...' } | null (void function).
 */
function toPinLoginStatus(data: unknown): 'ok' | 'pin_required' | 'unknown' {
  const result = unwrapRow<any>(data);

  if (result === null || result === undefined) return 'ok';
  if (result === true) return 'ok';
  if (result === false) return 'unknown';

  const raw =
    typeof result === 'string'
      ? result
      : typeof result === 'object'
        ? result.status ?? result.set_pin_login ?? result.result
        : undefined;

  const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : raw;

  if (normalized === 'ok' || normalized === true) return 'ok';
  if (normalized === 'pin_required') return 'pin_required';
  return 'unknown';
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
}: {
  icon: FeatherIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={ms(16)} color={foodColors.textPrimary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Feather name="chevron-right" size={ms(18)} color={foodColors.textMuted} />
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon: FeatherIcon;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={ms(16)} color={foodColors.textPrimary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: foodColors.border, true: foodColors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

/** Branded dialog used instead of the system Alert. */
function AppDialog({ config, onClose }: { config: DialogConfig | null; onClose: () => void }) {
  // Keep the last config while fading out so content doesn't vanish mid-animation.
  const [shown, setShown] = useState<DialogConfig | null>(config);
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (config) {
      setShown(config);
      scale.setValue(0.92);
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }).start();
    }
  }, [config, scale]);

  const tone = shown?.tone ?? 'primary';
  const accent = tone === 'danger' ? DANGER : foodColors.primary;
  const accentLight = tone === 'danger' ? DANGER_LIGHT : foodColors.primaryLight;

  const press = (action?: { onPress?: () => void }) => {
    onClose();
    action?.onPress?.();
  };

  return (
    <Modal
      visible={!!config}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={[styles.badgeOuter, { backgroundColor: accentLight }]}>
              <View style={styles.badgeInner}>
                <Feather name={shown?.icon ?? 'info'} size={ms(26)} color={accent} />
              </View>
            </View>

            {shown?.pill ? (
              <View style={[styles.pill, { backgroundColor: accentLight }]}>
                <Feather name={shown.pill.icon} size={ms(11)} color={accent} />
                <Text style={[styles.pillText, { color: accent }]}>{shown.pill.label}</Text>
              </View>
            ) : null}

            <Text style={styles.modalTitle}>{shown?.title}</Text>
            <Text style={styles.modalBody}>{shown?.body}</Text>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: accent }]}
              onPress={() => press(shown?.primary)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>{shown?.primary.label}</Text>
            </TouchableOpacity>

            {shown?.secondary ? (
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => press(shown.secondary)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSecondaryText}>{shown.secondary.label}</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const { security, setBiometric, setTwoFactor } = useAppData();
  const [pin, setPin] = useState<PinStatus>({
    loaded: false,
    hasPin: false,
    loginEnabled: false,
  });
  const [pinToggleBusy, setPinToggleBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  // Biometric isn't supported yet — make sure a stale "on" value is cleared.
  useEffect(() => {
    if (security.biometric) setBiometric(false);
  }, [security.biometric, setBiometric]);

  const loadPinStatus = useCallback(async (isActive: () => boolean = () => true) => {
    const { data, error } = await supabase.rpc('get_pin_status');
    if (!isActive()) return;

    if (error) {
      console.warn('[Security] get_pin_status failed:', error);
      setPin((p) => ({ ...p, loaded: true }));
      return;
    }

    const row = unwrapRow<PinStatusRow>(data);
    const hasPin = row?.has_pin === true;

    setPin({
      loaded: true,
      hasPin,
      loginEnabled: hasPin && row?.pin_login_enabled === true,
    });
  }, []);

  // Refresh every time the screen is focused (e.g. after returning from Create PIN).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadPinStatus(() => active).catch((e) => {
        console.warn('[Security] get_pin_status threw:', e);
        if (active) setPin((p) => ({ ...p, loaded: true }));
      });
      return () => {
        active = false;
      };
    }, [loadPinStatus])
  );

  const showCreatePin = () => {
    setDialog({
      icon: 'hash',
      title: 'Create a PIN first',
      body: 'You need a PIN before you can turn on Login with PIN. Create one now, then come back and switch it on.',
      primary: { label: 'Create PIN', onPress: () => router.push('/change-pin' as any) },
      secondary: { label: 'Not now' },
    });
  };

  const showPinError = (message: string, attempted: boolean) => {
    setDialog({
      icon: 'alert-triangle',
      tone: 'danger',
      title: "Couldn't update Login with PIN",
      body: message,
      primary: { label: 'Try again', onPress: () => handlePinLogin(attempted) },
      secondary: { label: 'Close' },
    });
  };

  const handlePinLogin = async (next: boolean) => {
    if (!pin.loaded || pinToggleBusy) return;

    if (next && !pin.hasPin) {
      showCreatePin();
      return;
    }

    const previous = pin.loginEnabled;
    setPinToggleBusy(true);
    setPin((p) => ({ ...p, loginEnabled: next })); // optimistic

    try {
      const { data, error } = await supabase.rpc('set_pin_login', { p_enabled: next });

      if (error) {
        console.warn('[Security] set_pin_login failed:', error);
        setPin((p) => ({ ...p, loginEnabled: previous }));
        showPinError(error.message || 'Something went wrong. Please try again.', next);
        return;
      }

      const status = toPinLoginStatus(data);

      if (status === 'ok') return;

      if (status === 'pin_required') {
        setPin((p) => ({ ...p, loginEnabled: false, hasPin: false }));
        showCreatePin();
        return;
      }

      console.warn('[Security] set_pin_login unexpected response:', data);
      setPin((p) => ({ ...p, loginEnabled: previous }));
      showPinError('Something went wrong on our side. Please try again in a moment.', next);
    } catch (e: any) {
      console.warn('[Security] set_pin_login threw:', e);
      setPin((p) => ({ ...p, loginEnabled: previous }));
      showPinError(e?.message || 'Check your internet connection and try again.', next);
    } finally {
      setPinToggleBusy(false);
    }
  };

  const handleBiometric = (next: boolean) => {
    if (next) {
      setDialog(UNAVAILABLE.biometric);
      return;
    }
    setBiometric(false);
  };

  const handleTwoFactor = (next: boolean) => {
    if (next) {
      setDialog(UNAVAILABLE.twoFactor);
      return;
    }
    setTwoFactor(false);
  };

  const pinTitle = !pin.loaded ? 'PIN' : pin.hasPin ? 'Change PIN' : 'Create PIN';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Security" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Login & Payment Access</Text>
        <View style={styles.group}>
          <ActionRow
            icon="lock"
            title="Change Password"
            subtitle={`Last changed ${security.passwordLastChanged}`}
            onPress={() => router.push('/change-password' as any)}
          />
          <ActionRow
            icon="hash"
            title={pinTitle}
            disabled={!pin.loaded}
            onPress={() => router.push('/change-pin' as any)}
          />
          <ToggleRow
            icon="key"
            title="Login with PIN"
            subtitle={
              pin.loaded && !pin.hasPin
                ? 'Create a PIN first to turn this on'
                : 'Use your PIN instead of your password to log in'
            }
            value={pin.loginEnabled}
            onValueChange={handlePinLogin}
            disabled={!pin.loaded || pinToggleBusy}
          />
          <ToggleRow
            icon="smartphone"
            title="Biometric Login"
            subtitle="Use Face ID or fingerprint to open the app"
            value={false}
            onValueChange={handleBiometric}
          />
          <ToggleRow
            icon="shield"
            title="Two-Factor Authentication"
            subtitle="Extra code required when logging in on a new device"
            value={security.twoFactor}
            onValueChange={handleTwoFactor}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AppDialog config={dialog} onClose={() => setDialog(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(30) },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: ms(8),
    marginTop: ms(18),
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
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
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowDisabled: { opacity: 0.6 },
  iconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },

  bottomSpacer: { height: ms(20) },

  // Dialog
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,16,32,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(28),
  },
  cardWrap: {
    width: '100%',
    maxWidth: ms(360),
  },
  card: {
    width: '100%',
    backgroundColor: foodColors.background,
    borderRadius: ms(24),
    paddingHorizontal: ms(22),
    paddingTop: ms(28),
    paddingBottom: ms(18),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  badgeOuter: {
    width: ms(84),
    height: ms(84),
    borderRadius: ms(42),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(16),
  },
  badgeInner: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: ms(20),
    marginBottom: ms(12),
  },
  pillText: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    marginBottom: ms(8),
  },
  modalBody: {
    fontSize: ms(13),
    lineHeight: ms(19),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: ms(22),
  },
  modalBtn: {
    width: '100%',
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: ms(13),
    marginTop: ms(4),
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textSecondary,
  },
});