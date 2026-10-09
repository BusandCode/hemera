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
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Profile = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  photoUri: string | null;
  referralCode: string;
};

type ProfileContextValue = {
  profile: Profile;
  loading: boolean;
  uploadingPhoto: boolean;
  /** Throws on failure so screens can show the error. */
  updateProfile: (next: Partial<Profile>) => Promise<void>;
};

const EMPTY_PROFILE: Profile = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  photoUri: null,
  referralCode: '',
};

const AVATAR_BUCKET = 'avatars';

/** URIs that only exist on this device and must be uploaded first. */
const isLocalUri = (uri: string) => /^(file|content|ph|assets-library|data):/i.test(uri);

function guessImageType(uri: string): { ext: string; contentType: string } {
  if (uri.startsWith('data:')) {
    const mime = uri.slice(5, uri.indexOf(';')) || 'image/jpeg';
    const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1] || 'jpg';
    return { ext, contentType: mime };
  }
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return { ext: 'png', contentType: 'image/png' };
    case 'webp':
      return { ext: 'webp', contentType: 'image/webp' };
    case 'heic':
    case 'heif':
      return { ext: 'heic', contentType: 'image/heic' };
    default:
      return { ext: 'jpg', contentType: 'image/jpeg' };
  }
}

/** Removes every file in the user's avatar folder. Best-effort. */
async function removeAvatarFiles(userId: string) {
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  if (error || !data?.length) return;
  await supabase.storage.from(AVATAR_BUCKET).remove(data.map((f) => `${userId}/${f.name}`));
}

/** Uploads a local image and returns its public URL. */
async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const { ext, contentType } = guessImageType(localUri);

  const res = await fetch(localUri);
  const body = await res.arrayBuffer();
  if (!body.byteLength) throw new Error('Could not read the selected image. Please try another photo.');

  // Clear any old avatar (e.g. avatar.png when uploading avatar.jpg).
  await removeAvatarFiles(userId);

  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, body, { contentType, upsert: true, cacheControl: '3600' });

  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  // Cache-buster so the new photo shows immediately instead of the cached old one.
  return `${data.publicUrl}?v=${Date.now()}`;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (!userId) {
      setProfile(EMPTY_PROFILE);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const meta = (session?.user.user_metadata ?? {}) as Record<string, string | undefined>;

    setProfile({
      fullName: meta.full_name?.trim() ?? '',
      email: session?.user.email ?? '',
      phone: meta.phone ?? '',
      gender: meta.gender ?? '',
      photoUri: null,
      referralCode: '',
    });

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, gender, photo_url, referral_code')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn('[Profile] fetch error:', error);
      }

      if (data) {
        // Old rows may still hold device-only file:// paths; ignore those.
        const photo = data.photo_url && !isLocalUri(data.photo_url) ? data.photo_url : null;

        setProfile((prev) => ({
          fullName: data.full_name || prev.fullName,
          email: session?.user.email ?? prev.email,
          phone: data.phone || prev.phone,
          gender: data.gender || prev.gender,
          photoUri: photo,
          referralCode: data.referral_code ?? '',
        }));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateProfile = useCallback(
    async (next: Partial<Profile>) => {
      if (!userId) return;

      const previous = profileRef.current;
      // Optimistic: shows the picked photo right away while it uploads.
      setProfile((prev) => ({ ...prev, ...next }));

      let photoUrl = next.photoUri;
      const photoChanging = next.photoUri !== undefined;

      try {
        if (photoChanging) {
          if (photoUrl && isLocalUri(photoUrl)) {
            setUploadingPhoto(true);
            photoUrl = await uploadAvatar(userId, photoUrl);
          } else if (photoUrl === null) {
            await removeAvatarFiles(userId);
          }
        }

        const patch = {
          ...(next.fullName !== undefined && { full_name: next.fullName }),
          ...(next.phone !== undefined && { phone: next.phone }),
          ...(next.gender !== undefined && { gender: next.gender }),
          ...(photoChanging && { photo_url: photoUrl ?? null }),
        };

        if (Object.keys(patch).length > 0) {
          const { data, error } = await supabase
            .from('profiles')
            .update(patch)
            .eq('id', userId)
            .select('id');

          if (error) throw error;
          if (!data?.length) {
            throw new Error('Your profile could not be found. Please sign out and sign in again.');
          }
        }

        if (photoChanging) {
          setProfile((prev) => ({ ...prev, photoUri: photoUrl ?? null }));
        }
      } catch (e) {
        console.warn('[Profile] update error:', e);
        setProfile(previous);
        throw e;
      } finally {
        setUploadingPhoto(false);
      }
    },
    [userId]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, loading, uploadingPhoto, updateProfile }),
    [profile, loading, uploadingPhoto, updateProfile]
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