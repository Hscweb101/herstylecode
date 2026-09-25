# Razorpay Setup

The checkout flow is fully wired for Razorpay (UPI, cards, net banking, wallets) plus Cash on Delivery. It currently runs against **placeholder test-mode values**, so online payments will return a friendly "not configured yet" error until real keys are added — Cash on Delivery already works end-to-end without any Razorpay setup.

## 1. Get your Razorpay API keys

1. Sign up / log in at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Toggle **Test Mode** (top right) while developing — this generates fake transactions with no real money movement, using Razorpay's test card/UPI numbers.
3. Go to **Settings → API Keys → Generate Test Key**. Copy the **Key ID** (`rzp_test_...`) and **Key Secret**.
4. When ready to go live: complete Razorpay's KYC/business verification, toggle to **Live Mode**, and generate a **Live Key** the same way (`rzp_live_...`).

## 2. Set the keys as Supabase Edge Function secrets

These must be set via the Supabase CLI or dashboard — never committed to the codebase:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set \
  RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx \
  RAZORPAY_KEY_SECRET=your_key_secret \
  --project-ref <your-project-ref>
```

## 3. Set the public Key ID for the frontend

Add to `.env.local` (and your hosting provider's environment variables):

```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

This is the **publishable** Key ID only — never put the Key Secret in a `VITE_`-prefixed variable, as anything with that prefix is bundled into the public JavaScript.

## 4. Set up the webhook (required for reliability)

The `verify-razorpay-payment` function confirms payment immediately when the customer completes checkout, but if their browser closes or loses connection right after paying, that confirmation never arrives. The webhook is the durable backstop that guarantees the order is still marked paid.

1. In the Razorpay Dashboard: **Settings → Webhooks → Add New Webhook**.
2. Webhook URL: `https://<your-project-ref>.supabase.co/functions/v1/razorpay-webhook`
3. Active events to subscribe to: `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`.
4. Razorpay will show you a **Webhook Secret** — set it as an Edge Function secret:

```bash
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret --project-ref <your-project-ref>
```

## 5. Test a payment

With test mode keys configured, use Razorpay's published test card `4111 1111 1111 1111` (any future expiry, any CVV) or their test UPI ID `success@razorpay` to simulate a successful payment, and `failure@razorpay` to simulate a decline.

## 6. Going live

1. Complete Razorpay KYC and switch to Live Mode in their dashboard.
2. Repeat steps 2–4 with the `rzp_live_...` keys and a new live-mode webhook.
3. Update `VITE_RAZORPAY_KEY_ID` on your hosting provider to the live key and redeploy the frontend.

## Transaction fees

Razorpay charges a percentage-based fee per successful transaction (varies by payment method and your negotiated plan — check your Razorpay dashboard for current rates). This is billed by Razorpay directly and is separate from any developer or hosting cost.
