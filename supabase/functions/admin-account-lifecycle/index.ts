// supabase functions deploy admin-account-lifecycle
//
// POST { action: 'reactivate' | 'purge', userId: string, note?: string }
//   reactivate → active superadmin or support_admin
//   purge      → active superadmin only (only works on user-deleted accounts)
//
// Optional secret RESERVED_EMAIL_RETENTION_DAYS (set from your retention policy):
//   unset → email stays reserved indefinitely after a purge (safe default)
//   0     → released immediately;  N → released N days after the purge
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RETENTION_RAW = Deno.env.get('RESERVED_EMAIL_RETENTION_DAYS');
const RETENTION_DAYS =
  RETENTION_RAW && /^\d+$/.test(RETENTION_RAW) ? Number(RETENTION_RAW) : null;

const cors = {
  'Access-Control-Allow-Origin': '*', // tighten to your admin panel's origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KNOWN_DB_ERRORS: Record<string, number> = {
  ACCOUNT_NOT_FOUND: 404,
  NOT_A_DELETED_ACCOUNT: 409,
  ONLY_DELETED_ACCOUNTS_CAN_BE_PURGED: 409,
  WALLET_BALANCE_REMAINING: 409,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { code: 'BAD_REQUEST' });

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { code: 'UNAUTHENTICATED' });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerErr } = await admin.auth.getUser(jwt);
  const caller = callerData?.user;
  if (callerErr || !caller) return json(401, { code: 'UNAUTHENTICATED' });

  let body: { action?: unknown; userId?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { code: 'BAD_REQUEST' });
  }

  const action = body.action === 'reactivate' || body.action === 'purge' ? body.action : null;
  const userId = typeof body.userId === 'string' && UUID.test(body.userId) ? body.userId : null;
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : null;
  if (!action || !userId) return json(400, { code: 'BAD_REQUEST' });
  if (userId === caller.id) return json(400, { code: 'CANNOT_TARGET_SELF' });

  const { data: allowed, error: roleErr } = await admin.rpc('is_account_admin', {
    p_user_id: caller.id,
    p_superadmin_only: action === 'purge',
  });
  if (roleErr || allowed !== true) return json(403, { code: 'FORBIDDEN' });

  // Best effort: a logging failure must not undo or block the action itself.
  const audit = async (meta: Record<string, unknown>) => {
    const { error } = await admin.from('admin_audit_log').insert({
      admin_id: caller.id, // if your panel logs admins.id instead, look it up and use that
      admin_email: caller.email ?? null,
      action: `account.${action}`,
      target_type: 'user',
      target_id: userId,
      meta: { note, ...meta },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      user_agent: req.headers.get('user-agent'),
    });
    if (error) console.error('admin_audit_log insert failed', error);
  };

  try {
    if (action === 'reactivate') {
      const { data: status, error } = await admin.rpc('admin_reactivate_deleted_account', {
        p_user_id: userId,
      });
      if (error) throw error;

      // DB first, then lift the ban. A failed unban is safe to retry ('already_active').
      const { error: unbanErr } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
      if (unbanErr) throw unbanErr;

      await audit({ result: status });
      return json(200, { status });
    }

    // purge
    const { data: email, error: prepErr } = await admin.rpc('admin_prepare_purge', {
      p_user_id: userId,
      p_retain_days: RETENTION_DAYS,
    });
    if (prepErr) throw prepErr;

    // Fails with "Database error deleting user" if any table references the user
    // with ON DELETE RESTRICT / NO ACTION. See the FK query in the setup notes.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    await audit({ email, email_retention_days: RETENTION_DAYS });
    return json(200, { status: 'purged', emailRetentionDays: RETENTION_DAYS });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
    const known = Object.keys(KNOWN_DB_ERRORS).find((k) => message.includes(k));
    if (known) return json(KNOWN_DB_ERRORS[known], { code: known });
    console.error('admin-account-lifecycle failed', action, userId, e);
    return json(500, { code: 'SERVER_ERROR', message });
  }
});
