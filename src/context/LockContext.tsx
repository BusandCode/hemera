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
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

/** Away this long → lock screen (PIN / password). */
export const LOCK_AFTER_MS = 20 * 1000;

/** Away this long → full sign-out (email + password on the auth screen). */
export const SIGN_OUT_AFTER_MS = 5 * 24 * 60 * 60 * 1000;

// When the user last left the app. Survives the OS killing the app.
const LEFT_AT_KEY = 'hemera.leftAt';

type LockContextValue = {
  locked: boolean;
  /** True while an inactivity sign-out is in progress (overlay hides the app). */
  signingOut: boolean;
  /** null = not known yet (lock screen falls back to password). */
  hasPin: boolean | null;
  /** True only when a PIN exists and the user turned Login with PIN on. */
  pinLoginActive: boolean;
  unlock: () => void;
  lockNow: () => void;
  /** Call after the user sets or removes a PIN, or changes the Login with PIN toggle. */
  refreshPinStatus: () => Promise<void>;
  /** Call right before opening the camera, image picker, payment browser etc.
   *  so coming back from it doesn't show the lock screen. */
  skipNextLock: () => void;
};

const LockContext = createContext<LockContextValue | undefined>(undefined);

export function LockProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();
  const userId = session?.user.id ?? null;

  const [locked, setLocked] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pinLoginEnabled, setPinLoginEnabled] = useState(false);

  const leftAtRef = useRef<number | null>(null);
  const skipNextRef = useRef(false);
  const bootHandledRef = useRef(false);

  const refreshPinStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_pin_status');
      if (error) throw error;
      const exists = data?.has_pin === true;
      setHasPin(exists);
      setPinLoginEnabled(exists && data?.pin_login_enabled === true);
    } catch {
      // Offline etc. — keep the last known value.
    }
  }, []);

  const lockNow = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);
  const skipNextLock = useCallback(() => {
    skipNextRef.current = true;
  }, []);

  const expireSession = useCallback(async () => {
    setSigningOut(true);
    setLocked(false);
    try {
      await signOut();
    } catch {
      // Network sign-out failed (e.g. offline) — still clear the local session.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
    try {
      router.replace('/auth' as any);
    } catch {
      // Navigator not ready yet (very early on launch) — the auth guard handles it.
    }
    setSigningOut(false);
  }, [signOut, router]);

  const expireRef = useRef(expireSession);
  expireRef.current = expireSession;

  // App launch: a saved session was restored → lock, or sign out if away 5+ days.
  // Runs once, so signing in normally later does NOT show the lock screen.
  useEffect(() => {
    if (loading || bootHandledRef.current) return;
    bootHandledRef.current = true;
    if (!session) return;

    setLocked(true);
    (async () => {
      const raw = await AsyncStorage.getItem(LEFT_AT_KEY).catch(() => null);
      await AsyncStorage.removeItem(LEFT_AT_KEY).catch(() => {});
      const leftAt = Number(raw);
      if (raw && Number.isFinite(leftAt) && Date.now() - leftAt >= SIGN_OUT_AFTER_MS) {
        expireRef.current();
      }
    })();
  }, [loading, session]);

  // While signed in: lock when the user comes back after being away 20+ seconds.
  useEffect(() => {
    if (!userId) {
      leftAtRef.current = null;
      skipNextRef.current = false;
      setHasPin(null);
      setPinLoginEnabled(false);
      setLocked(false);
      AsyncStorage.removeItem(LEFT_AT_KEY).catch(() => {});
      return;
    }

    refreshPinStatus();

    const handle = (next: AppStateStatus) => {
      // 'inactive' is ignored on purpose (Face ID, permission dialogs, pulling down
      // the notification shade on iOS). Minimizing or switching apps reaches 'background'.
      if (next === 'background') {
        if (leftAtRef.current === null) {
          const now = Date.now();
          leftAtRef.current = now;
          AsyncStorage.setItem(LEFT_AT_KEY, String(now)).catch(() => {});
        }
        refreshPinStatus();
        return;
      }

      if (next === 'active') {
        const leftAt = leftAtRef.current;
        const skip = skipNextRef.current;
        leftAtRef.current = null;
        skipNextRef.current = false;
        AsyncStorage.removeItem(LEFT_AT_KEY).catch(() => {});

        if (leftAt !== null) {
          const away = Date.now() - leftAt;
          if (away >= SIGN_OUT_AFTER_MS) {
            expireRef.current();
            return;
          }
          if (away >= LOCK_AFTER_MS && !skip) setLocked(true);
        }
        refreshPinStatus(); // pick up a PIN or toggle change made elsewhere
      }
    };

    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, [userId, refreshPinStatus]);

  const pinLoginActive = hasPin === true && pinLoginEnabled;

  const value = useMemo<LockContextValue>(
    () => ({
      locked,
      signingOut,
      hasPin,
      pinLoginActive,
      unlock,
      lockNow,
      refreshPinStatus,
      skipNextLock,
    }),
    [locked, signingOut, hasPin, pinLoginActive, unlock, lockNow, refreshPinStatus, skipNextLock]
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used inside LockProvider');
  return ctx;
}