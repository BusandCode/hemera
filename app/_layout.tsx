import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';

import { LocationProvider } from '../src/context/LocationContext';
import { CartProvider } from '../src/context/CartContext';
import { AppDataProvider } from '../src/context/AppDataContext';
import { ProfileProvider } from '../src/context/ProfileContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { EPlanDraftProvider } from '../src/context/EPlanDraftContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { ReferralProvider } from '../src/context/ReferralContext';
import { LockProvider, useLock } from '../src/context/LockContext';
import { ReferralRewardPrompt } from '../src/components/referral/ReferralRewardPrompt';
import { LockOverlay } from '../src/components/LockOverlay';
import { SplashScreenView } from '../src/components/SplashScreenView';
import { capturePendingReferral } from '../src/lib/referralLink';

SplashScreen.preventAutoHideAsync().catch(() => {});

function SplashGate() {
  const { ready } = useOnboarding();
  const { session, loading } = useAuth();
  const { locked, signingOut } = useLock();
  const [done, setDone] = useState(false);

  const settled = ready && !loading && (!session || locked || signingOut);

  useEffect(() => {
    if (settled) setDone(true);
  }, [settled]);

  if (done) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <SplashScreenView />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    PlayfairDisplay_500Medium,
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then(capturePendingReferral);
    const sub = Linking.addEventListener('url', ({ url }) => capturePendingReferral(url));
    return () => sub.remove();
  }, []);

  const fontsReady = fontsLoaded || !!fontError;

  return (
    <View style={styles.root}>
      {fontsReady && (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <OnboardingProvider>
              <AuthProvider>
                <LocationProvider>
                  <CartProvider>
                    <AppDataProvider>
                      <ProfileProvider>
                        <ReferralProvider>
                          <EPlanDraftProvider>
                            <FavoritesProvider>
                              <LockProvider>
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

                                  <Stack.Screen
                                    name="forgot-password"
                                    options={{
                                      presentation: 'card',
                                      animation: 'slide_from_right',
                                    }}
                                  />

                                  <Stack.Screen name="(tabs)" />

                                  <Stack.Screen
                                    name="location-picker"
                                    options={{ presentation: 'modal' }}
                                  />

                                  <Stack.Screen name="checkout" />

                                  <Stack.Screen
                                    name="order-success"
                                    options={{ gestureEnabled: false }}
                                  />

                                  <Stack.Screen name="wallet" />

                                  <Stack.Screen name="fund-wallet-amount" />

                                  <Stack.Screen
                                    name="fund-wallet-account"
                                    options={{ gestureEnabled: false }}
                                  />

                                  <Stack.Screen name="request-withdrawal" />
                                  <Stack.Screen name="confirm-withdrawal" />

                                  <Stack.Screen name="e-plan" options={{ animation: 'none' }} />

                                  <Stack.Screen name="e-plan-setup" options={{ animation: 'none' }} />

                                  <Stack.Screen name="e-plan-exclusions" />
                                  <Stack.Screen name="e-plan-review" />

                                  <Stack.Screen
                                    name="e-plan-success"
                                    options={{ gestureEnabled: false }}
                                  />

                                  <Stack.Screen name="my-plan" options={{ animation: 'none' }} />

                                  <Stack.Screen name="payments" options={{ animation: 'none' }} />

                                  <Stack.Screen name="eplan-transaction" />
                                  <Stack.Screen name="quality-promise" />
                                  <Stack.Screen name="offers" />
                                  <Stack.Screen name="track-order" />
                                  <Stack.Screen name="confirm-schedule" />
                                  <Stack.Screen name="lock" />
                                  <Stack.Screen name="reset-pin" />
                                </Stack>

                                <ReferralRewardPrompt />
                                <LockOverlay />
                                <SplashGate />
                              </LockProvider>
                            </FavoritesProvider>
                          </EPlanDraftProvider>
                        </ReferralProvider>
                      </ProfileProvider>
                    </AppDataProvider>
                  </CartProvider>
                </LocationProvider>
              </AuthProvider>
            </OnboardingProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      )}

      {!fontsReady && (
        <View style={StyleSheet.absoluteFill}>
          <SplashScreenView />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1020' },
});