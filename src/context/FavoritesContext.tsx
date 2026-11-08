// Favourite restaurants (the heart). Saved in the database (store_favorites) for signed-in customers,
// so they follow the account to any phone and power Thrud's "Following" tab. A copy is kept on the
// phone so the hearts show instantly and work offline; the database is the source of truth.
// Favourites saved on the phone before this update are uploaded once, on first sign-in.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'echop:favorites';
const SYNCED_KEY = (uid: string) => `echop:favorites:synced:${uid}`;

type FavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

async function readLocal(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const list = stored ? JSON.parse(stored) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
function writeLocal(ids: string[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const idsRef = useRef<string[]>([]);
  const prevUser = useRef<string | null | undefined>(undefined);

  const set = useCallback((next: string[]) => {
    idsRef.current = next;
    setFavoriteIds(next);
    writeLocal(next);
  }, []);

  // Load from the database (signed in) or the phone (signed out).
  // mergeLocal: also upload hearts saved on this phone while signed out (not another account's).
  const load = useCallback(async (uid: string | null, mergeLocal = true) => {
    if (!uid) { set(await readLocal()); return; }
    const local = mergeLocal ? await readLocal() : [];
    const { data, error } = await supabase.from('store_favorites').select('store_id').eq('user_id', uid);
    if (error) { set(local); return; }   // offline: keep what's on the phone
    const remote = ((data ?? []) as { store_id: string }[]).map((r) => r.store_id);

    // First time on this account: upload favourites that were only on the phone.
    let synced = false;
    try { synced = (await AsyncStorage.getItem(SYNCED_KEY(uid))) === '1'; } catch {}
    if (!synced && mergeLocal) {
      const missing = local.filter((id) => !remote.includes(id));
      if (missing.length) {
        const { error: upErr } = await supabase
          .from('store_favorites')
          .upsert(missing.map((store_id) => ({ user_id: uid, store_id })), { onConflict: 'user_id,store_id', ignoreDuplicates: true });
        if (!upErr) remote.push(...missing);
      }
      AsyncStorage.setItem(SYNCED_KEY(uid), '1').catch(() => {});
    }
    set(remote);
  }, [set]);

  useEffect(() => {
    const prev = prevUser.current;
    prevUser.current = userId;
    if (prev === undefined) { void load(userId); return; }         // app start
    if (prev === userId) return;
    if (prev) {
      // Signed out or switched account: the previous person's hearts leave this phone.
      set([]);
      if (userId) void load(userId, false);
      return;
    }
    void load(userId);                                             // signed in after browsing signed out
  }, [userId, load, set]);

  // Coming back to the app picks up changes made on another phone.
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void load(userId); });
    return () => sub.remove();
  }, [userId, load]);

  const isFavorite = useCallback((id: string) => idsRef.current.includes(id), [favoriteIds]);   // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFavorite = useCallback((id: string) => {
    const had = idsRef.current.includes(id);
    const next = had ? idsRef.current.filter((f) => f !== id) : [...idsRef.current, id];
    set(next);                                   // instant on screen
    if (!userId) return;
    void (async () => {
      const { error } = had
        ? await supabase.from('store_favorites').delete().eq('user_id', userId).eq('store_id', id)
        : await supabase.from('store_favorites').upsert({ user_id: userId, store_id: id }, { onConflict: 'user_id,store_id', ignoreDuplicates: true });
      if (error) {
        // Put it back the way it was so the heart matches what's saved.
        const cur = idsRef.current;
        set(had ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((f) => f !== id));
      }
    })();
  }, [userId, set]);

  const clearFavorites = useCallback(() => {
    const ids = idsRef.current;
    set([]);
    if (userId && ids.length) {
      void supabase.from('store_favorites').delete().eq('user_id', userId).in('store_id', ids);
    }
  }, [userId, set]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favoriteIds, isFavorite, toggleFavorite, clearFavorites }),
    [favoriteIds, isFavorite, toggleFavorite, clearFavorites]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used inside a FavoritesProvider');
  }
  return ctx;
}
