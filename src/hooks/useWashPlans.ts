import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type PlanId = 'basic' | 'standard' | 'premium' | 'vip';
export type DurationKey = '1m' | '3m' | '6m' | '12m';

export type WashPlan = {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  image: string;
  accent: string;
  recommended: boolean;
};

export type WashDuration = {
  key: DurationKey;
  label: string;
  months: number;
  savePct: number;
};

const DURATION_LABEL: Record<number, { key: DurationKey; label: string }> = {
  1: { key: '1m', label: '1 Month' },
  3: { key: '3m', label: '3 Months' },
  6: { key: '6m', label: '6 Months' },
  12: { key: '12m', label: '12 Months' },
};

const FALLBACK_PLANS: WashPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 17000,
    tagline: 'For small households or single professionals',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    accent: '#255DDE',
    recommended: false,
    features: [
      '2 pickups per month',
      '14 items per month',
      '2 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Standard turnaround (24 hrs)',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 26000,
    tagline: 'Most popular plan for couples & busy homes',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80',
    accent: '#255DDE',
    recommended: true,
    features: [
      'Up to 3 pickups per month',
      '25 items per month',
      '3 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Priority 24 hr turnaround',
      'Personal branded bag',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 35000,
    tagline: 'White glove care for families & high volume needs',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80',
    accent: '#D64545',
    recommended: false,
    features: [
      'Up to 4 pickups per month',
      '45 items per month',
      '4 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Same day express turnaround',
      'Personal Hemera premium bag',
      'Dedicated support line',
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 110000,
    tagline: 'Our highest tier with priority everything',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80',
    accent: '#E0B43F',
    recommended: false,
    features: [
      'Up to 6 pickups per month',
      '85 items per month',
      '6 large items max (blanket, duvet, curtain)',
      'Wash, dry, iron & fold',
      'Same day express turnaround (24 hrs)',
      'Personal Hemera VIP bag',
      'Fast pickup and delivery',
      'Dedicated support line',
    ],
  },
];

const FALLBACK_DURATIONS: WashDuration[] = [
  { key: '1m', label: '1 Month', months: 1, savePct: 0 },
  { key: '3m', label: '3 Months', months: 3, savePct: 11 },
  { key: '6m', label: '6 Months', months: 6, savePct: 19 },
  { key: '12m', label: '12 Months', months: 12, savePct: 28 },
];

const CACHE_TTL_MS = 30_000;

let cached: { plans: WashPlan[]; durations: WashDuration[]; at: number } | null = null;
let inflight: Promise<{ plans: WashPlan[]; durations: WashDuration[] }> | null = null;

function isFresh() {
  return !!cached && Date.now() - cached.at < CACHE_TTL_MS;
}

async function load(): Promise<{ plans: WashPlan[]; durations: WashDuration[] }> {
  if (isFresh() && cached) return { plans: cached.plans, durations: cached.durations };
  if (inflight) return inflight;

  inflight = (async () => {
    const [plansRes, durRes] = await Promise.all([
      supabase
        .from('plan_catalog')
        .select('plan_id, name, price_naira, tagline, features, image_url, accent, recommended')
        .order('price_naira', { ascending: true }),
      supabase
        .from('plan_duration_discounts')
        .select('months, save_pct')
        .order('months', { ascending: true }),
    ]);

    if (plansRes.error || !plansRes.data || durRes.error || !durRes.data) {
      console.log(
        '[washPlans] DB read failed:',
        plansRes.error?.message,
        durRes.error?.message,
      );
      inflight = null;
      return cached
        ? { plans: cached.plans, durations: cached.durations }
        : { plans: FALLBACK_PLANS, durations: FALLBACK_DURATIONS };
    }

    const plans: WashPlan[] = plansRes.data.map((p: any) => ({
      id: p.plan_id as PlanId,
      name: p.name ?? p.plan_id,
      price: Number(p.price_naira ?? 0),
      tagline: p.tagline ?? '',
      image: p.image_url ?? '',
      accent: p.accent ?? '#255DDE',
      recommended: !!p.recommended,
      features: Array.isArray(p.features) ? p.features : [],
    }));

    const durations: WashDuration[] = durRes.data
      .map((d: any) => {
        const meta = DURATION_LABEL[d.months];
        if (!meta) return null;
        return {
          key: meta.key,
          label: meta.label,
          months: Number(d.months),
          savePct: Number(d.save_pct ?? 0),
        };
      })
      .filter((d): d is WashDuration => d !== null);

    const result = { plans, durations };
    cached = { ...result, at: Date.now() };
    inflight = null;
    return result;
  })();

  return inflight;
}

export function useWashPlans() {
  const [state, setState] = useState<{ plans: WashPlan[]; durations: WashDuration[] }>(
    isFresh() && cached
      ? { plans: cached.plans, durations: cached.durations }
      : { plans: FALLBACK_PLANS, durations: FALLBACK_DURATIONS },
  );
  const [loading, setLoading] = useState(!isFresh());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isFresh() && cached) {
        setState({ plans: cached.plans, durations: cached.durations });
        setLoading(false);
        return;
      }
      const result = await load();
      if (cancelled) return;
      setState(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans: state.plans, durations: state.durations, loading };
}

/** Same rounding as the mobile app's existing durationTotal. */
export function durationTotal(monthly: number, d: WashDuration) {
  const raw = monthly * d.months * (1 - d.savePct / 100);
  return Math.round(raw / 100) * 100;
}

/** Find a plan by name (e.g. "Standard" or "standard") or by id. */
export function planFromName(
  plans: WashPlan[],
  name: string | null | undefined,
): WashPlan | null {
  const n = (name ?? '').toLowerCase().trim();
  if (!n) return null;
  return plans.find((p) => n.startsWith(p.id) || p.name.toLowerCase() === n) ?? null;
}