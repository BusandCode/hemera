import { FunctionsHttpError } from '@supabase/supabase-js';

// ADAPT: point this at your existing Supabase client.
import { supabase } from '../lib/supabase';

export type DeletionBlocker =
  | 'active_order'
  | 'active_eplan'
  | 'active_subscription'
  | 'pending_wallet_transaction'
  | 'wallet_balance';

export type AccountDeletionErrorCode =
  | 'INVALID_PASSWORD'
  | 'ACCOUNT_DELETION_BLOCKED'
  | 'ACCOUNT_NOT_ACTIVE'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

export class AccountDeletionError extends Error {
  constructor(
    public readonly code: AccountDeletionErrorCode,
    message: string,
    public readonly blockers: DeletionBlocker[] = [],
  ) {
    super(message);
    this.name = 'AccountDeletionError';
  }
}

/* ------------------------------------------------------------------ */
/* One message for every place in the app that reports a blocked delete */
/* ------------------------------------------------------------------ */

export const DELETION_UNAVAILABLE_TITLE = 'Account Deletion Unavailable';

const BLOCKER_PHRASES: Record<DeletionBlocker, string> = {
  active_order: 'an active order',
  active_eplan: 'an active E-Plan',
  active_subscription: 'an active subscription',
  pending_wallet_transaction: 'a pending wallet transaction',
  wallet_balance: 'a remaining E-Plan wallet balance',
};

const joinList = (items: string[], conjunction: 'and' | 'or') =>
  items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;

export function describeDeletionBlockers(blockers: DeletionBlocker[]): string {
  const specific = [...new Set(blockers)].map((b) => BLOCKER_PHRASES[b]).filter(Boolean);
  const phrase =
    specific.length > 0
      ? joinList(specific, 'and')
      : joinList(Object.values(BLOCKER_PHRASES), 'or');
  return `You cannot delete your account while you have ${phrase}. Please contact Support for assistance.`;
}

/* ------------------------------------------------------------------ */

const FALLBACK_MESSAGES: Record<AccountDeletionErrorCode, string> = {
  INVALID_PASSWORD: 'The password you entered is incorrect.',
  ACCOUNT_DELETION_BLOCKED: describeDeletionBlockers([]),
  ACCOUNT_NOT_ACTIVE: 'This account cannot be deleted right now. Please contact Support.',
  RATE_LIMITED: 'Too many attempts. Wait a few minutes and try again.',
  BAD_REQUEST: 'Enter your password and a reason, then try again.',
  UNAUTHENTICATED: 'Your session has expired. Sign in again and retry.',
  SERVER_ERROR: 'We could not delete your account. Please try again.',
  NETWORK_ERROR: 'Check your internet connection and try again.',
};

async function callDeleteAccount(mode: 'check' | 'delete', password: string, reason: string) {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { mode, password, reason },
  });

  if (!error) return data as { status: string };

  let payload: { code?: AccountDeletionErrorCode; message?: string; blockers?: DeletionBlocker[] } | null =
    null;
  if (error instanceof FunctionsHttpError) {
    try {
      payload = await error.context.json();
    } catch {
      payload = null;
    }
  }

  const code: AccountDeletionErrorCode =
    payload?.code && payload.code in FALLBACK_MESSAGES
      ? payload.code
      : error instanceof FunctionsHttpError
        ? 'SERVER_ERROR'
        : 'NETWORK_ERROR';

  const blockers = payload?.blockers ?? [];
  const message =
    code === 'ACCOUNT_DELETION_BLOCKED'
      ? describeDeletionBlockers(blockers)
      : payload?.message || FALLBACK_MESSAGES[code];

  throw new AccountDeletionError(code, message, blockers);
}

/** Verifies the password and eligibility without deleting anything. Throws AccountDeletionError. */
export async function checkAccountDeletion(password: string, reason: string): Promise<void> {
  await callDeleteAccount('check', password, reason);
}

/**
 * Deletes the account. The server re-runs every eligibility check under a row lock,
 * so a "check" that passed earlier can still come back ACCOUNT_DELETION_BLOCKED here.
 */
export async function requestAccountDeletion(password: string, reason: string): Promise<void> {
  await callDeleteAccount('delete', password, reason);
}
