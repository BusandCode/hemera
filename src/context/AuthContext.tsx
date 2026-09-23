import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'echop-ewash:user';

export type User = {
  name: string;
  email: string;
  phone?: string;
};

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setUser(raw ? (JSON.parse(raw) as User) : null);
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = async (next: User) => {
    setUser(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn: async (email, _password) => {
        await persist({
          name: email.split('@')[0] || 'Friend',
          email,
        });
      },
      signUp: async (name, email, _password) => {
        await persist({ name, email });
      },
      signOut: async () => {
        setUser(null);
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {}
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}