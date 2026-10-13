

import {
  useWashPlans,
  durationTotal as durationTotalOf,
  planFromName as planFromNameIn,
  type WashPlan as HookWashPlan,
  type WashDuration as HookWashDuration,
  type PlanId,
  type DurationKey,
} from '../hooks/useWashPlans';

export type { PlanId, DurationKey };
export type WashPlan = HookWashPlan;
export type WashDuration = HookWashDuration;

/**
 * Re-exported so existing imports keep working.
 * Screens should migrate to `useWashPlans()` for live data.
 */
export { useWashPlans };

/** Same behaviour, but takes the durations array as a parameter. */
export function durationTotal(monthly: number, d: HookWashDuration) {
  return durationTotalOf(monthly, d);
}

/**
 * Same lookup, but now requires the caller to pass the plans array
 * (since the plans are no longer a static list).
 *
 *     const { plans } = useWashPlans();
 *     const plan = planFromName(plans, planName);
 */
export function planFromName(
  plans: HookWashPlan[],
  name: string | null | undefined,
): HookWashPlan | null {
  return planFromNameIn(plans, name);
}

/**
 * Fallback array used only if a caller imports WASH_PLANS directly without
 * using the hook. Do not rely on this in new code — it's here so nothing
 * breaks during the migration.
 */
export const WASH_PLANS: HookWashPlan[] = [
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

export const WASH_DURATIONS: HookWashDuration[] = [
  { key: '1m', label: '1 Month', months: 1, savePct: 0 },
  { key: '3m', label: '3 Months', months: 3, savePct: 11 },
  { key: '6m', label: '6 Months', months: 6, savePct: 19 },
  { key: '12m', label: '12 Months', months: 12, savePct: 28 },
];