import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import type { StaticPage as StaticPageType } from '@/types'
import { FullPageSpinner, EmptyState } from '@/components/ui/Misc'
import { useSeo } from '@/hooks/useSeo'
import { trimDescription } from '@/lib/seo'

const CONTACT_BLOCK_SLUGS = new Set([
  'terms-conditions',
  'privacy-policy',
  'shipping-policy',
  'returns-refund-policy',
  'cancellation-policy',
])

export default function StaticPage() {
  const { slug } = useParams()
  const store = useStoreSettings().settings.store_info
  const [page, setPage] = useState<StaticPageType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase
      .from('static_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        setPage(data as StaticPageType)
        setLoading(false)
      })
  }, [slug])

  useSeo({
    title: page?.seo_title || page?.title || 'Page',
    description: page?.seo_description || trimDescription(page?.content),
    path: slug ? `/page/${slug}` : undefined,
    noindex: !loading && !page,
  })

  if (loading) return <FullPageSpinner />
  if (!page) return <EmptyState title="Page not found" />

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <h1 className="mb-6 font-serif text-3xl">{page.title}</h1>
      <div className="blog-content max-w-none text-ink-700" dangerouslySetInnerHTML={{ __html: page.content }} />
      {CONTACT_BLOCK_SLUGS.has(page.slug) && (
        <div className="mt-10 rounded-2xl bg-white p-6 shadow-luxe-sm">
          <h2 className="mb-3 font-serif text-xl">Contact us</h2>
          <ul className="space-y-1 text-sm text-ink-700">
            <li><span className="text-ink-300">Business name:</span> {store.name}</li>
            {store.address && <li><span className="text-ink-300">Address:</span> {store.address}</li>}
            <li><span className="text-ink-300">Email:</span> <a href={`mailto:${store.support_email}`}>{store.support_email}</a></li>
            <li><span className="text-ink-300">Phone:</span> <a href={`tel:${store.support_phone.replace(/\s/g, '')}`}>{store.support_phone}</a></li>
          </ul>
        </div>
      )}
    </div>
  )
}
