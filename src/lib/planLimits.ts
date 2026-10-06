// src/lib/planLimits.ts
export const LARGE_ITEM_IDS = ['blanket', 'duvet', 'curtains'];

export type WashAllowance = {
  planRowId: string;
  pickupsLimit: number;
  pickupsUsed: number;
  rolloverPickups: number;
  pickupsRemaining: number;
  itemsLimit: number;
  itemsUsed: number;
  rolloverItems: number;
  itemsRemaining: number;
  largeLimit: number;
  largeUsed: number;
  rolloverLarge: number;
  largeRemaining: number;
  periodEnds: string;
};

export function mapAllowance(raw: any): WashAllowance | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    planRowId: String(raw.plan_row_id),
    pickupsLimit: Number(raw.pickups_limit) || 0,
    pickupsUsed: Number(raw.pickups_used) || 0,
    rolloverPickups: Number(raw.rollover_pickups) || 0,
    pickupsRemaining: Number(raw.pickups_remaining) || 0,
    itemsLimit: Number(raw.items_limit) || 0,
    itemsUsed: Number(raw.items_used) || 0,
    rolloverItems: Number(raw.rollover_items) || 0,
    itemsRemaining: Number(raw.items_remaining) || 0,
    largeLimit: Number(raw.large_limit) || 0,
    largeUsed: Number(raw.large_used) || 0,
    rolloverLarge: Number(raw.rollover_large) || 0,
    largeRemaining: Number(raw.large_remaining) || 0,
    periodEnds: String(raw.period_ends ?? ''),
  };
}

export function planErrorMessage(message: string | undefined): string {
  const m = message ?? '';
  if (m.includes('large_item_limit_reached'))
    return "You've reached your plan's large-item limit. Remove a large item, or pay for it with Pay Per Order.";
  if (m.includes('item_limit_reached'))
    return "You've reached your plan's item limit for this month. Remove an item, or pay for extras with Pay Per Order.";
  if (m.includes('no_pickups_left'))
    return "You've used all your pickups for this month. You can still order with Pay Per Order.";
  if (m.includes('no_active_plan'))
    return 'Your plan is no longer active. Renew it or use Pay Per Order.';
  if (m.includes('express_payment_required') || m.includes('express_payment_not_confirmed'))
    return "We couldn't confirm your Express payment yet. Please contact support with your payment reference.";
  if (m.includes('payment_already_used'))
    return 'This payment has already been used for another order.';
  if (m.includes('address_required')) return 'Please add a pickup address.';
  return 'We could not schedule this pickup. Please try again.';
}