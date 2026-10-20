import { requestAccountDeletion } from '../services/accountDeletion';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getPendingReferral, clearPendingReferral } from '../lib/referralLink';
import { ensureFreshInstallHandled } from '../lib/freshInstall';
import { unregisterPushNotifications } from '../lib/pushNotifications';

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
  displayName: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (details: SignUpDetails) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string, reason: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUSH_CLEANUP_TIMEOUT_MS = 3000;

/**
 * True when the server says this session/user no longer exists
 * (account deleted, sessions revoked). Network errors return false
 * so offline users are NOT signed out.
 */
function isDeadSessionError(error: AuthError | null): boolean {
  if (!error) return false;
  const code = ((error as any).code ?? '').toString();
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.status === 401 ||
    error.status === 403 ||
    code === 'user_not_found' ||
    code === 'user_banned' ||
    code === 'session_not_found' ||
    code === 'refresh_token_not_found' ||
    code === 'bad_jwt' ||
    msg.includes('user from sub claim') ||
    msg.includes('session not found') ||
    msg.includes('invalid refresh token')
  );
}

/**
 * Stops this device receiving the user's pushes. Best effort: it never throws and
 * never waits longer than the timeout, so sign-out is not held up by a bad network.
 */
async function removeDevicePushToken(userId: string | undefined): Promise<void> {
  if (!userId) return;
  try {
    await Promise.race([
      unregisterPushNotifications(userId),
      new Promise<void>((resolve) => setTimeout(resolve, PUSH_CLEANUP_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.warn('[Auth] Could not remove push token on sign-out:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session + auth listener
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      await ensureFreshInstallHandled();
      if (!active) return;

      const {
        data: { session: stored },
      } = await supabase.auth.getSession();
      if (!active) return;

      // Make sure the stored session still belongs to a real user before showing the app.
      if (stored) {
        const { error } = await supabase.auth.getUser();
        if (!active) return;
        if (isDeadSessionError(error)) {
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
        } else {
          setSession(stored);
        }
      } else {
        setSession(null);
      }
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

  // Re-check whenever the app returns to the foreground.
  useEffect(() => {
    if (!session) return;

    const check = async () => {
      const { error } = await supabase.auth.getUser();
      if (isDeadSessionError(error)) {
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [session?.user.id]);

  // Errors are re-thrown as-is so the auth screen can read error.code / error.status.

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
    if (error) throw error;

    // With email confirmation on, Supabase returns a fake user with no identities
    // (and no error) when the email is already registered.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const err = new Error('User already registered') as Error & { code?: string };
      err.code = 'user_already_exists';
      throw err;
    }

    await clearPendingReferral();
    setSession(data.session);
    return !!data.session;
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
    if (!data.session) {
      const err = new Error('Token has expired or is invalid') as Error & { code?: string };
      err.code = 'otp_expired';
      throw err;
    }
    setSession(data.session);
  };

  const resendOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  };

  const signOut = async () => {
    // Must happen while still signed in, so the token delete passes row-level security.
    await removeDevicePushToken(session?.user.id);

    const { error } = await supabase.auth.signOut();
    if (error) {
      // Server-side session already gone (deleted user, revoked session) or offline:
      // still clear it on this device so the user isn't stuck.
      console.warn('[Auth] global sign-out failed, signing out locally:', error);
      await supabase.auth.signOut({ scope: 'local' });
    }
    setSession(null);
  };

  const deleteAccount = async (password: string, reason: string) => {
    const userId = session?.user?.id;
    if (!userId) throw new Error('No active session');

    // The server verifies the password, re-checks every deletion restriction under a
    // lock, marks the account deleted, and revokes all sessions. Throws AccountDeletionError.
    await requestAccountDeletion(password, reason.trim());

    try {
      await removeDevicePushToken(userId);
    } catch {
      // best effort: the account is already deleted and its sessions revoked
    }

    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
  };

  const displayName: string =
    (session?.user?.user_metadata?.full_name as string | undefined)?.trim() ?? '';

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        displayName,
        signIn,
        signUp,
        verifyOtp,
        resendOtp,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
