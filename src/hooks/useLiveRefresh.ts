// Keeps a screen up to date while it is open: reloads when something changes in the database
// (live updates), when the app comes back to the front, and every 20 seconds as a fallback.
// Example: a restaurant accepts your order → the order list updates by itself.
import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';

let channelSeq = 0;

export function useLiveRefresh(load: () => unknown, tables: string[] = [], everyMs = 20_000) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const key = tables.join(',');

  useFocusEffect(
    useCallback(() => {
      let pending: ReturnType<typeof setTimeout> | null = null;
      // Many changes at once (e.g. a checkout) → one reload.
      const run = () => {
        if (pending) return;
        pending = setTimeout(() => {
          pending = null;
          try { void Promise.resolve(loadRef.current()).catch(() => {}); } catch {}
        }, 400);
      };

      const timer = setInterval(() => {
        if (AppState.currentState === 'active') run();
      }, everyMs);
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') run();
      });

      const names = key ? key.split(',') : [];
      const channel = names.length ? supabase.channel(`live-${key}-${++channelSeq}`) : null;
      if (channel) {
        for (const table of names) {
          channel.on('postgres_changes' as any, { event: '*', schema: 'public', table }, run);
        }
        channel.subscribe();
      }

      return () => {
        clearInterval(timer);
        sub.remove();
        if (pending) clearTimeout(pending);
        if (channel) supabase.removeChannel(channel);
      };
    }, [key, everyMs]),
  );
}
