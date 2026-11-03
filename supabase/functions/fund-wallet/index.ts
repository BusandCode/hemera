// supabase/functions/fund-wallet/index.ts
//
// Creates ONE funding attempt: a pending wallet_transactions row plus a one-time Flutterwave
// virtual account. Nothing is credited here. The wallet is only credited later, after the payment has
// been verified with Flutterwave (see flutterwave-webhook and reconcile-payments).

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// ---- helpers (shared by all three functions; copied here so each function is self-contained) ----

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, idempotency-key, x-reconcile-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/** Server-side client with the service role. Never expose this key to the app. */
function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Works out who is calling from their login token. Returns null if the token is missing or invalid. */
async function getAuthenticatedUser(req: Request) {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/** Compares two secrets without leaking, through timing, how many leading characters matched. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

const FLW_BASE = 'https://api.flutterwave.com';

/** Calls the Flutterwave API with a timeout. It never logs the secret key or request headers. */
async function flwRequest(path: string, init: { method?: string; body?: string } = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FLW_BASE}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${Deno.env.get('FLW_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: init.body,
      signal: controller.signal,
    });
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: res.ok, httpStatus: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

/** True when the provider is having trouble (so the caller should retry later instead of deciding anything). */
function isTransient(httpStatus: number) {
  return httpStatus >= 500 || httpStatus === 429 || httpStatus === 408;
}

type VerifiedPayment = {
  id: string;
  tx_ref: string;
  flw_ref: string | null;
  status: string;
  currency: string;
  paid_kobo: number;
};

function toVerified(v: any): VerifiedPayment | null {
  if (!v || typeof v !== 'object') return null;
  const amount = Number(v.amount);
  if (!Number.isFinite(amount) || amount <= 0 || v.id == null) return null;
  return {
    id: String(v.id),
    tx_ref: String(v.tx_ref ?? ''),
    flw_ref: v.flw_ref ? String(v.flw_ref) : null,
    status: String(v.status ?? '').toLowerCase(),
    currency: String(v.currency ?? '').toUpperCase(),
    paid_kobo: Math.round(amount * 100),
  };
}

/** Asks Flutterwave about a payment by its transaction id. Throws if Flutterwave is unavailable. */
async function verifyTransactionById(id: string | number): Promise<VerifiedPayment | null> {
  const r = await flwRequest(`/v3/transactions/${encodeURIComponent(String(id))}/verify`);
  if (isTransient(r.httpStatus)) throw new Error(`Flutterwave verify unavailable (${r.httpStatus})`);
  if (!r.ok || r.body?.status !== 'success') return null;
  return toVerified(r.body.data);
}

/** Asks Flutterwave about a payment by our own reference. Returns null when nothing was paid yet. */
async function verifyTransactionByReference(txRef: string): Promise<VerifiedPayment | null> {
  const r = await flwRequest(`/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`);
  if (isTransient(r.httpStatus)) throw new Error(`Flutterwave verify unavailable (${r.httpStatus})`);
  if (!r.ok || r.body?.status !== 'success') return null;
  return toVerified(r.body.data);
}

/**
 * Hands a provider-verified payment to the database, which checks the amount, currency, owner and state
 * and credits the wallet at most once. Returns the database's verdict.
 */
async function finalizePayment(admin: SupabaseClient, p: VerifiedPayment): Promise<string> {
  const { data, error } = await admin.rpc('finalize_funding', {
    p_tx_ref: p.tx_ref,
    p_flw_ref: p.flw_ref,
    p_provider_tx_id: p.id,
    p_paid_kobo: p.paid_kobo,
    p_currency: p.currency,
    // Only the fields needed to investigate later. No customer details.
    p_raw: {
      id: p.id,
      tx_ref: p.tx_ref,
      flw_ref: p.flw_ref,
      amount_kobo: p.paid_kobo,
      currency: p.currency,
      status: p.status,
    },
  });
  if (error) throw new Error(`finalize_funding failed: ${error.message}`);
  return String(data);
}

/** Saves a payment that needs a person to look at it. Duplicates are ignored. */
async function recordReview(
  admin: SupabaseClient,
  row: { tx_ref?: string; provider_tx_id?: string; reason: string; paid_kobo?: number; currency?: string; raw?: unknown }
) {
  const { error } = await admin.from('payment_reconciliation').upsert(
    {
      tx_ref: row.tx_ref ?? '',
      provider_tx_id: row.provider_tx_id ?? '',
      reason: row.reason,
      paid_kobo: row.paid_kobo ?? null,
      currency: row.currency ?? null,
      raw: row.raw ?? null,
    },
    { onConflict: 'tx_ref,provider_tx_id,reason', ignoreDuplicates: true }
  );
  if (error) console.log('could not record review item:', error.message);
}

// ---- function ----
// 'shop' = Our Products orders: paid straight to the order like E-Chop / E-Wash (never into the wallet).
const PURPOSES = ['funding', 'eplan', 'echop', 'ewash', 'subscription', 'shop'];
const MIN_NAIRA = 100;
// Set MAX_FUNDING_NAIRA as a function secret to change this. Pick a limit that matches your own rules
// and your Flutterwave account limits.
const MAX_NAIRA = Number(Deno.env.get('MAX_FUNDING_NAIRA') ?? 5_000_000);
const ACCOUNT_LIFETIME_SECONDS = 25 * 60;
// An attempt that has no account after this long was abandoned half-way and may be replaced.
const STALE_ATTEMPT_MS = 90 * 1000;

type Attempt = {
  tx_ref: string;
  status: string;
  amount_kobo: number | string;
  purpose: string | null;
  account_number: string | null;
  bank_name: string | null;
  expires_at: string | null;
  created_at: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // 1. Who is asking? The user id always comes from the verified login token, never from the request.
  const user = await getAuthenticatedUser(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  // 2. The idempotency key identifies this one funding attempt.
  const idempotencyKey = (req.headers.get('Idempotency-Key') ?? '').trim();
  if (idempotencyKey.length < 8 || idempotencyKey.length > 120) {
    return json({ error: 'Missing or invalid idempotency key' }, 400);
  }

  // 3. Validate the request strictly.
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const amount = body?.amount;
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < MIN_NAIRA || amount > MAX_NAIRA) {
    return json(
      { error: `Amount must be a whole number of naira between ₦${MIN_NAIRA.toLocaleString()} and ₦${MAX_NAIRA.toLocaleString()}` },
      400
    );
  }

  // A missing purpose means a normal wallet top-up (older app versions). Anything else must be a known value.
  const rawPurpose = body?.purpose;
  const purpose = rawPurpose === undefined || rawPurpose === null ? 'funding' : rawPurpose;
  if (typeof purpose !== 'string' || !PURPOSES.includes(purpose)) {
    return json({ error: 'Unknown payment purpose' }, 400);
  }

  const amountKobo = amount * 100;
  const admin = adminClient();

  const findAttempt = () =>
    admin
      .from('wallet_transactions')
      .select('tx_ref, status, amount_kobo, purpose, account_number, bank_name, expires_at, created_at')
      .eq('user_id', user.id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

  const resultFor = (a: Attempt) => ({
    accountNumber: a.account_number,
    bankName: a.bank_name,
    reference: a.tx_ref,
    amount,
    // The real remaining time, from the expiry that was stored with the attempt.
    expiresInSeconds: a.expires_at
      ? Math.max(0, Math.floor((new Date(a.expires_at).getTime() - Date.now()) / 1000))
      : 0,
  });

  // Same key seen before. Returns a response, or null when the old attempt was abandoned and can be replaced.
  const handleExisting = async (a: Attempt): Promise<Response | null> => {
    if (Number(a.amount_kobo) !== amountKobo || (a.purpose ?? 'funding') !== purpose) {
      return json({ error: 'This request key was already used for a different payment' }, 409);
    }
    if (a.account_number) return json(resultFor(a), 200);

    if (Date.now() - new Date(a.created_at).getTime() < STALE_ATTEMPT_MS) {
      return json({ error: 'Your payment account is still being created. Please try again in a moment.', code: 'in_progress' }, 409);
    }

    // Abandoned half-way (no account was ever issued). Retire it so a fresh attempt can use this key.
    await admin
      .from('wallet_transactions')
      .update({ status: 'failed', idempotency_key: null })
      .eq('tx_ref', a.tx_ref)
      .eq('status', 'pending')
      .is('account_number', null);
    return null;
  };

  // 4. Has this exact attempt been started already?
  const existing = await findAttempt();
  if (existing.error) {
    console.log('idempotency lookup failed:', existing.error.message);
    return json({ error: 'Could not start the payment. Please try again.' }, 500);
  }
  if (existing.data) {
    const reply = await handleExisting(existing.data as Attempt);
    if (reply) return reply;
  }

  // 5. Save the attempt FIRST. From this moment a payment to this reference always has a record to match.
  const txRef = `HEM-${Date.now()}-${user.id.slice(0, 8)}-${crypto.randomUUID().slice(0, 4)}`;

  const { error: insertError } = await admin.from('wallet_transactions').insert({
    user_id: user.id,
    amount_kobo: amountKobo,
    type: 'credit',
    tx_ref: txRef,
    status: 'pending',
    purpose,
    currency: 'NGN',
    idempotency_key: idempotencyKey,
  });

  if (insertError) {
    // 23505 = unique violation: a concurrent request with the same key got there first.
    if (insertError.code === '23505') {
      const again = await findAttempt();
      if (again.data) {
        const reply = await handleExisting(again.data as Attempt);
        if (reply) return reply;
      }
    }
    console.log('could not save funding attempt:', insertError.code, insertError.message);
    return json({ error: 'Failed to record transaction. Please try again.' }, 500);
  }

  // If anything goes wrong from here, retire the attempt so the same key can start a clean new one.
  const failAttempt = async (reason: string, status = 502) => {
    console.log('funding attempt failed:', txRef, reason);
    await admin
      .from('wallet_transactions')
      .update({ status: 'failed', idempotency_key: null })
      .eq('tx_ref', txRef)
      .eq('status', 'pending');
    return json({ error: 'We could not create a payment account. Please try again.' }, status);
  };

  // 6. Ask Flutterwave for the one-time account.
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  const nameParts = (profile?.full_name ?? '').trim().split(/\s+/).filter(Boolean);

  let flw;
  try {
    flw = await flwRequest('/v3/virtual-account-numbers', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        amount,
        currency: 'NGN',
        tx_ref: txRef,
        is_permanent: false,
        // Seconds the account stays open. Check this field name against the Flutterwave API version enabled for you.
        expires: ACCOUNT_LIFETIME_SECONDS,
        firstname: nameParts[0] ?? 'Hemera',
        lastname: nameParts.slice(1).join(' ') || 'User',
        phonenumber: profile?.phone ?? '',
        narration: `Hemera Wallet - ${profile?.full_name ?? user.email}`,
      }),
    });
  } catch (e: any) {
    return await failAttempt(`provider request failed: ${e?.message ?? 'unknown'}`);
  }

  // 7. Check the answer properly before trusting it.
  const d = flw.body?.data;
  if (!flw.ok || flw.body?.status !== 'success' || !d?.account_number || !d?.bank_name) {
    return await failAttempt(`provider error ${flw.httpStatus}: ${String(flw.body?.message ?? 'no message').slice(0, 200)}`);
  }
  if (d.amount != null && Math.round(Number(d.amount) * 100) !== amountKobo) {
    return await failAttempt('provider amount does not match the request');
  }
  if (d.currency != null && String(d.currency).toUpperCase() !== 'NGN') {
    return await failAttempt('provider currency is not NGN');
  }

  // Use the provider's own expiry only when it is sooner than our lifetime; otherwise our lifetime applies.
  const providerExpiry = d.expiry_date ? new Date(d.expiry_date) : null;
  const now = Date.now();
  const lifetimeEnd = new Date(now + ACCOUNT_LIFETIME_SECONDS * 1000);
  const expiresAt =
    providerExpiry &&
    !Number.isNaN(providerExpiry.getTime()) &&
    providerExpiry.getTime() > now &&
    providerExpiry.getTime() < lifetimeEnd.getTime()
      ? providerExpiry
      : lifetimeEnd;

  // 8. Store the account details against the attempt.
  const { error: updateError } = await admin
    .from('wallet_transactions')
    .update({
      account_number: String(d.account_number),
      bank_name: String(d.bank_name),
      account_flw_ref: d.flw_ref ? String(d.flw_ref) : null,
      expires_at: expiresAt.toISOString(),
    })
    .eq('tx_ref', txRef);

  if (updateError) {
    // The account exists at Flutterwave but the user is never shown it, so no money should arrive.
    // If it does, the payment is matched by reference and handled by reconcile-payments.
    return await failAttempt(`could not save account details: ${updateError.message}`, 500);
  }

  return json(
    {
      accountNumber: String(d.account_number),
      bankName: String(d.bank_name),
      reference: txRef,
      amount,
      expiresInSeconds: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
    },
    200
  );
});