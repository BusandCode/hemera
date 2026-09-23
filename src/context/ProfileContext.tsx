import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  photoUri: string | null;
};

type ProfileContextValue = {
  profile: Profile;
  updateProfile: (next: Partial<Profile>) => void;
};

const DEFAULT_PROFILE: Profile = {
  fullName: 'Suleiman Abubakar',
  email: 'suleiman@example.com',
  phone: '+234 803 123 4567',
  gender: 'Male',
  dob: '14 March 1998',
  photoUri: null,
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      updateProfile: (next) => setProfile((prev) => ({ ...prev, ...next })),
    }),
    [profile]
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