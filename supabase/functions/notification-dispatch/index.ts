import { createClient } from 'jsr:@supabase/supabase-js@2';

type NotificationCategory =
  | 'order_updates'
  | 'wallet_credits'
  | 'network_updates'
  | 'promotions'
  | 'third_party_updates'
  | 'eplan_subscription_updates'
  | 'ewash_subscription_updates'
  | 'chat_messages'
  | 'welcome';

type NotificationRecord = {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
};

const CHAT_REPLY_MESSAGE =
  'Support has replied to your live chat. Open the Hemera app to continue the conversation.';
const categories = new Set<NotificationCategory>([
  'order_updates',
  'wallet_credits',
  'network_updates',
  'promotions',
  'third_party_updates',
  'eplan_subscription_updates',
  'ewash_subscription_updates',
  'chat_messages',
  'welcome',
]);

const settingForCategory: Partial<Record<NotificationCategory, string>> = {
  order_updates: 'order_updates',
  wallet_credits: 'wallet_credits',
  network_updates: 'network_updates',
  promotions: 'promotions',
  third_party_updates: 'third_party_updates',
  eplan_subscription_updates: 'eplan_subscription_updates',
  ewash_subscription_updates: 'ewash_subscription_updates',
  chat_messages: 'chat_messages',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendExpoPush(
  tokens: string[],
  notification: NotificationRecord,
  title: string,
  body: string
) {
  for (let index = 0; index < tokens.length; index += 100) {
    const batch = tokens.slice(index, index + 100);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        batch.map((to) => ({
          to,
          title,
          body,
          sound: 'default',
          channelId: 'default',
          data: { notificationId: notification.id, category: notification.category },
        }))
      ),
    });

    if (!response.ok) {
      throw new Error(`Expo push service returned HTTP ${response.status}.`);
    }

    const result = await response.json();
    const tickets = Array.isArray(result.data) ? result.data : [];
    const failedTicket = tickets.find(
      (ticket: { status?: string; message?: string }) => ticket.status === 'error'
    );
    if (failedTicket) {
      throw new Error(`Expo push delivery failed: ${failedTicket.message ?? 'unknown push error'}`);
    }
  }
}

async function sendBrevoEmail(to: string, title: string, body: string) {
  const apiKey = Deno.env.get('BREVO_API_KEY');
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL');
  const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Hemera';
  if (!apiKey || !senderEmail) {
    throw new Error('BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured to send notification email.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: title,
      textContent: body,
      htmlContent: `<html><body><p>${escapeHtml(body).replaceAll('\n', '<br />')}</p></body></html>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo email service returned HTTP ${response.status}.`);
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const dispatchSecret = Deno.env.get('NOTIFICATION_DISPATCH_SECRET');
  if (!dispatchSecret) {
    console.error('[Notifications] NOTIFICATION_DISPATCH_SECRET is not configured.');
    return new Response('Notification delivery is not configured', { status: 503 });
  }
  if (request.headers.get('x-notification-secret') !== dispatchSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await request.json();
  const record = payload?.record as NotificationRecord | undefined;
  if (
    !record ||
    !record.id ||
    !record.user_id ||
    !record.title ||
    !categories.has(record.category)
  ) {
    return new Response('Invalid notification record', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Notifications] Supabase service credentials are not configured.');
    return new Response('Notification delivery is not configured', { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const [
    { data: settings, error: settingsError },
    { data: tokenRows, error: tokensError },
    { data: userResult, error: userError },
  ] = await Promise.all([
    admin.from('notification_settings').select('*').eq('user_id', record.user_id).maybeSingle(),
    admin.from('notification_push_tokens').select('expo_push_token').eq('user_id', record.user_id),
    admin.auth.admin.getUserById(record.user_id),
  ]);

  if (settingsError || tokensError || userError) {
    const error = settingsError ?? tokensError ?? userError;
    console.error('[Notifications] Could not load notification delivery data:', error);
    return new Response('Could not load notification delivery data', { status: 500 });
  }

  const preference = settingForCategory[record.category];
  if (preference && settings?.[preference] === false) {
    return Response.json({ skipped: 'category_disabled' });
  }

  const title = record.category === 'chat_messages' ? 'New live chat reply' : record.title;
  const body = record.category === 'chat_messages' ? CHAT_REPLY_MESSAGE : record.body;
  const deliveries: Promise<void>[] = [];

  if (settings?.push_enabled !== false && tokenRows?.length) {
    deliveries.push(
      sendExpoPush(
        tokenRows.map((token: { expo_push_token: string }) => token.expo_push_token),
        record,
        title,
        body
      )
    );
  }

  if (settings?.email_enabled !== false && userResult.user.email) {
    deliveries.push(sendBrevoEmail(userResult.user.email, title, body));
  }

  const results = await Promise.allSettled(deliveries);
  const failures = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => result.reason instanceof Error ? result.reason.message : 'Unknown delivery error');
  if (failures.length > 0) {
    console.error('[Notifications] One or more notification channels failed:', failures);
    return Response.json({ errors: failures }, { status: 502 });
  }

  return Response.json({
    delivered: deliveries.length,
    pushDevices: settings?.push_enabled === false ? 0 : tokenRows?.length ?? 0,
    email: settings?.email_enabled === false ? false : !!userResult.user.email,
  });
});
