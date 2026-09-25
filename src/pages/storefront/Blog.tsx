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
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-luxe-sm transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-blush-100">
                <img
                  src={post.cover_image_url ?? 'https://placehold.co/600x450/FCE7EF/D6336C?text=HerStyleCode'}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                {post.tags.length > 0 && (
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">{post.tags[0]}</p>
                )}
                <h3 className="font-serif text-lg leading-snug text-ink-900 group-hover:text-brand-600">{post.title}</h3>
                {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-ink-500">{post.excerpt}</p>}
                {post.published_at && <p className="mt-3 text-xs text-ink-300">{formatDate(post.published_at)}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
