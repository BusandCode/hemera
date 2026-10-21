import { supabase } from '../lib/supabase';

export type PromoCode = {
  code: string;
  percent: number;
  label: string;
};

/**
 * Checks one promo code with the server (hemera_check_promo). Returns null when the code
 * doesn't exist, is inactive, is over its usage limit, or has expired.
 * The list of codes is not readable from the app, and the discount itself is worked out
 * again by the server at checkout, so it can't be changed from the app.
 */
export async function findPromo(input: string): Promise<PromoCode | null> {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return null;

  const { data, error } = await supabase.rpc('hemera_check_promo', { p_code: normalized });
  if (error || !data) return null;

  const row = data as { code?: string; percent?: number | string; label?: string | null };
  const percent = Number(row.percent ?? 0);
  if (!row.code || !(percent > 0)) return null;

  return {
    code: row.code,
    percent,
    label: row.label ?? '',
  };
}
