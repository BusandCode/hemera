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

import { useAuth } from './AuthContext';

// How long the app must stay backgrounded before the lock kicks in.
export const LOCK_AFTER_MS = 20_000;

type LockContextValue = {
  locked: boolean;
  unlock: () => void;
  lockNow: () => void;
};

const LockContext = createContext<LockContextValue | undefined>(undefined);

export function LockProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [locked, setLocked] = useState(false);
  const backgroundAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const lockNow = useCallback(() => {
    clearTimer();
    setLocked(true);
  }, []);

  const unlock = useCallback(() => {
    clearTimer();
    backgroundAtRef.current = null;
    setLocked(false);
  }, []);

  useEffect(() => {
    // Never lock when there's no signed-in user.
    if (!session) {
      setLocked(false);
      clearTimer();
      backgroundAtRef.current = null;
      return;
    }

    const handle = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        // Record when we left, but only if we weren't already locked.
        if (!locked) {
          backgroundAtRef.current = Date.now();
        }
        return;
      }

      if (next === 'active') {
        // If we were away long enough, lock.
        if (backgroundAtRef.current && !locked) {
          const away = Date.now() - backgroundAtRef.current;
          if (away >= LOCK_AFTER_MS) {
            setLocked(true);
          }
        }
        backgroundAtRef.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handle);

    // Also arm a timer so we lock even if the user never foregrounds — this
    // matters when the OS reports 'background' but the process stays alive.
    const armOnBackground = AppState.addEventListener('change', (s) => {
      if (s !== 'background' && s !== 'inactive') return;
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (session) setLocked(true);
      }, LOCK_AFTER_MS);
    });

    return () => {
      sub.remove();
      armOnBackground.remove();
      clearTimer();
    };
  }, [session, locked]);

  const value = useMemo<LockContextValue>(
    () => ({ locked, unlock, lockNow }),
    [locked, unlock, lockNow]
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used inside LockProvider');
  return ctx;
}