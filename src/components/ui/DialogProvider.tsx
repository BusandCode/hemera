import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

type Options = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: keyof typeof Feather.glyphMap;
};

type Config = Options & { kind: 'confirm' | 'alert' };

type DialogApi = {
  confirm: (options: Options) => Promise<boolean>;
  alert: (options: Options) => Promise<void>;
};

const DANGER = '#FF3B30';

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!config) return;
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [config, anim]);

  const open = useCallback(
    (next: Config) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setConfig(next);
      }),
    []
  );

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setConfig(null);
  };

  const api = useMemo<DialogApi>(
    () => ({
      confirm: (options) => open({ ...options, kind: 'confirm' }),
      alert: async (options) => {
        await open({ ...options, kind: 'alert' });
      },
    }),
    [open]
  );

  const destructive = !!config?.destructive;
  const accent = destructive ? DANGER : foodColors.primary;
  const ringBg = destructive ? 'rgba(255,59,48,0.1)' : foodColors.primaryLight;
  const icon: keyof typeof Feather.glyphMap =
    config?.icon ??
    (config?.kind === 'alert' ? 'info' : destructive ? 'alert-triangle' : 'help-circle');

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={!!config}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => close(false)}
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: anim,
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.ring, { backgroundColor: ringBg }]}>
              <View style={[styles.circle, { backgroundColor: accent }]}>
                <Feather name={icon} size={ms(24)} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>{config?.title}</Text>
            {!!config?.message && <Text style={styles.message}>{config.message}</Text>}

            <View style={styles.actions}>
              {config?.kind === 'confirm' && (
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => close(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cancelText}>{config.cancelText ?? 'Cancel'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: accent }]}
                onPress={() => close(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmText}>
                  {config?.confirmText ?? (config?.kind === 'alert' ? 'OK' : 'Confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '8%',
  },
  card: {
    width: '100%',
    backgroundColor: foodColors.surface,
    borderRadius: ms(24),
    paddingHorizontal: ms(22),
    paddingTop: ms(26),
    paddingBottom: ms(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  ring: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(16),
  },
  circle: {
    width: ms(54),
    height: ms(54),
    borderRadius: ms(27),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(20),
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginTop: ms(8),
  },
  actions: {
    flexDirection: 'row',
    gap: ms(10),
    width: '100%',
    marginTop: ms(22),
  },
  btn: {
    flex: 1,
    paddingVertical: ms(14),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: foodColors.background },
  cancelText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  confirmText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});