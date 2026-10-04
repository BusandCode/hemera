import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../src/context/OnboardingContext';
import { useAuth } from '../src/context/AuthContext';
import { SplashScreenView } from '../src/components/SplashScreenView';

const MIN_SPLASH_MS = 1600;

export default function EntryScreen() {
  const router = useRouter();
  const { hasOnboarded, ready: onboardingReady } = useOnboarding();
  const { session, loading: authLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!onboardingReady || authLoading || !minTimeElapsed) return;

    if (!hasOnboarded) {
      router.replace('/onboarding' as any);
    } else if (!session) {
      router.replace('/auth' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [onboardingReady, authLoading, hasOnboarded, session, minTimeElapsed]);

  return <SplashScreenView />;
}