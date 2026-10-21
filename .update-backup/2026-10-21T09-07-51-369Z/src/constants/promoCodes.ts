import { supabase } from '../lib/supabase';

export type PromoCode = {
  code: string;
  percent: number;
  label: string;
};

/**
 * Fetches a promo code from the admin-managed public.promo_codes table.
 * Returns null when the code doesn't exist, is inactive, is over its
 * usage limit, or has expired.
 *
 * The RLS policy on promo_codes lets anon/authenticated SELECT only
 * active rows, so disabled codes come back as null.
 */
export async function findPromo(input: string): Promise<PromoCode | null> {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('promo_codes')
    .select('code, percent, label, max_uses, used_count, expires_at')
    .eq('code', normalized)
    .maybeSingle();

  if (error || !data) return null;

  // Extra client-side check in case RLS ever loosens.
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }
  if (data.max_uses != null && data.used_count >= data.max_uses) {
    return null;
  }

  return {
    code: data.code,
    percent: Number(data.percent),
    label: data.label ?? '',
  };
}
