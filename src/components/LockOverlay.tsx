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
  const { locked, signingOut, hasPin, unlock, refreshPinStatus } = useLock();
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
            unlock();
          }}
        />
      ) : (
        <LockScreen
          onUnlock={unlock}
          onForgotPin={() => setView('reset')}
          onSwitchAccount={handleSwitchAccount}
          hasPin={hasPin === true}
        />
      )}
    </View>
  );
}