import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BRAND_NAME, DEFAULT_OG_IMAGE, SITE_URL, absoluteUrl } from '@/lib/seo'

function setMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let tag = document.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

interface SeoOptions {
  /** Page title. ` | HerStyleCode` is appended unless `absoluteTitle` is set. */
  title: string
  description?: string
  image?: string
  /** Page path for the canonical URL (defaults to the current path, without query string). */
  path?: string
  /** Use `title` exactly as given (used by the home page). */
  absoluteTitle?: boolean
  /** Keep the page out of Google (cart, checkout, account, ...). */
  noindex?: boolean
  type?: 'website' | 'article' | 'product'
  jsonLd?: object | object[]
}

const DEFAULT_DESCRIPTION =
  'HerStyleCode (Her Style Code) - shop trendy artificial & fashion jewellery online in India: earrings, necklaces, rings, bangles and sets. Free shipping above ₹999, Cash on Delivery.'

/** Sets title, description, canonical, robots, Open Graph / Twitter tags and JSON-LD for the lifetime of the page. */
export function useSeo({ title, description, image, path, absoluteTitle, noindex, type = 'website', jsonLd }: SeoOptions) {
  const location = useLocation()
  const canonicalPath = path ?? location.pathname
  const ldKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const prevTitle = document.title
    const fullTitle = absoluteTitle || /her *style *code/i.test(title) ? title : `${title} | ${BRAND_NAME}`
    const desc = description || DEFAULT_DESCRIPTION
    const url = absoluteUrl(canonicalPath)
    const img = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE

    document.title = fullTitle
    setMetaTag('description', desc)
    setMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1')
    setCanonical(url)
    setMetaTag('og:title', fullTitle, 'property')
    setMetaTag('og:description', desc, 'property')
    setMetaTag('og:url', url, 'property')
    setMetaTag('og:type', type === 'product' ? 'product' : type, 'property')
    setMetaTag('og:site_name', BRAND_NAME, 'property')
    setMetaTag('og:image', img, 'property')
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', fullTitle)
    setMetaTag('twitter:description', desc)
    setMetaTag('twitter:image', img)

    // Page-specific structured data replaces any server-injected copy for this page.
    document.querySelectorAll('script[data-seo-page]').forEach((n) => n.remove())
    const scripts: HTMLScriptElement[] = []
    if (ldKey) {
      const items = JSON.parse(ldKey)
      for (const item of Array.isArray(items) ? items : [items]) {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.dataset.seoPage = '1'
        script.text = JSON.stringify(item)
        document.head.appendChild(script)
        scripts.push(script)
      }
    }

    return () => {
      document.title = prevTitle
      scripts.forEach((s) => s.remove())
    }
  }, [title, description, image, canonicalPath, absoluteTitle, noindex, type, ldKey])
}

export { SITE_URL }
