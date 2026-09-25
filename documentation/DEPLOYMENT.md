# Deployment

The frontend is a static Vite build — it can be hosted on any static host. Vercel or Netlify are the simplest for a React+Vite project and both have generous free tiers.

## Build

```bash
npm run build
```

Output goes to `dist/`. `npm run preview` serves that build locally to sanity-check it before deploying.

## Deploying to Vercel (recommended)

1. Push this repository to GitHub/GitLab.
2. In Vercel: **New Project → Import** the repo. Framework preset: **Vite**.
3. Add environment variables (Project Settings → Environment Variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`.
4. Deploy. Vercel auto-detects the build command (`npm run build`) and output directory (`dist`).
5. Add your custom domain under Project Settings → Domains, and point your DNS at Vercel per their instructions.

## Deploying to Netlify

Same idea: connect the repo, build command `npm run build`, publish directory `dist`, add the same three environment variables, then attach your domain.

## Edge Functions & database

These already live inside Supabase and are not part of the frontend deployment — they don't need redeploying when you push frontend changes. Only redeploy them if you edit files under `supabase/functions/`:

```bash
npx supabase functions deploy checkout-create-order --project-ref <ref>
npx supabase functions deploy verify-razorpay-payment --project-ref <ref>
npx supabase functions deploy track-order --project-ref <ref>
npx supabase functions deploy razorpay-webhook --project-ref <ref> --no-verify-jwt
```

(`razorpay-webhook` is the one exception that needs `--no-verify-jwt`, since Razorpay's servers call it directly without a Supabase session — it verifies the request itself using the Razorpay webhook signature instead.)

## SSL / HTTPS

Both Vercel and Netlify provision free, automatic SSL certificates for any domain you attach — no separate action needed.

## Backups

Supabase automatically takes daily backups on paid plans; on the free plan, use **Database → Backups** in the dashboard to trigger manual backups, or `npx supabase db dump` to export a full SQL dump on demand. Do this before any risky schema change.
