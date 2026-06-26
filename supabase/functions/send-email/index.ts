// supabase/functions/send-email/index.ts
// ─────────────────────────────────────────────────────
//  Supabase Edge Function — sends order confirmation emails
//  via Resend (free tier: 100 emails/day, no credit card)
//
//  Deploy: supabase functions deploy send-email
//  Set secret: supabase secrets set RESEND_API_KEY=re_xxxxxxxx
// ─────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') || 'AURUM Boutique <noreply@aurum.com>';

const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

function buildEmailHTML(order: any, items: any[], address: any): string {
  const orderId   = (order.id || '').toString().slice(0, 20);
  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #E2DAC8">
        ${item.emoji || '💎'} ${item.product_name || item.name}
      </td>
      <td style="padding:12px;border-bottom:1px solid #E2DAC8;text-align:center">
        ${item.quantity || item.qty}
      </td>
      <td style="padding:12px;border-bottom:1px solid #E2DAC8;text-align:right;color:#9B7D2F;font-weight:500">
        ${fmt(item.price * (item.quantity || item.qty))}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#1A1714;padding:40px;text-align:center;border-bottom:2px solid #C9A84C">
            <div style="font-family:Georgia,serif;font-size:36px;font-weight:300;color:#C9A84C;letter-spacing:8px">AURUM</div>
            <div style="font-size:10px;letter-spacing:4px;color:rgba(201,168,76,0.6);margin-top:4px;text-transform:uppercase">Luxury Boutique</div>
          </td>
        </tr>

        <!-- Gold line -->
        <tr><td style="background:linear-gradient(to right,#9B7D2F,#C9A84C,#9B7D2F);height:2px"></td></tr>

        <!-- Body -->
        <tr>
          <td style="background:#FFFFFF;padding:48px 40px">
            <p style="font-family:Georgia,serif;font-size:28px;font-weight:300;color:#1A1714;margin:0 0 8px">
              Order Confirmed ✦
            </p>
            <p style="color:#8C8278;font-size:13px;margin:0 0 32px">
              Dear ${address?.full_name || 'Valued Customer'}, thank you for your purchase.
            </p>

            <!-- Order ID -->
            <div style="background:#FAF8F3;border-left:3px solid #C9A84C;padding:16px;margin-bottom:28px">
              <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8C8278;margin-bottom:4px">Order Reference</div>
              <code style="font-size:14px;color:#9B7D2F">${orderId}</code>
              <div style="font-size:11px;color:#8C8278;margin-top:4px">
                ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <!-- Items -->
            <p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8C8278;margin-bottom:12px">Items Ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2DAC8;margin-bottom:28px">
              <thead>
                <tr style="background:#1A1714">
                  <th style="padding:10px 12px;text-align:left;font-size:9px;letter-spacing:2px;color:#E8D5A0;font-weight:400;text-transform:uppercase">Item</th>
                  <th style="padding:10px 12px;text-align:center;font-size:9px;letter-spacing:2px;color:#E8D5A0;font-weight:400;text-transform:uppercase">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:9px;letter-spacing:2px;color:#E8D5A0;font-weight:400;text-transform:uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#8C8278">Subtotal</td>
                <td style="padding:6px 0;font-size:12px;color:#8C8278;text-align:right">${fmt(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#8C8278">GST (18%)</td>
                <td style="padding:6px 0;font-size:12px;color:#8C8278;text-align:right">${fmt(order.tax)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#8C8278">Delivery</td>
                <td style="padding:6px 0;font-size:12px;color:#27AE60;text-align:right">Complimentary</td>
              </tr>
              <tr style="border-top:1px solid #E2DAC8">
                <td style="padding:12px 0 6px;font-size:15px;font-weight:500;color:#1A1714">Total Paid</td>
                <td style="padding:12px 0 6px;font-size:15px;font-weight:500;color:#9B7D2F;text-align:right">${fmt(order.total)}</td>
              </tr>
            </table>

            <!-- Address -->
            ${address?.line1 ? `
            <p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8C8278;margin-bottom:10px">Delivery Address</p>
            <div style="background:#FAF8F3;border:1px solid #E2DAC8;border-left:3px solid #C9A84C;padding:16px;margin-bottom:28px;font-size:13px;color:#3D3832;line-height:1.8">
              <strong>${address.full_name}</strong><br>
              ${address.phone}<br>
              ${address.line1}${address.line2 ? ', ' + address.line2 : ''}<br>
              ${address.city}, ${address.state} — ${address.pincode}<br>
              ${address.country || 'India'}
            </div>` : ''}

            <!-- Payment -->
            ${order.payment_id ? `
            <div style="background:#F7F0DC;border:1px solid #E2DAC8;padding:12px 16px;font-size:11px;color:#9B7D2F;margin-bottom:28px">
              ✓ Payment confirmed · ID: <code>${order.payment_id}</code>
            </div>` : ''}

            <p style="font-size:12px;color:#8C8278;line-height:1.8;margin-bottom:0">
              Your order is being prepared with the utmost care. You will receive shipping updates as your order progresses.<br><br>
              For any queries, contact us at <a href="mailto:support@aurum.com" style="color:#9B7D2F">support@aurum.com</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A1714;padding:28px 40px;text-align:center">
            <div style="font-family:Georgia,serif;font-size:18px;color:#C9A84C;letter-spacing:4px;margin-bottom:8px">AURUM</div>
            <div style="font-size:10px;color:#5F5E5A;letter-spacing:1px">
              © 2024 AURUM Luxury Boutique · Crafted with precision
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const { order, items, address } = await req.json();
    const toEmail = address?.email;

    if (!toEmail) {
      return new Response(JSON.stringify({ error: 'No recipient email' }), { status: 400 });
    }

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not set — email skipped');
      return new Response(JSON.stringify({ success: true, method: 'skipped' }), { status: 200 });
    }

    const html = buildEmailHTML(order, items, address);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [toEmail],
        subject: `✦ AURUM Order Confirmed — ${(order.id || '').toString().slice(0, 20)}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Resend API error');

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200 });
  } catch (err) {
    console.error('send-email error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
