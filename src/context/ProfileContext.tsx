import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  photoUri: string | null;
  referralCode: string;
};

type ProfileContextValue = {
  profile: Profile;
  loading: boolean;
  updateProfile: (next: Partial<Profile>) => Promise<void>;
};

const EMPTY_PROFILE: Profile = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  dob: '',
  photoUri: null,
  referralCode: '',
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfile(EMPTY_PROFILE);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, gender, dob, photo_url, referral_code')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile({
          fullName: data.full_name ?? '',
          email: session?.user.email ?? '',
          phone: data.phone ?? '',
          gender: data.gender ?? '',
          dob: data.dob ?? '',
          photoUri: data.photo_url,
          referralCode: data.referral_code ?? '',
        });
      }
      setLoading(false);
    })();
  }, [userId]);

  const updateProfile = async (next: Partial<Profile>) => {
    if (!userId) return;
    setProfile((prev) => ({ ...prev, ...next }));

    const { error } = await supabase
      .from('profiles')
      .update({
        ...(next.fullName !== undefined && { full_name: next.fullName }),
        ...(next.phone !== undefined && { phone: next.phone }),
        ...(next.gender !== undefined && { gender: next.gender }),
        ...(next.dob !== undefined && { dob: next.dob }),
        ...(next.photoUri !== undefined && { photo_url: next.photoUri }),
      })
      .eq('id', userId);

    if (error) {
      console.log('profile update error:', error);
    }
  };

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, loading, updateProfile }),
    [profile, loading]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used inside a ProfileProvider');
  }
  return ctx;
}