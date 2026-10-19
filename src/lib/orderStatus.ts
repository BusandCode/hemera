// src/lib/orderStatus.ts
// Shared by the orders list and the order details screen so both always show
// the same order number and the same status for the same order.

/**
 * The order number shown everywhere in the app.
 */
export function orderNumber(ref: string | null | undefined, id: string) {
  const r = (ref ?? '').trim();
  return r ? r.toUpperCase() : id.replace(/-/g, '').slice(0, 6).toUpperCase();
}

/**
 * Turns whatever is stored in orders.status into one timeline step key.
 * Both E-Chop and E-Wash timelines now include an `approved` step, and
 * `confirmed` (written by the admin dashboard when an admin approves)
 * maps to `approved`.
 */
export function normalizeStatus(raw: string, orderType: string) {
  const status = (raw ?? '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  const ewash = orderType === 'ewash';

  const aliases: Record<string, string> = {
    'in-progress': ewash ? 'processing' : 'preparing',
    'on-the-way': 'out-for-delivery',
    completed: 'delivered',
    placed: ewash ? 'scheduled' : 'received',
    pending: ewash ? 'scheduled' : 'received',
    confirmed: 'approved',
    // Set by the partner app (restaurants and laundries).
    accepted: 'approved',
    processing: ewash ? 'processing' : 'preparing',
    'pickup-received': 'picked-up',
    'ready-for-dispatch': 'ready',
    'handed-over': 'picked-up',
    'out-for-delivery': 'out-for-delivery',
    active: ewash ? 'processing' : 'preparing',
  };

  return aliases[status] ?? status;
}

const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled', 'cancelled_by_vendor', 'failed', 'rejected', 'refunded', 'timed_out'];

export function isCancelledStatus(raw: string) {
  return CANCELLED_STATUSES.includes((raw ?? '').toLowerCase().trim());
}
