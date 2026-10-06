// Dynamic sitemap.xml - always reflects the live catalogue, so new products/posts are discoverable
// without a redeploy. Served at /sitemap.xml via the rewrite in vercel.json.
import { SITE_URL, rest, esc, abs } from './_lib.js'

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/collections/new-arrivals', priority: '0.8', changefreq: 'daily' },
  { path: '/collections/best-sellers', priority: '0.8', changefreq: 'weekly' },
  { path: '/collections/sale', priority: '0.7', changefreq: 'daily' },
  { path: '/blog', priority: '0.7', changefreq: 'weekly' },
  { path: '/page/about-us', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'yearly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/care-instructions', priority: '0.4', changefreq: 'yearly' },
]

const day = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : undefined)

function url({ path, lastmod, changefreq, priority, images = [] }) {
  return [
    '  <url>',
    `    <loc>${esc(`${SITE_URL}${path}`)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
    ...images.map((src) => `    <image:image><image:loc>${esc(abs(src))}</image:loc></image:image>`),
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n')
}

export default async function handler(req, res) {
  let products, categories, collections, posts, pages
  try {
    ;[products, categories, collections, posts, pages] = await Promise.all([
    rest('products?select=slug,updated_at,images:product_images(url,is_primary,sort_order)&is_active=eq.true&order=updated_at.desc&limit=5000'),
    rest('categories?select=slug&is_active=eq.true&limit=1000'),
    rest('collections?select=slug&is_active=eq.true&limit=1000'),
    rest('blog_posts?select=slug,updated_at,cover_image_url&is_published=eq.true&order=published_at.desc&limit=2000'),
    rest('static_pages?select=slug,updated_at&limit=200'),
    ])
  } catch {
    res.status(503).send('Sitemap temporarily unavailable')
    return
  }

  const seen = new Set(STATIC_PAGES.map((p) => p.path))
  const entries = STATIC_PAGES.map((p) => url(p))
  const add = (entry) => {
    if (seen.has(entry.path)) return
    seen.add(entry.path)
    entries.push(url(entry))
  }

  for (const c of categories) add({ path: `/category/${c.slug}`, changefreq: 'weekly', priority: '0.8' })
  for (const c of collections) add({ path: `/collections/${c.slug}`, changefreq: 'weekly', priority: '0.7' })
  for (const p of products) {
    const imgs = (p.images ?? [])
      .slice()
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .slice(0, 4)
      .map((i) => i.url)
    add({ path: `/product/${p.slug}`, lastmod: day(p.updated_at), changefreq: 'weekly', priority: '0.8', images: imgs })
  }
  for (const b of posts) add({ path: `/blog/${b.slug}`, lastmod: day(b.updated_at), changefreq: 'monthly', priority: '0.6', images: b.cover_image_url ? [b.cover_image_url] : [] })
  for (const p of pages) add({ path: `/page/${p.slug}`, lastmod: day(p.updated_at), changefreq: 'monthly', priority: '0.4' })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
