import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'echop-ewash:onboarded';

type OnboardingContextValue = {
  hasOnboarded: boolean;
  ready: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        setHasOnboarded(stored === 'true');
      } catch {
        setHasOnboarded(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      hasOnboarded,
      ready,
      completeOnboarding: async () => {
        setHasOnboarded(true);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, 'true');
        } catch {}
      },
      resetOnboarding: async () => {
        setHasOnboarded(false);
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {}
      },
    }),
    [hasOnboarded, ready]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used inside an OnboardingProvider');
  }
  return ctx;
}