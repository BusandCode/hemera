// src/constants/washPlans.ts
// Plan catalog used by the renewal screen. These numbers mirror choose-plan.tsx and
// the plan_catalog table in Supabase; if you change a price or allowance, change it in
// all three places (or import this file from choose-plan.tsx).

export type PlanId = 'basic' | 'standard' | 'premium' | 'vip';
export type DurationKey = '1m' | '3m' | '6m' | '12m';

export type WashPlan = {
  id: PlanId;
  name: string;
  price: number; // per month, in naira
  features: string[];
};

export type WashDuration = {
  key: DurationKey;
  label: string;
  months: number;
  savePct: number;
};

export const WASH_PLANS: WashPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 17000,
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

export const WASH_DURATIONS: WashDuration[] = [
  { key: '1m', label: '1 Month', months: 1, savePct: 0 },
  { key: '3m', label: '3 Months', months: 3, savePct: 11 },
  { key: '6m', label: '6 Months', months: 6, savePct: 19 },
  { key: '12m', label: '12 Months', months: 12, savePct: 28 },
];

/** Same rounding as choose-plan.tsx */
export function durationTotal(monthly: number, d: WashDuration) {
  const raw = monthly * d.months * (1 - d.savePct / 100);
  return Math.round(raw / 100) * 100;
}

/** "Standard Plan" / "standard" / "Standard" -> the matching plan, or null */
export function planFromName(name: string | null | undefined): WashPlan | null {
  const n = (name ?? '').toLowerCase().trim();
  return WASH_PLANS.find((p) => n.startsWith(p.id)) ?? null;
}