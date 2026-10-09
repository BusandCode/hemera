import { supabase } from './supabase';

export type PublicProfile = {
  id: string;
  fullName: string;
  photoUrl: string | null;
};

/** Get any user's profile photo URL by their user ID. */
export async function getUserPhoto(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('photo_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profiles] getUserPhoto failed:', error);
    return null;
  }
  return data?.photo_url ?? null;
}

/** Get any user's name and photo by their user ID. */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profiles] getPublicProfile failed:', error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name ?? '',
    photoUrl: data.photo_url ?? null,
  };
}