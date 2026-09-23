import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { foodColors } from '../src/constants/foodColors';
import { useOnboarding } from '../src/context/OnboardingContext';
import { useAuth } from '../src/context/AuthContext';

export default function EntryScreen() {
  const router = useRouter();
  const { hasOnboarded, ready: onboardingReady } = useOnboarding();
  const { user, ready: authReady } = useAuth();

  useEffect(() => {
    if (!onboardingReady || !authReady) return;

    if (!hasOnboarded) {
      router.replace('/onboarding' as any);
    } else if (!user) {
      router.replace('/auth' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [onboardingReady, authReady, hasOnboarded, user]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ActivityIndicator size="large" color={foodColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: foodColors.background,
  },
});