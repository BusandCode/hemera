import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isPushSupported(): boolean {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  if (
    Platform.OS === 'android' &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return false;
  }
  return true;
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function registerPushNotifications(
  userId: string
): Promise<'registered' | 'permission-denied' | 'unsupported' | 'disabled'> {
  if (!isPushSupported()) return 'unsupported';

  const { data: settings, error: settingsError } = await supabase
    .from('notification_settings')
    .select('push_enabled')
    .eq('user_id', userId)
    .maybeSingle();
  if (settingsError) throw new Error(`Could not load push preferences: ${settingsError.message}`);
  if (settings?.push_enabled === false) return 'disabled';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Hemera notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let permissionStatus = currentPermission.status;
  if (permissionStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    permissionStatus = requestedPermission.status;
  }
  if (permissionStatus !== 'granted') return 'permission-denied';

  const projectId = getProjectId();
  if (!projectId) throw new Error('Expo project ID is missing from the app configuration.');

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;
  const { error: saveError } = await supabase
    .from('notification_push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: expoPushToken,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,expo_push_token' }
    );

  if (saveError) throw new Error(`Could not save the push token: ${saveError.message}`);
  return 'registered';
}

/**
 * Removes this device's token for the given user. Must run while the user is still
 * signed in, because the delete is protected by row-level security.
 */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  if (!isPushSupported()) return;

  const projectId = getProjectId();
  if (!projectId) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;
  const { error } = await supabase
    .from('notification_push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', expoPushToken);

  if (error) throw new Error(`Could not remove the push token: ${error.message}`);
}