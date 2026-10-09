import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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

type Unavailable = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
};

const UNAVAILABLE: Record<'biometric' | 'twoFactor', Unavailable> = {
  biometric: {
    icon: 'smartphone',
    title: 'Biometric Login',
    body: "Face ID and fingerprint login aren't available yet. For now, use your PIN or password to open the app. We'll let you know as soon as it's ready.",
  },
  twoFactor: {
    icon: 'shield',
    title: 'Two-Factor Authentication',
    body: "Two-factor authentication is not available at the moment. On our next update, you'll be able to turn it on soon.",
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

  if (result === null || result === undefined) return 'ok'; // void function, no error
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
  icon: keyof typeof Feather.glyphMap;
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
  icon: keyof typeof Feather.glyphMap;
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

function UnavailableModal({
  info,
  onClose,
}: {
  info: Unavailable | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={!!info}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.badgeOuter}>
            <View style={styles.badgeInner}>
              <Feather name={info?.icon ?? 'shield'} size={ms(26)} color={foodColors.primary} />
            </View>
          </View>

          <View style={styles.soonPill}>
            <Feather name="clock" size={ms(11)} color={foodColors.primary} />
            <Text style={styles.soonPillText}>COMING SOON</Text>
          </View>

          <Text style={styles.modalTitle}>{info?.title}</Text>
          <Text style={styles.modalBody}>{info?.body}</Text>

          <TouchableOpacity style={styles.modalBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.modalBtnText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
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
  const [unavailable, setUnavailable] = useState<Unavailable | null>(null);

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

  const promptCreatePin = () => {
    Alert.alert(
      'Create a PIN first',
      'You need to create a PIN before you can turn on Login with PIN. Create one now, then come back and switch it on.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create PIN', onPress: () => router.push('/change-pin' as any) },
      ]
    );
  };

  const handlePinLogin = async (next: boolean) => {
    if (!pin.loaded || pinToggleBusy) return;

    if (next && !pin.hasPin) {
      promptCreatePin();
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
        Alert.alert(
          "Couldn't update Login with PIN",
          error.message || 'Something went wrong. Please try again.'
        );
        return;
      }

      const status = toPinLoginStatus(data);

      if (status === 'ok') return; // keep optimistic value

      if (status === 'pin_required') {
        setPin((p) => ({ ...p, loginEnabled: false, hasPin: false }));
        promptCreatePin();
        return;
      }

      console.warn('[Security] set_pin_login unexpected response:', data);
      setPin((p) => ({ ...p, loginEnabled: previous }));
      Alert.alert("Couldn't update Login with PIN", 'Please try again in a moment.');
    } catch (e: any) {
      console.warn('[Security] set_pin_login threw:', e);
      setPin((p) => ({ ...p, loginEnabled: previous }));
      Alert.alert(
        "Couldn't update Login with PIN",
        e?.message || 'Check your connection and try again.'
      );
    } finally {
      setPinToggleBusy(false);
    }
  };

  const handleBiometric = (next: boolean) => {
    if (next) {
      setUnavailable(UNAVAILABLE.biometric);
      return;
    }
    setBiometric(false);
  };

  const handleTwoFactor = (next: boolean) => {
    if (next) {
      setUnavailable(UNAVAILABLE.twoFactor);
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

      <UnavailableModal info={unavailable} onClose={() => setUnavailable(null)} />
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

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,16,32,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(28),
  },
  card: {
    width: '100%',
    maxWidth: ms(360),
    backgroundColor: foodColors.background,
    borderRadius: ms(24),
    paddingHorizontal: ms(22),
    paddingTop: ms(28),
    paddingBottom: ms(22),
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
    backgroundColor: foodColors.primaryLight,
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
  soonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: ms(20),
    marginBottom: ms(12),
  },
  soonPillText: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
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
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});