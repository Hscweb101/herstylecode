// Keeps the free Supabase project from being paused for inactivity (it pauses after ~7 days idle).
//
// Called by the Vercel Cron job in vercel.json (every 4 days) and by .github/workflows/keepalive.yml.
// It makes one tiny read against the database and reports only { ok: true|false }.
//
// SECURITY: nothing sensitive lives in this file or in the repository. The project URL and key are read
// from Vercel environment variables at runtime (the same VITE_SUPABASE_* values the site already uses),
// and they are never logged or returned in the response.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    return res.status(500).json({ ok: false })
  }

  try {
    const response = await fetch(`${url}/rest/v1/store_settings?select=key&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return res.status(response.ok ? 200 : 502).json({ ok: response.ok })
  } catch {
    return res.status(502).json({ ok: false })
  }
}
