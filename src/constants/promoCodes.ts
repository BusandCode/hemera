export type PromoCode = {
  code: string;
  percent: number;
  label: string;
};

// Dummy codes for testing. Swap for a Supabase `promo_codes` lookup later.
export const PROMO_CODES: PromoCode[] = [
  { code: 'CHOP8K2', percent: 8, label: 'General offer' },
  { code: 'INFL5A7', percent: 5, label: 'Influencer code' },
  { code: 'FEAST15X', percent: 15, label: 'Special offer' },
];

export function findPromo(input: string): PromoCode | null {
  const normalized = input.trim().toUpperCase();
  if (!normalized) return null;
  return PROMO_CODES.find((p) => p.code === normalized) ?? null;
}