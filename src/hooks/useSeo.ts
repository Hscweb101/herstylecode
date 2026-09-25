import { useEffect } from 'react'

function setMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let tag = document.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

interface SeoOptions {
  title: string
  description?: string
  image?: string
  jsonLd?: object
}

/** Sets document title, meta description/OG tags, and an optional JSON-LD script for the lifetime of the page. */
export function useSeo({ title, description, image, jsonLd }: SeoOptions) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${title} | HerStyleCode`
    if (description) {
      setMetaTag('description', description)
      setMetaTag('og:description', description, 'property')
    }
    setMetaTag('og:title', title, 'property')
    if (image) setMetaTag('og:image', image, 'property')

    let script: HTMLScriptElement | null = null
    if (jsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      document.title = prevTitle
      if (script) document.head.removeChild(script)
    }
  }, [title, description, image, jsonLd])
}
