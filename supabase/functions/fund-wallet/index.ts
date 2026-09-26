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

  const idempotencyKey = req.headers.get('Idempotency-Key');
  if (!idempotencyKey) return new Response('Missing idempotency key', { status: 400 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: existing } = await admin
    .from('idempotency_keys')
    .select('response')
    .eq('key', idempotencyKey)
    .single();
  if (existing) {
    return new Response(JSON.stringify(existing.response), { status: 200 });
  }

  const { amount } = await req.json();
  if (!amount || amount < 100) {
    return new Response('Invalid amount', { status: 400 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single();

  const txRef = `HEM-${Date.now()}-${user.id.slice(0, 8)}`;

  const flwRes = await fetch('https://api.flutterwave.com/v3/virtual-account-numbers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('FLW_SECRET_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount,
      tx_ref: txRef,
      is_permanent: false,
      firstname: profile?.full_name?.split(' ')[0] ?? 'Hemera',
      lastname: profile?.full_name?.split(' ').slice(1).join(' ') || 'User',
      phonenumber: profile?.phone ?? '',
      narration: `Hemera Wallet - ${profile?.full_name ?? user.email}`,
    }),
  });

  const flwData = await flwRes.json();
  console.log('flutterwave response status:', flwData.status);

  if (flwData.status !== 'success') {
    console.log('flutterwave error:', JSON.stringify(flwData));
    return new Response(JSON.stringify({ error: flwData.message ?? 'Failed to create account' }), { status: 502 });
  }

  const { error: insertError } = await admin.from('wallet_transactions').insert({
    user_id: user.id,
    amount_kobo: amount * 100,
    type: 'credit',
    tx_ref: txRef,
    status: 'pending',
  });

  if (insertError) {
    console.log('wallet_transactions insert error:', JSON.stringify(insertError));
    return new Response(JSON.stringify({ error: 'Failed to record transaction. Please try again.' }), { status: 500 });
  }

  const result = {
    accountNumber: flwData.data.account_number,
    bankName: flwData.data.bank_name,
    reference: txRef,
    amount,
    expiresInSeconds: 30 * 60,
  };

  const { error: idemError } = await admin
    .from('idempotency_keys')
    .insert({ key: idempotencyKey, response: result });

  if (idemError) {
    console.log('idempotency_keys insert error:', JSON.stringify(idemError));
  }

  return new Response(JSON.stringify(result), { status: 200 });
});