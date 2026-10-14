// supabase functions deploy delete-account
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ~100 years. Supabase has no permanent ban; reactivation sets ban_duration 'none'.
const PERMANENT_BAN = '876000h';
const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

/** Blocks sign-in and token refresh, and revokes every existing refresh token. */
async function revokeAccess(admin: SupabaseClient, userId: string, jwt: string) {
  const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: PERMANENT_BAN,
  });
  if (banErr) throw banErr;
  // Best effort: the ban already stops refreshes; this kills sessions on other devices sooner.
  await admin.auth.admin.signOut(jwt, 'global').catch(() => undefined);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { code: 'BAD_REQUEST', message: 'Method not allowed.' });

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { code: 'UNAUTHENTICATED', message: 'Sign in again and retry.' });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, NO_SESSION);

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userErr || !user?.email) {
    return json(401, { code: 'UNAUTHENTICATED', message: 'Sign in again and retry.' });
  }

  let body: { mode?: unknown; password?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { code: 'BAD_REQUEST', message: 'Invalid request.' });
  }

  const mode = body.mode === 'check' || body.mode === 'delete' ? body.mode : null;
  const password = typeof body.password === 'string' ? body.password : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  if (!mode || !password || !reason) {
    return json(400, { code: 'BAD_REQUEST', message: 'Enter your password and a reason, then try again.' });
  }

  try {
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('account_status')
      .eq('id', user.id)
      .single();
    if (profileErr) throw profileErr;

    // Idempotent retry: DB already says deleted (e.g. the ban call failed last time).
    if (profile.account_status === 'deleted') {
      if (mode === 'delete') await revokeAccess(admin, user.id, jwt);
      return json(200, { status: 'deleted' });
    }
    if (profile.account_status !== 'active') {
      return json(403, {
        code: 'ACCOUNT_NOT_ACTIVE',
        message: 'This account cannot be deleted right now. Please contact Support.',
      });
    }

    // Verify the password on a throwaway client so the caller's session is untouched.
    const verifier = createClient(SUPABASE_URL, ANON_KEY, NO_SESSION);
    const { data: signIn, error: pwErr } = await verifier.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (pwErr?.status === 429) {
      return json(429, { code: 'RATE_LIMITED', message: 'Too many attempts. Wait a few minutes and try again.' });
    }
    if (pwErr || signIn.user?.id !== user.id) {
      return json(401, { code: 'INVALID_PASSWORD', message: 'The password you entered is incorrect.' });
    }
    await verifier.auth.signOut({ scope: 'local' }).catch(() => undefined);

    if (mode === 'check') {
      const { data: blockers, error } = await admin.rpc('account_deletion_blockers', {
        p_user_id: user.id,
      });
      if (error) throw error;
      if (Array.isArray(blockers) && blockers.length > 0) {
        return json(409, { code: 'ACCOUNT_DELETION_BLOCKED', blockers });
      }
      return json(200, { status: 'eligible' });
    }

    // Authoritative path: re-checks everything under row locks in one transaction.
    const { data: result, error } = await admin.rpc('request_account_deletion', {
      p_user_id: user.id,
      p_reason: reason,
    });
    if (error) throw error;

    switch (result?.status) {
      case 'blocked':
        return json(409, { code: 'ACCOUNT_DELETION_BLOCKED', blockers: result.blockers ?? [] });
      case 'not_active':
        return json(403, {
          code: 'ACCOUNT_NOT_ACTIVE',
          message: 'This account cannot be deleted right now. Please contact Support.',
        });
      case 'deleted':
      case 'already_deleted':
        await revokeAccess(admin, user.id, jwt);
        return json(200, { status: 'deleted' });
      default:
        throw new Error(`Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.error('delete-account failed', user.id, e);
    return json(500, { code: 'SERVER_ERROR', message: 'We could not delete your account. Please try again.' });
  }
});
