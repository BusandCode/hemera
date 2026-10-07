import { useRouter } from 'expo-router';

import { ResetPinFlow } from '../src/components/ResetPinFlow';
import { useLock } from '../src/context/LockContext';

export default function ResetPinScreen() {
  const router = useRouter();
  const { refreshPinStatus } = useLock();

  return (
    <ResetPinFlow
      onCancel={() => router.back()}
      onDone={() => {
        refreshPinStatus();
        router.replace('/(tabs)' as any);
      }}
    />
  );
}