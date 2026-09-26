
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { requestId } = await req.json();
  if (!requestId) return new Response('Missing requestId', { status: 400 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: request, error: fetchError } = await admin
    .from('withdrawal_requests')
    .select('id, user_id, amount_kobo, tx_ref, status, bank_account_id')
    .eq('id', requestId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !request) {
    return new Response(JSON.stringify({ error: 'Withdrawal request not found' }), { status: 404 });
  }
  if (request.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'already_processed' }), { status: 200 });
  }

  const { data: bankAccount } = await admin
    .from('bank_accounts')
    .select('bank_code, account_number, account_name')
    .eq('id', request.bank_account_id)
    .single();

  if (!bankAccount) {
    return new Response(JSON.stringify({ error: 'Bank account not found' }), { status: 404 });
  }

  const flwRes = await fetch('https://api.flutterwave.com/v3/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('FLW_SECRET_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_bank: bankAccount.bank_code,
      account_number: bankAccount.account_number,
      amount: Math.round(request.amount_kobo / 100),
      currency: 'NGN',
      reference: request.tx_ref,
      narration: `Hemera Withdrawal - ${bankAccount.account_name}`,
    }),
  });

  const flwData = await flwRes.json();
  console.log('flutterwave transfer response:', JSON.stringify(flwData));

  if (flwData.status !== 'success') {
    await admin.from('withdrawal_requests').update({ status: 'failed' }).eq('id', requestId);
    await admin.rpc('increment_wallet_balance', { p_user_id: user.id, p_amount: request.amount_kobo });
    await admin.from('wallet_transactions').update({ status: 'failed' }).eq('tx_ref', request.tx_ref);
    return new Response(JSON.stringify({ error: flwData.message ?? 'Transfer failed' }), { status: 502 });
  }

  await admin
    .from('withdrawal_requests')
    .update({ status: 'processing', flw_transfer_id: String(flwData.data.id) })
    .eq('id', requestId);

  return new Response(JSON.stringify({ status: 'processing' }), { status: 200 });
});