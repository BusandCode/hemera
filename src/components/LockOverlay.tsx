import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, View, StyleSheet } from 'react-native';

import { LockScreen } from './LockScreen';
import { ResetPinFlow } from './ResetPinFlow';
import { useLock } from '../context/LockContext';
import { useAuth } from '../context/AuthContext';
import { foodColors } from '../constants/foodColors';

export function LockOverlay() {
  const router = useRouter();
  const { locked, signingOut, pinLoginActive, pinStatusReady, unlock, refreshPinStatus } =
    useLock();
  const { signOut } = useAuth();
  const [view, setView] = useState<'lock' | 'reset'>('lock');

  // Always start on the lock screen each time the app locks.
  useEffect(() => {
    if (!locked) setView('lock');
  }, [locked]);

  if (signingOut) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: foodColors.background }]} />;
  }
  if (!locked) return null;

  // Hold a blank screen until we know whether this user has a PIN, so the lock
  // screen never opens in password mode and then jumps to PIN mode.
  if (!pinStatusReady) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: foodColors.background }]} />;
  }

  // Navigate home while the overlay still covers the screen, then reveal it.
  const goHomeAndUnlock = () => {
    try {
      if (router.canDismiss()) router.dismissAll();
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.warn('[LockOverlay] Could not navigate home after unlock:', error);
    }
    unlock();
  };

  const handleSwitchAccount = () => {
    Alert.alert('Switch account', 'This will sign you out. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          unlock();
          await signOut();
          router.replace('/auth' as any);
        },
      },
    ]);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {view === 'reset' ? (
        <ResetPinFlow
          onCancel={() => setView('lock')}
          onDone={() => {
            // Password was verified and a new PIN set, so it's safe to unlock.
            refreshPinStatus();
            goHomeAndUnlock();
          }}
        />
      ) : (
        <LockScreen
          key={pinLoginActive ? 'pin' : 'password'}
          onUnlock={goHomeAndUnlock}
          onForgotPin={() => setView('reset')}
          onSwitchAccount={handleSwitchAccount}
          hasPin={pinLoginActive}
        />
      )}
    </View>
  );
}