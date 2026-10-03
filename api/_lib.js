// Shared helpers for the SEO serverless functions (sitemap.xml and per-page meta injection).
// Only public, anon-readable data is used - the same rows the storefront already shows to any visitor.

export const SITE_URL = (process.env.SITE_URL || 'https://www.herstylecode.in').replace(/\/$/, '')
export const BRAND = 'HerStyleCode'

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  return url && key ? { url, key } : null
}

/** GET a PostgREST query. Throws on failure so callers never mistake an outage for "not found". */
export async function rest(pathAndQuery) {
  const cfg = supabaseConfig()
  if (!cfg) throw new Error('Supabase env vars missing')
  const res = await fetch(`${cfg.url}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  return res.json()
}

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function abs(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function trim(text, max = 158) {
  if (!text) return ''
  const clean = String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}
