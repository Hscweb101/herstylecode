// Server-side meta injection for the single-page app.
//
// The storefront is a client-rendered React app, so without this every URL would ship the same generic
// <head> to crawlers and link-preview bots (WhatsApp, Facebook, Google's first pass). Vercel rewrites
// product / category / collection / blog / page URLs here; we look the item up in Supabase (public data
// only), then return the normal built index.html with a page-specific title, description, canonical URL,
// Open Graph / Twitter tags, JSON-LD and a small crawlable text block. React then boots as usual.
import fs from 'node:fs'
import path from 'node:path'
import { SITE_URL, BRAND, rest, esc, abs, trim } from './_lib.js'

const STATIC_META = {
  shop: {
    title: 'Shop Fashion Jewellery Online - Earrings, Necklaces, Rings & Bangles | HerStyleCode',
    description: 'Shop all HerStyleCode (Her Style Code) fashion & artificial jewellery online in India - earrings, necklaces, rings, bangles and sets. Free shipping above ₹999, COD available.',
    path: '/shop',
    h1: 'Shop Fashion Jewellery Online',
  },
  blog: {
    title: 'Jewellery Style Guides, Care Tips & Trends - HerStyleCode Journal',
    description: 'Styling tips, jewellery care guides and the latest fashion jewellery trends from HerStyleCode (Her Style Code).',
    path: '/blog',
    h1: 'HerStyleCode Journal',
  },
  faq: {
    title: 'FAQ - Shipping, Returns, COD & Jewellery Care | HerStyleCode',
    description: 'Answers about HerStyleCode orders, shipping, Cash on Delivery, returns and jewellery care.',
    path: '/faq',
    h1: 'Frequently Asked Questions',
  },
  contact: {
    title: 'Contact HerStyleCode (Her Style Code) - Customer Support',
    description: 'Get in touch with the HerStyleCode team for order help, product questions or collaborations. We reply fast on email and WhatsApp.',
    path: '/contact',
    h1: 'Contact Us',
  },
  'about-us': {
    title: 'About HerStyleCode (Her Style Code) - Our Story & Jewellery Philosophy',
    description: 'HerStyleCode is a modern Indian fashion jewellery brand - "Your Style. Your Rules." Learn our story and why we design jewellery for every mood and moment.',
    path: '/page/about-us',
    h1: 'About HerStyleCode',
  },
}

