import { useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import { registerPushNotifications } from '../../lib/pushNotifications';

export function PushNotificationRegistrar() {
  const { session } = useAuth();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    registerPushNotifications(userId).catch((error: unknown) => {
      if (active) console.error('[Notifications] Push registration failed:', error);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  return null;
}
