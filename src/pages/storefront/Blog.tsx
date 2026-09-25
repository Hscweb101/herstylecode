import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { SectionHeading, FullPageSpinner, EmptyState } from '@/components/ui/Misc'
import type { BlogPost } from '@/types'

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useSeo({
    title: 'Blog',
    description: 'Styling tips, jewellery care guides and the latest trends from HerStyleCode.',
  })

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts((data as BlogPost[]) ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <FullPageSpinner />

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <SectionHeading eyebrow="The Journal" title="Style Guides & Stories" />

      {posts.length === 0 ? (
        <EmptyState title="No stories yet" description="We're working on our first post. Check back soon!" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group flex overflow-hidden rounded-2xl bg-white shadow-luxe-sm transition-transform hover:-translate-y-1 sm:block"
            >
              {/* phones: small thumbnail beside the text; sm+: full-width image on top */}
              <div className="aspect-square w-28 shrink-0 overflow-hidden bg-blush-100 sm:aspect-[4/3] sm:w-full">
                <img
                  src={post.cover_image_url ?? 'https://placehold.co/600x450/FCE7EF/D6336C?text=HerStyleCode'}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1 p-3 sm:p-5">
                {post.tags.length > 0 && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-600 sm:mb-1.5 sm:text-xs">{post.tags[0]}</p>
                )}
                <h3 className="line-clamp-2 font-serif text-base leading-snug text-ink-900 group-hover:text-brand-600 sm:text-lg">{post.title}</h3>
                {post.excerpt && <p className="mt-1 line-clamp-2 text-[13px] text-ink-500 sm:mt-2 sm:text-sm">{post.excerpt}</p>}
                {post.published_at && <p className="mt-2 text-xs text-ink-300 sm:mt-3">{formatDate(post.published_at)}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