let cachedTemplate = null
async function loadTemplate(req) {
  if (cachedTemplate) return cachedTemplate
  for (const candidate of [path.join(process.cwd(), 'dist', 'index.html'), path.join(process.cwd(), 'index.html')]) {
    try {
      const html = fs.readFileSync(candidate, 'utf8')
      if (html.includes('id="root"')) return (cachedTemplate = html)
    } catch {
      /* try next */
    }
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const res = await fetch(`https://${host}/index.html`)
  return (cachedTemplate = await res.text())
}

async function productMeta(slug) {
  const [p] = await rest(
    `products?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=name,slug,sku,short_description,description,price,compare_at_price,stock_quantity,track_inventory,material,colour,rating_avg,rating_count,seo_title,seo_description,category:categories(name,slug),images:product_images(url,is_primary,sort_order)&limit=1`,
  )
  if (!p) return null
  const images = (p.images ?? []).slice().sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order).map((i) => abs(i.url))
  const inStock = !p.track_inventory || p.stock_quantity > 0
  const priceTxt = `₹${Number(p.price).toLocaleString('en-IN')}`
  const description =
    p.seo_description ||
    trim(`Buy ${p.name} online at HerStyleCode (Her Style Code) for ${priceTxt}. ${p.short_description || p.description || ''} Free shipping above ₹999, COD available.`)
  const canonicalPath = `/product/${p.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: trim(p.short_description || p.description || p.name, 500),
      sku: p.sku,
      image: images,
      brand: { '@type': 'Brand', name: BRAND },
      ...(p.material ? { material: p.material } : {}),
      ...(p.colour ? { color: p.colour } : {}),
      ...(p.category ? { category: p.category.name } : {}),
      offers: {
        '@type': 'Offer',
        url: abs(canonicalPath),
        priceCurrency: 'INR',
        price: String(p.price),
        itemCondition: 'https://schema.org/NewCondition',
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: BRAND },
      },
      ...(p.rating_count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(p.rating_avg), reviewCount: String(p.rating_count) } } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: abs('/shop') },
        ...(p.category ? [{ '@type': 'ListItem', position: 3, name: p.category.name, item: abs(`/category/${p.category.slug}`) }] : []),
        { '@type': 'ListItem', position: p.category ? 4 : 3, name: p.name, item: abs(canonicalPath) },
      ],
    },
  ]
  return {
    title: p.seo_title ? withBrand(p.seo_title) : `${p.name} - Buy Online in India | ${BRAND}`,
    description,
    path: canonicalPath,
    image: images[0],
    type: 'product',
    jsonLd,
    h1: p.name,
    body: trim(p.description || p.short_description || '', 600),
  }
}

async function listingMeta(table, slug, base) {
  const [row] = await rest(`${table}?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=name,slug,description,image_url${table === 'categories' ? ',seo_title,seo_description' : ''}&limit=1`)
  if (!row) return null
  const canonicalPath = `${base}/${row.slug}`
  return {
    title: row.seo_title ? withBrand(row.seo_title) : `${row.name} - Buy ${row.name} Online | ${BRAND}`,
    description: row.seo_description || trim(row.description || `Shop ${row.name} at HerStyleCode (Her Style Code) - trendy fashion jewellery with free shipping above ₹999 and COD across India.`),
    path: canonicalPath,
    image: row.image_url,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: row.name,
        url: abs(canonicalPath),
        isPartOf: { '@type': 'WebSite', name: BRAND, url: SITE_URL },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
          { '@type': 'ListItem', position: 2, name: 'Shop', item: abs('/shop') },
          { '@type': 'ListItem', position: 3, name: row.name, item: abs(canonicalPath) },
        ],
      },
    ],
    h1: row.name,
    body: trim(row.description || '', 400),
  }
}

async function blogMeta(slug) {
  const [post] = await rest(
    `blog_posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=title,slug,excerpt,cover_image_url,author_name,published_at,created_at,updated_at,seo_title,seo_description&limit=1`,
  )
  if (!post) return null
  const canonicalPath = `/blog/${post.slug}`
  return {
    title: withBrand(post.seo_title || post.title),
    description: post.seo_description || trim(post.excerpt || post.title),
    path: canonicalPath,
    image: post.cover_image_url,
    type: 'article',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.seo_description || post.excerpt || undefined,
        image: post.cover_image_url ? [abs(post.cover_image_url)] : undefined,
        author: { '@type': 'Organization', name: post.author_name || BRAND },
        publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: abs('/logo.png') } },
        mainEntityOfPage: abs(canonicalPath),
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at,
      },
    ],
    h1: post.title,
    body: trim(post.excerpt || '', 400),
  }
}

async function pageMeta(slug) {
  const fallback = STATIC_META[slug]
  const [row] = await rest(`static_pages?slug=eq.${encodeURIComponent(slug)}&select=title,slug,content,seo_title,seo_description&limit=1`)
  if (!row) return fallback ? { ...fallback } : null
  const canonicalPath = `/page/${row.slug}`
  if (fallback && slug === 'about-us') return { ...fallback }
  return {
    title: withBrand(row.seo_title || row.title),
    description: row.seo_description || trim(row.content || `${row.title} - ${BRAND}`),
    path: canonicalPath,
    h1: row.title,
    body: trim(row.content, 400),
  }
}

// Appends the brand to a title unless it is already there (admin-written SEO titles often include it).
const withBrand = (t) => (/her *style *code/i.test(t) ? t : `${t} | ${BRAND}`)

function headBlock(meta) {
  const image = meta.image ? abs(meta.image) : abs('/og-image.png')
  const canonical = abs(meta.path)
  const lines = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:type" content="${meta.type || 'website'}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ...(meta.jsonLd ?? []).map((ld) => `<script type="application/ld+json" data-seo-page="1">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`),
  ]
  return lines.join('\n    ')
}

function render(template, meta) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
  html = html.replace('</head>', `    ${headBlock(meta)}\n  </head>`)
  const staticBody = `<!--seo-root-start--><div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"><h1>${esc(meta.h1 || meta.title)}</h1><p>${esc(meta.body || meta.description)}</p><a href="/">${BRAND} - Her Style Code</a> <a href="/shop">Shop</a></div><!--seo-root-end-->`
  return html.replace(/<!--seo-root-start-->[\s\S]*?<!--seo-root-end-->/, staticBody)
}

function lookup(type, slug) {
  if (type === 'product') return productMeta(slug)
  if (type === 'category') return listingMeta('categories', slug, '/category')
  if (type === 'collection') return listingMeta('collections', slug, '/collections')
  if (type === 'blogpost') return blogMeta(slug)
  if (type === 'page') return pageMeta(slug)
  if (STATIC_META[type]) return Promise.resolve({ ...STATIC_META[type] })
  return Promise.resolve(null)
}

export default async function handler(req, res) {
  const type = String(req.query.type || '')
  const slug = String(req.query.slug || '').toLowerCase()

  let template
  try {
    template = await loadTemplate(req)
  } catch {
    res.status(502).send('Temporarily unavailable')
    return
  }

  let meta = null
  try {
    meta = await lookup(type, slug)
  } catch {
    // Database hiccup: serve the plain app shell (the client sets its own meta) and don't cache it.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(template)
    return
  }

  // Unknown slug: serve the app (it shows its own "not found") with a real 404 status and noindex.
  const notFound = !meta
  if (notFound) meta = { title: `Page not found | ${BRAND}`, description: `This page could not be found on ${BRAND}.`, path: '/', noindex: true, h1: 'Page not found' }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', notFound ? 'public, s-maxage=60' : 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(notFound ? 404 : 200).send(render(template, meta))
}
