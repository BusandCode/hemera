import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getPendingReferral, clearPendingReferral } from '../lib/referralLink';
import { ensureFreshInstallHandled } from '../lib/freshInstall';

type SignUpDetails = {
  fullName: string;
  gender: string;
  phone: string;
  referredBy: string;
  email: string;
  password: string;
};

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  /** Best available display name: profile metadata saved at sign-up. */
  displayName: string;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves true if the user is signed in now, false if they must confirm their email first. */
  signUp: (details: SignUpDetails) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      // On a fresh install, clear any login left over from before the app was deleted.
      await ensureFreshInstallHandled();
      if (!active) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      setSession(session);
      setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    // Set it right away so the tabs guard sees the session on the very next render.
    setSession(data.session);
  };

  const signUp = async ({ fullName, gender, phone, referredBy, email, password }: SignUpDetails) => {
    const pending = await getPendingReferral();
    const referral = (referredBy || pending || '').trim().toUpperCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, gender, phone, referred_by: referral } },
    });
    if (error) throw new Error(error.message);
    await clearPendingReferral();
    // With "Confirm email" on in Supabase, no session is returned until the user verifies.
    setSession(data.session);
    return !!data.session;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setSession(null);
  };

  const displayName: string =
    (session?.user?.user_metadata?.full_name as string | undefined)?.trim() ?? '';

  return (
    <AuthContext.Provider value={{ session, loading, displayName, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}