// supabase/functions/flutterwave-webhook/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const signature = req.headers.get('verif-hash');
  if (signature !== Deno.env.get('FLW_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json();

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Handle a successful bank-transfer FUNDING (money coming INTO the wallet)
  if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
    const flwRef = payload.data.flw_ref;
    const txRef = payload.data.tx_ref;

    const { data: seen } = await admin
      .from('wallet_transactions')
      .select('id, status')
      .eq('flw_ref', flwRef)
      .single();
    if (seen) return new Response('Already processed', { status: 200 });

    const { data: txn } = await admin
      .from('wallet_transactions')
      .select('id, user_id, amount_kobo, status')
      .eq('tx_ref', txRef)
      .single();
    if (!txn || txn.status !== 'pending') {
      return new Response('No matching pending transaction', { status: 200 });
    }

    await admin
      .from('wallet_transactions')
      .update({ status: 'success', flw_ref: flwRef })
      .eq('id', txn.id);

    await admin.rpc('increment_wallet_balance', {
      p_user_id: txn.user_id,
      p_amount: txn.amount_kobo,
    });

    return new Response('OK', { status: 200 });
  }

  // Handle a WITHDRAWAL payout finishing (money going OUT of the wallet)
  if (payload.event === 'transfer.completed') {
    const txRef = payload.data.reference;
    const success = payload.data.status === 'SUCCESSFUL';

    const { data: request } = await admin
      .from('withdrawal_requests')
      .select('id, user_id, amount_kobo, status')
      .eq('tx_ref', txRef)
      .single();

    if (!request || request.status !== 'processing') {
      return new Response('No matching processing withdrawal', { status: 200 });
    }

    if (success) {
      await admin.from('withdrawal_requests').update({ status: 'completed' }).eq('id', request.id);
      await admin.from('wallet_transactions').update({ status: 'success' }).eq('tx_ref', txRef);
    } else {
      await admin.from('withdrawal_requests').update({ status: 'failed' }).eq('id', request.id);
      await admin.rpc('increment_wallet_balance', {
        p_user_id: request.user_id,
        p_amount: request.amount_kobo,
      });
      await admin.from('wallet_transactions').update({ status: 'failed' }).eq('tx_ref', txRef);
    }

    return new Response('OK', { status: 200 });
  }

  // Anything else Flutterwave sends, ignore it
  return new Response('Ignored', { status: 200 });
});