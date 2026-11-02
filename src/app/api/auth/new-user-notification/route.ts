import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const secret = process.env.SIGNUP_WEBHOOK_SECRET;
  const key = process.env.RESEND_API_KEY;
  if (!secret || !key) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const event = await request.json();
    if (event?.type !== 'INSERT' || event?.schema !== 'auth' || event?.table !== 'users') return NextResponse.json({ ignored: true });
    const email = event?.record?.email;
    if (typeof email !== 'string' || email.length > 320) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Social Media OS <onboarding@resend.dev>',
        to: ['nlopesr@gmail.com'],
        subject: 'Social Media OS: nova conta criada',
        text: `Uma nova conta foi criada no Social Media OS.\nE-mail: ${email}\nRegistro: ${date} (Brasília).\n\nEste aviso não confirma que o convite foi aceito nem que a pessoa fez login.`
      })
    });
    if (!response.ok) return NextResponse.json({ error: 'Email provider rejected request' }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
}
