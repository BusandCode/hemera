// E-Plan amount rules, shared by the home screen, setup and review.
//
// The amount a user enters is the budget for ONE week. A 2-week plan simply doubles
// everything (minimum, tier step and meals). Money only buys whole tiers: anything left
// over after the last full tier is surplus and goes back to the user's wallet.

export type EPlanDuration = '1w' | '2w';

export const EPLAN_MIN_WEEKLY = 20_000; // minimum for 1 week
export const EPLAN_TIER_STEP = 5_000; // each extra ₦5,000 (per week) unlocks the next meal tier
export const EPLAN_BASE_MEALS = { min: 4, max: 6 }; // meals per week at the minimum tier
export const EPLAN_MEALS_PER_TIER = 1; // extra meals per week for every tier above the minimum

export function weeksFor(duration: EPlanDuration) {
  return duration === '2w' ? 2 : 1;
}

export type EPlanTier = {
  /** True when the amount reaches the minimum for this duration. */
  valid: boolean;
  weeks: number;
  /** Smallest allowed amount for this duration. */
  min: number;
  /** Size of one tier for this duration. */
  unit: number;
  /** How many tiers above the minimum the amount reaches. */
  tier: number;
  /** What actually gets locked for the plan. */
  locked: number;
  /** Leftover that doesn't buy another tier; returned to the wallet. */
  surplus: number;
  /** How much more is needed to reach the next tier. */
  toNextTier: number;
  /** e.g. "4–6" */
  meals: string;
};

export function getEPlanTier(amount: number, duration: EPlanDuration): EPlanTier {
  const weeks = weeksFor(duration);
  const min = EPLAN_MIN_WEEKLY * weeks;
  const unit = EPLAN_TIER_STEP * weeks;
  const valid = amount >= min;

  const tier = valid ? Math.floor((amount - min) / unit) : 0;
  const locked = valid ? min + tier * unit : 0;
  const surplus = valid ? amount - locked : 0;

  const mealsMin = (EPLAN_BASE_MEALS.min + tier * EPLAN_MEALS_PER_TIER) * weeks;
  const mealsMax = (EPLAN_BASE_MEALS.max + tier * EPLAN_MEALS_PER_TIER) * weeks;

  return {
    valid,
    weeks,
    min,
    unit,
    tier,
    locked,
    surplus,
    toNextTier: valid ? unit - surplus : min - amount,
    meals: `${mealsMin}–${mealsMax}`,
  };
}

// ---------------------------------------------------------------------------
// Fixed plans: set packages shown as cards under "More options". The amount, length and
// meal range never change. The same keys and prices live in the activate_eplan_fixed SQL.
// ---------------------------------------------------------------------------

export type FixedPlan = {
  key: string;
  amount: number;
  durationDays: number;
  /** e.g. "1 week" */
  durationLabel: string;
  /** e.g. "16–20" */
  meals: string;
  emoji: string;
};

export const FIXED_PLANS: FixedPlan[] = [
  { key: 'week-75k', amount: 75_000, durationDays: 7, durationLabel: '1 week', meals: '16–20', emoji: '🍱' },
  { key: 'twoweeks-50k', amount: 50_000, durationDays: 14, durationLabel: '2 weeks', meals: '12–15', emoji: '🥘' },
  { key: 'month-150k', amount: 150_000, durationDays: 30, durationLabel: '1 month', meals: '34–38', emoji: '📅' },
  { key: 'twomonths-250k', amount: 250_000, durationDays: 60, durationLabel: '2 months', meals: '50–60', emoji: '🎁' },
];