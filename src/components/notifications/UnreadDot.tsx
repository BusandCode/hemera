// Red dot on the bell when the customer has unread notifications.
// Updates live (new notifications) and whenever the screen comes back into view
// (e.g. after reading them on the Notifications screen).
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function useHasUnreadNotifications() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [hasUnread, setHasUnread] = useState(false);
  // Each bell (one per tab screen) needs its own live channel name.
  const channelKey = useRef(Math.random().toString(36).slice(2)).current;

  const check = useCallback(async () => {
    if (!userId) { setHasUnread(false); return; }
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    if (!error) setHasUnread((count ?? 0) > 0);
  }, [userId]);

  useFocusEffect(useCallback(() => { void check(); }, [check]));

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`unread-dot-${userId}-${channelKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { void check(); }
      )
      .subscribe();
    const timer = setInterval(() => { void check(); }, 60000);
    return () => {
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, check, channelKey]);

  return hasUnread;
}

export function UnreadDot({ style }: { style?: StyleProp<ViewStyle> }) {
  const hasUnread = useHasUnreadNotifications();
  return hasUnread ? <View style={style} /> : null;
}
