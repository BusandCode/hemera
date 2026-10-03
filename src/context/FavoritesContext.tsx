import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'echop:favorites';

type FavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setFavoriteIds(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const persist = (next: string[]) => {
    setFavoriteIds(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const isFavorite = (id: string) => favoriteIds.includes(id);

  const toggleFavorite = (id: string) => {
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((f) => f !== id)
      : [...favoriteIds, id];
    persist(next);
  };

  const clearFavorites = () => persist([]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favoriteIds, isFavorite, toggleFavorite, clearFavorites }),
    [favoriteIds]
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