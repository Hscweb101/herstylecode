# Environment Variables

Copy `.env.example` to `.env.local` for local development. `.env.local` is git-ignored and already filled in with working values for the current Supabase project.

## Frontend (safe to expose in the browser — prefixed `VITE_`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | The public "anon" API key. Safe to expose — access is controlled entirely by Row Level Security, not by keeping this secret. |
| `VITE_RAZORPAY_KEY_ID` | Razorpay **publishable** Key ID only (`rzp_test_...` or `rzp_live_...`). See `RAZORPAY_SETUP.md`. |

## Server-side only (Supabase Edge Function secrets — never in frontend code)

Set these with `npx supabase secrets set KEY=value --project-ref <ref>`, never as `VITE_` variables:

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses Row Level Security entirely. Auto-available inside Edge Functions already — you generally don't need to set this manually. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Used server-side to create Razorpay orders and verify payment signatures. |
| `RAZORPAY_WEBHOOK_SECRET` | Used to verify that webhook calls really came from Razorpay. |

## One-time setup only (not needed for the app to run day-to-day)

| Variable | Description |
|---|---|
| `SUPABASE_DB_PASSWORD` / `SUPABASE_DB_URL` | Direct Postgres connection, used only for running the SQL migrations in `supabase/migrations/`. |
| `SUPABASE_ACCESS_TOKEN` | A short-lived (7-day) personal access token used once to deploy the Edge Functions via the Supabase CLI during initial setup. It will simply expire on its own; safe to ignore or delete. |

## Where to set these in production

Whatever static host you deploy the frontend to (Vercel, Netlify, Cloudflare Pages, etc.), add the three `VITE_...` variables in that provider's dashboard under Environment Variables, then redeploy. The Edge Function secrets live in Supabase itself (`supabase secrets set`) and are independent of where the frontend is hosted.
