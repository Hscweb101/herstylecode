/** Canonical public origin of the store. Override with VITE_SITE_URL if the primary domain changes. */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://www.herstylecode.in').replace(/\/$/, '')

export const BRAND_NAME = 'HerStyleCode'
/** People search for the brand written with spaces too, so we always mention both spellings. */
export const BRAND_ALIASES = ['Her Style Code', 'HerStyleCode', 'Her Style Code India', 'herstylecode.in']

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function trimDescription(text: string | null | undefined, max = 158): string | undefined {
  if (!text) return undefined
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return undefined
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

export function breadcrumbLd(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  }
}
