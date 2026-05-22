const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const VAPID_PUBLIC  = process.env.REACT_APP_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  if (!VAPID_PUBLIC || !VAPID_PRIVATE || !SUPABASE_URL || !SERVICE_KEY) {
    console.error('[send-push] Variáveis de ambiente ausentes');
    return { statusCode: 500, body: 'Configuração incompleta' };
  }

  try {
    const { title, body } = JSON.parse(event.body || '{}');

    webpush.setVapidDetails('mailto:admin@copasimuladа.com', VAPID_PUBLIC, VAPID_PRIVATE);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (error) throw error;

    const payload = JSON.stringify({ title, body });

    const results = await Promise.allSettled(
      (subs || []).map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[send-push] ${sent}/${subs?.length || 0} notificações enviadas`);
    return { statusCode: 200, body: JSON.stringify({ sent }) };
  } catch (e) {
    console.error('[send-push]', e.message);
    return { statusCode: 500, body: e.message };
  }
};
