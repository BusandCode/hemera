import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../../context/AuthContext';
import { registerPushNotifications } from '../../lib/pushNotifications';

let lastOpenedPush = '';   // the same tap is never opened twice

export function PushNotificationRegistrar() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const router = useRouter();

  // Tapping a push opens that notification (or the order it is about, or the list).
  useEffect(() => {
    if (!userId) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const key = response.notification.request.identifier;
      if (key && key === lastOpenedPush) return;
      lastOpenedPush = key;
      const data: any = response.notification.request.content.data ?? {};
      const notificationId = data.notification_id ?? data.notificationId ?? (data.record && data.record.id);
      setTimeout(() => {
        if (notificationId) router.push({ pathname: '/notification-details', params: { id: String(notificationId) } } as any);
        else if (data.order_id) router.push({ pathname: '/order-details', params: { id: String(data.order_id) } } as any);
        else router.push('/notification' as any);
      }, 300);
    };
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [userId, router]);

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
