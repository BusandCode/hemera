import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches platform fees from the admin-managed pricing_settings table.
 *
 * Values are cached in memory for 30 seconds, so navigating between screens
 * doesn't hammer the DB, but admin changes reach users quickly without
 * needing a full app restart.
 *
 * If loading fails, the FALLBACKS below are used so the app never breaks.
 * The fallbacks should match the current DB values.
 */

export type PricingSettings = {
  // E-Chop
  echop_delivery_fee: number;
  echop_service_fee: number;

  // E-Wash fees
  laundry_dispatch_fee: number;
  laundry_express_fee: number;
  laundry_service_charge: number;

  // Referrals
  referral_food_discount: number;
  referral_laundry_percent: number;

  // E-Wash per-item prices
  wash_men_shirt: number;
  wash_men_trousers: number;
  wash_men_native: number;
  wash_men_tshirt: number;
  wash_women_dress: number;
  wash_women_blouse: number;
  wash_women_trousers: number;
  wash_women_gown: number;
  wash_suit: number;
  wash_underwear: number;
  wash_blanket: number;
  wash_duvet: number;
  wash_curtains: number;
};

const FALLBACKS: PricingSettings = {
  echop_delivery_fee: 500,
  echop_service_fee: 200,
  laundry_dispatch_fee: 2500,
  laundry_express_fee: 1500,
  laundry_service_charge: 500,
  referral_food_discount: 1000,
  referral_laundry_percent: 5,
  wash_men_shirt: 700,
  wash_men_trousers: 800,
  wash_men_native: 1200,
  wash_men_tshirt: 500,
  wash_women_dress: 900,
  wash_women_blouse: 650,
  wash_women_trousers: 800,
  wash_women_gown: 1500,
  wash_suit: 1500,
  wash_underwear: 300,
  wash_blanket: 2500,
  wash_duvet: 3500,
  wash_curtains: 2000,
};

// Cache expires after 30 seconds.
const CACHE_TTL_MS = 30_000;

let cached: { value: PricingSettings; at: number } | null = null;
let inflight: Promise<PricingSettings> | null = null;

function isCacheFresh() {
  return !!cached && Date.now() - cached.at < CACHE_TTL_MS;
}

async function loadPricing(): Promise<PricingSettings> {
  if (isCacheFresh() && cached) return cached.value;
  if (inflight) return inflight;

  inflight = (async () => {
    const { data, error } = await supabase
      .from('pricing_settings')
      .select('key, value');

    if (error || !data) {
      // Keep whatever we had; do not cache the fallback so a retry can succeed.
      inflight = null;
      return cached?.value ?? FALLBACKS;
    }

    const out: PricingSettings = { ...FALLBACKS };
    for (const row of data as { key: string; value: string | number }[]) {
      if (row.key in out) {
        const n = Number(row.value);
        if (Number.isFinite(n)) {
          (out as any)[row.key] = n;
        }
      }
    }

    cached = { value: out, at: Date.now() };
    inflight = null;
    return out;
  })();

  return inflight;
}

export function usePricingSettings() {
  const [settings, setSettings] = useState<PricingSettings>(
    isCacheFresh() && cached ? cached.value : FALLBACKS,
  );
  const [loading, setLoading] = useState(!isCacheFresh());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // If the cache is fresh, use it immediately.
      if (isCacheFresh() && cached) {
        setSettings(cached.value);
        setLoading(false);
        return;
      }

      // Otherwise fetch in the background (screen keeps rendering with
      // whatever it has — fallbacks or the previous cached value).
      const s = await loadPricing();
      if (cancelled) return;
      setSettings(s);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}

export async function getPricingSettings(): Promise<PricingSettings> {
  return loadPricing();
}

/** Force the next screen to fetch fresh values. */
export function invalidatePricingCache() {
  cached = null;
}