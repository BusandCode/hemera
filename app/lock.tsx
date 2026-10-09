import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';

import { LockScreen } from '../src/components/LockScreen';
import { useAuth } from '../src/context/AuthContext';
import { useLock } from '../src/context/LockContext';

export default function LockRoute() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { pinLoginActive } = useLock();

  const handleUnlock = () => {
    router.replace('/(tabs)' as any);
  };

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
          await signOut();
          router.replace('/auth' as any);
        },
      },
    ]);
  };

  return (
    <>
      <StatusBar style="light" />
      <LockScreen
        onUnlock={handleUnlock}
        onForgotPin={handleForgotPin}
        onSwitchAccount={handleSwitchAccount}
        hasPin={pinLoginActive}
      />
    </>
  );
}