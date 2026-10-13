import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type PricingSettings = {
  echop_delivery_fee: number;
  echop_service_fee: number;
  laundry_dispatch_fee: number;
  laundry_express_fee: number;
  laundry_service_charge: number;
  referral_food_discount: number;
  referral_laundry_percent: number;
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
    const { data, error, status, statusText } = await supabase
      .from('pricing_settings')
      .select('key, value');

    // console.log('[pricing] raw response:', {
    //   error: error?.message ?? null,
    //   status,
    //   statusText,
    //   rowCount: data?.length ?? null,
    //   firstRows: data?.slice(0, 5) ?? null,
    //   supabaseUrl: (supabase as any)?.supabaseUrl ?? (supabase as any)?.rest?.url ?? 'unknown',
    // });

    if (error || !data) {
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

    // console.log('[pricing] after merge:', {
    //   laundry_service_charge: out.laundry_service_charge,
    //   echop_delivery_fee: out.echop_delivery_fee,
    // });

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
      if (isCacheFresh() && cached) {
        setSettings(cached.value);
        setLoading(false);
        return;
      }

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

export function invalidatePricingCache() {
  cached = null;
}