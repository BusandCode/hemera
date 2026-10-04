
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { SplashScreenView } from '../../src/components/SplashScreenView';

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { hasOnboarded, ready } = useOnboarding();

  // Wait until we actually know the auth/onboarding state.
  if (loading || !ready) return <SplashScreenView />;

  if (!hasOnboarded) return <Redirect href={'/onboarding' as any} />;
  if (!session) return <Redirect href={'/auth' as any} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="echop" />
      <Tabs.Screen name="wash" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}