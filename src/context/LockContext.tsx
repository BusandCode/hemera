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

// How long the user must be away from the app before it locks.
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

  // When the user left the app (null = they haven't left).
  const leftAtRef = useRef<number | null>(null);
  // Mirror of `locked` so the AppState listener never needs to be re-attached.
  const lockedRef = useRef(false);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  const lockNow = useCallback(() => {
    leftAtRef.current = null;
    setLocked(true);
  }, []);

  const unlock = useCallback(() => {
    leftAtRef.current = null;
    setLocked(false);
  }, []);

  useEffect(() => {
    // Never lock when there's no signed-in user.
    if (!session) {
      leftAtRef.current = null;
      setLocked(false);
      return;
    }

    const handle = (next: AppStateStatus) => {
      // 'inactive' is ignored on purpose: on iOS it also fires for Face ID prompts,
      // permission dialogs, the share sheet and the app switcher, none of which mean
      // the user actually left. Going home / switching apps always reaches 'background'.
      if (next === 'background') {
        // Start the clock once, and not while already locked.
        if (!lockedRef.current && leftAtRef.current === null) {
          leftAtRef.current = Date.now();
        }
        return;
      }

      if (next === 'active') {
        const leftAt = leftAtRef.current;
        leftAtRef.current = null;

        // Coming back early does nothing. Only lock if they were away the full time.
        if (leftAt !== null && !lockedRef.current && Date.now() - leftAt >= LOCK_AFTER_MS) {
          setLocked(true);
        }
      }
    };

    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, [session]);

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