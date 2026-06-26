# 📧 Email Setup Guide — AURUM Luxury Boutique

Automated order confirmation emails work out of the box in **demo mode** (logs to browser console).
To send real emails, follow **one** of the two options below.

---

## Option A — EmailJS (Easiest, 5 minutes, free)
> Sends emails directly from the browser. No backend needed.

### Step 1 — Create EmailJS account
1. Go to **[emailjs.com](https://www.emailjs.com)** → Sign up free
2. Free tier: **200 emails/month**

### Step 2 — Add an Email Service
1. Dashboard → **Email Services** → **Add New Service**
2. Choose **Gmail** (or any provider)
3. Click **Connect Account** → authorize your Gmail
4. Click **Create Service** → copy the **Service ID** (e.g. `service_abc123`)

### Step 3 — Create an Email Template
1. Dashboard → **Email Templates** → **Create New Template**
2. Set **To Email**: `{{to_email}}`
3. Set **Subject**: `✦ AURUM Order Confirmed — {{order_id}}`
4. Paste this in the **Body** (HTML mode):

```html
Dear {{to_name}},

Your AURUM order has been confirmed!

Order ID: {{order_id}}
Date: {{order_date}}

Items:
{{items_text}}

Subtotal: {{subtotal}}
GST:      {{tax}}
Total:    {{total}}

Delivery Address:
{{address}}

Payment ID: {{payment_id}}

Thank you for choosing AURUM Luxury Boutique.
```

5. Click **Save** → copy the **Template ID** (e.g. `template_xyz789`)

### Step 4 — Get your Public Key
1. Dashboard → **Account** → **General** tab
2. Copy **Public Key** (e.g. `AbCdEfGhIjKlMnOp`)

### Step 5 — Add to .env
```env
REACT_APP_EMAILJS_SERVICE_ID=service_abc123
REACT_APP_EMAILJS_TEMPLATE_ID=template_xyz789
REACT_APP_EMAILJS_PUBLIC_KEY=AbCdEfGhIjKlMnOp
```

Restart `npm start` → place a test order → email arrives in customer's inbox! ✅

---

## Option B — Resend + Supabase Edge Function (Professional)
> Runs server-side. Beautiful HTML email template included.

### Step 1 — Create Resend account
1. Go to **[resend.com](https://resend.com)** → Sign up free
2. Free tier: **100 emails/day, 3,000/month**
3. Dashboard → **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)

### Step 2 — Verify a domain (or use onboarding email)
- For testing, Resend lets you send to your own email without a domain
- For production, add your domain in Resend → **Domains**

### Step 3 — Deploy the Edge Function
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Set the secret
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
supabase secrets set FROM_EMAIL="AURUM Boutique <noreply@yourdomain.com>"

# Deploy
supabase functions deploy send-email
```

### Step 4 — Enable Edge Function in emailService.js
Open `src/lib/emailService.js` and uncomment the **Option B** block (lines ~75-86).

That's it! Every order will now send a beautiful HTML email via your own domain. ✅

---

## Testing

### Check email was "sent" in demo mode:
1. Open browser → **F12** → **Console** tab
2. Place an order
3. You'll see: `📧 ORDER CONFIRMATION EMAIL (Demo Mode)` with all details logged

### Test with EmailJS:
- Place a real order with a real email address
- Check inbox (also check spam folder first time)

---

## Email Variables Reference

| Variable          | Example Value                          |
|-------------------|----------------------------------------|
| `{{to_name}}`     | Priya Mehta                            |
| `{{to_email}}`    | priya@email.com                        |
| `{{order_id}}`    | 550e8400-e29b-41d4-a716               |
| `{{order_date}}`  | 24 June 2026                           |
| `{{items_text}}`  | 💎 Diamond Ring × 1 — ₹2,85,000       |
| `{{subtotal}}`    | ₹2,85,000                              |
| `{{tax}}`         | ₹51,300                                |
| `{{total}}`       | ₹3,36,300                              |
| `{{address}}`     | 12 MG Road, Mumbai, Maharashtra-400001 |
| `{{payment_id}}`  | pay_OxXxXxXxXxXx                       |
