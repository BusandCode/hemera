import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';

import { LocationProvider } from '../src/context/LocationContext';
import { CartProvider } from '../src/context/CartContext';
import { AppDataProvider } from '../src/context/AppDataContext';
import { ProfileProvider } from '../src/context/ProfileContext';
import { OnboardingProvider } from '../src/context/OnboardingContext';
import { AuthProvider } from '../src/context/AuthContext';
import { EPlanDraftProvider } from '../src/context/EPlanDraftContext';
import { SplashScreenView } from '../src/components/SplashScreenView';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  // Hide the native splash immediately — our own SplashScreenView takes over
  // as the visible loading screen from here, instead of the native splash
  // just going straight to the app before fonts are ready.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!fontsLoaded && !fontError) {
    return <SplashScreenView />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <AuthProvider>
            <LocationProvider>
              <CartProvider>
                <AppDataProvider>
                  <ProfileProvider>
                    <EPlanDraftProvider>
                      <StatusBar style="dark" />
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          presentation: 'card',
                          animation: 'slide_from_right',
                        }}
                      >
                        <Stack.Screen name="onboarding" />
                        <Stack.Screen name="auth" />
                        <Stack.Screen name="(tabs)" />

                        {/* Modal — a temporary picker that should slide over the current screen */}
                        <Stack.Screen
                          name="location-picker"
                          options={{ presentation: 'modal' }}
                        />

                        <Stack.Screen name="checkout" />
                        <Stack.Screen
                          name="order-success"
                          options={{ gestureEnabled: false }}
                        />

                        {/* Wallet home — plain push */}
                        <Stack.Screen name="wallet" />

                        {/* Wallet funding flow — full-screen pushes, not modals */}
                        <Stack.Screen name="fund-wallet-amount" />
                        <Stack.Screen
                          name="fund-wallet-account"
                          options={{ gestureEnabled: false }}
                        />

                        {/* Withdrawal flow — full-screen pushes */}
                        <Stack.Screen name="request-withdrawal" />
                        <Stack.Screen name="confirm-withdrawal" />

                        {/* E-Plan flow — full-screen pushes */}
                        <Stack.Screen name="e-plan" />
                        <Stack.Screen name="e-plan-setup" />
                        <Stack.Screen name="e-plan-exclusions" />
                        <Stack.Screen name="e-plan-review" />
                        <Stack.Screen
                          name="e-plan-success"
                          options={{ gestureEnabled: false }}
                        />
                        <Stack.Screen name="my-plan" />
                      </Stack>
                    </EPlanDraftProvider>
                  </ProfileProvider>
                </AppDataProvider>
              </CartProvider>
            </LocationProvider>
          </AuthProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
