import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { useSeo } from '@/hooks/useSeo'
import { FullPageSpinner, EmptyState, Badge } from '@/components/ui/Misc'
import type { BlogPost as BlogPostType } from '@/types'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPostType | null>(null)
  const [related, setRelated] = useState<BlogPostType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data as BlogPostType | null)
        setLoading(false)
        if (data) {
          supabase.rpc('increment_blog_view', { post_slug: slug }).then(() => {})
        }
      })
  }, [slug])

  useEffect(() => {
    if (!post) return
    supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .neq('id', post.id)
      .overlaps('tags', post.tags.length > 0 ? post.tags : ['__none__'])
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRelated((data as BlogPostType[]) ?? []))
  }, [post])

  const jsonLd = useMemo(() => {
    if (!post) return undefined
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
      image: post.cover_image_url ?? undefined,
      author: { '@type': 'Organization', name: post.author_name },
      datePublished: post.published_at ?? post.created_at,
      dateModified: post.updated_at,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id])

  useSeo({
    title: post?.seo_title || post?.title || 'Blog',
    description: post?.seo_description ?? post?.excerpt ?? undefined,
    image: post?.cover_image_url ?? undefined,
    jsonLd,
  })

  if (loading) return <FullPageSpinner />
  if (!post) return <EmptyState title="Post not found" action={<Link to="/blog" className="text-sm font-medium text-brand-600 hover:underline">← Back to Blog</Link>} />

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <Link to="/blog" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft size={15} /> Back to Blog
      </Link>

      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} className="mb-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-luxe-sm" />
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {post.tags.map((t) => (
          <Badge key={t} tone="neutral">{t}</Badge>
        ))}
      </div>

      <h1 className="font-serif text-3xl leading-tight text-ink-900 md:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-ink-300">
        By {post.author_name}
        {post.published_at && <> · {formatDate(post.published_at)}</>}
      </p>

      <div className="blog-content mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />

      {related.length > 0 && (
        <div className="mt-16 border-t border-blush-100 pt-8">
          <h2 className="mb-5 font-serif text-xl text-ink-900">More from the Journal</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to={`/blog/${r.slug}`} className="group">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-blush-100">
                  <img
                    src={r.cover_image_url ?? 'https://placehold.co/400x300/FCE7EF/D6336C?text=HerStyleCode'}
                    alt={r.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-ink-900 group-hover:text-brand-600">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
