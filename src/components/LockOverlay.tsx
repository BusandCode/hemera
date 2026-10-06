import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, View, StyleSheet } from 'react-native';

import { LockScreen } from './LockScreen';
import { useLock } from '../context/LockContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function LockOverlay() {
  const router = useRouter();
  const { locked, unlock } = useLock();
  const { signOut, session } = useAuth();
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!locked) {
      setHasPin(null);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.rpc('has_pin');
        setHasPin(data === true);
      } catch {
        setHasPin(false);
      }
    })();
  }, [locked, session?.user.id]);

  if (!locked) return null;
  if (hasPin === null) return null;   // still checking — render nothing yet

  const handleUnlock = () => unlock();

  const handleForgotPin = () => {
    router.push('/reset-pin' as any);
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
      <LockScreen
        onUnlock={handleUnlock}
        onForgotPin={handleForgotPin}
        onSwitchAccount={handleSwitchAccount}
        hasPin={hasPin}
      />
    </View>
  );
}