// src/lib/orderStatus.ts
// Shared by the orders list and the order details screen so both always show
// the same order number and the same status for the same order.

/**
 * The order number shown everywhere in the app.
 * Uses the order's reference (e.g. "WSH-482913" — the same number shown on
 * checkout, schedule and tracking); older orders without one fall back to the
 * first 6 characters of their id.
 */
export function orderNumber(ref: string | null | undefined, id: string) {
  const r = (ref ?? '').trim();
  return r ? r.toUpperCase() : id.replace(/-/g, '').slice(0, 6).toUpperCase();
}

/** Turns whatever is stored in orders.status into one timeline step key. */
export function normalizeStatus(raw: string, orderType: string) {
  const status = (raw ?? '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  const ewash = orderType === 'ewash';
  const aliases: Record<string, string> = {
    'in-progress': ewash ? 'processing' : 'preparing',
    'on-the-way': 'out-for-delivery',
    completed: 'delivered',
    placed: ewash ? 'scheduled' : 'received',
    pending: ewash ? 'scheduled' : 'received',
    confirmed: ewash ? 'scheduled' : 'received',
    active: ewash ? 'processing' : 'preparing',
  };
  return aliases[status] ?? status;
}

const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled', 'failed', 'rejected', 'refunded'];

export function isCancelledStatus(raw: string) {
  return CANCELLED_STATUSES.includes((raw ?? '').toLowerCase().trim());
}