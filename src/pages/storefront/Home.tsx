import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, ShieldCheck, RotateCcw, Sparkles, ChevronLeft, ChevronRight, Gem, BadgeCheck, Package, Heart,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchProducts } from '@/lib/queries'
import type { Product, Banner, Review, Category, Reel, Faq, Moment } from '@/types'
import { ProductCard } from '@/components/storefront/ProductCard'
import { ReelsRail } from '@/components/storefront/ReelsRail'
import { QuoteSeparator } from '@/components/storefront/QuoteSeparator'
import { CollapsibleBrandStory } from '@/components/storefront/BrandCopy'
import { SectionHeading, StarRating, FullPageSpinner } from '@/components/ui/Misc'
import { Marquee } from '@/components/ui/Marquee'
import { useCategories } from '@/hooks/useCategories'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'
import storyImg from '@/assets/about/aboutimg1.webp'

function ProductRail({ title, eyebrow, products, viewAllHref }: { title: string; eyebrow: string; products: Product[]; viewAllHref: string }) {
  if (products.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-script mb-1 text-lg text-brand-500">{eyebrow}</p>
          <h2 className="text-2xl text-ink-900 md:text-3xl">{title}</h2>
        </div>
        <Link to={viewAllHref} className="hidden text-sm font-medium text-brand-600 hover:underline md:block">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <Link to={viewAllHref} className="mt-6 block text-center text-sm font-medium text-brand-600 hover:underline md:hidden">
        View All →
      </Link>
    </section>
  )
}

function HeroSlide({ banner }: { banner: Banner | null }) {
  return (
    <div className="relative h-[65vh] min-h-[440px] w-full overflow-hidden bg-blush-100 md:h-[88vh]">
      <picture>
        {banner?.mobile_image_url && <source media="(max-width: 767px)" srcSet={banner.mobile_image_url} />}
        <img
          src={banner?.image_url ?? 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop'}
          alt={banner?.title ?? 'HerStyleCode jewellery'}
          className="absolute inset-0 h-full w-full animate-kenburns object-cover"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/70 via-ink-900/25 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col items-start justify-center px-4 [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] md:px-8">
        <p className="font-script mb-2 text-xl text-brand-200 md:text-2xl">Your Style. Your Rules.</p>
        <h1 className="max-w-2xl text-3xl leading-tight text-white md:text-6xl">
          {banner?.title ?? 'Jewellery That Speaks Your Story'}
        </h1>
        <p className="mt-3 max-w-md text-sm text-white/85 md:text-base">
          {banner?.subtitle ?? 'Curated fashion (artificial) jewellery for every mood, every occasion, every version of you.'}
        </p>
        <Link
          to={banner?.link_url ?? '/collections/new-arrivals'}
          className="mt-6 inline-block rounded-full bg-brand-600 px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-luxe transition-transform hover:scale-105 hover:bg-brand-700"
        >
          {banner?.cta_text ?? 'Shop New Arrivals'}
        </Link>
      </div>
    </div>
  )
}

function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0)
  const slides = banners.length > 0 ? banners : [null]

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => setActive((a) => (a + 1) % slides.length), 5500)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <section className="group relative overflow-hidden">
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${active * 100}%)` }}>
        {slides.map((b, i) => (
          <div key={b?.id ?? i} className="w-full shrink-0">
            <HeroSlide banner={b} />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            aria-label="Previous banner"
            onClick={() => setActive((a) => (a - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink-900 opacity-0 shadow-luxe-sm transition-opacity group-hover:opacity-100 md:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Next banner"
            onClick={() => setActive((a) => (a + 1) % slides.length)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink-900 opacity-0 shadow-luxe-sm transition-opacity group-hover:opacity-100 md:block"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn('h-2 rounded-full transition-all', i === active ? 'w-6 bg-brand-600' : 'w-2 bg-white/70')}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function UspStrip() {
  const items = [
    { icon: Truck, label: 'Pan-India Delivery' },
    { icon: ShieldCheck, label: 'Secure Payments' },
    { icon: RotateCcw, label: '7-Day Easy Returns' },
    { icon: Sparkles, label: 'Premium Quality' },
    { icon: Gem, label: 'Handpicked Designs' },
    { icon: BadgeCheck, label: 'Certified Craftsmanship' },
  ]
  return (
    <section className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 py-4 shadow-luxe-sm">
      <Marquee direction="ltr" speedSeconds={26}>
        {items.map((item) => (
          <span key={item.label} className="mx-8 flex items-center gap-2 whitespace-nowrap text-sm font-medium text-white">
            <item.icon className="text-blush-100" size={18} />
            {item.label}
          </span>
        ))}
      </Marquee>
    </section>
  )
}

function OurStorySection() {
  const { ref, visible } = useInView<HTMLDivElement>(0.15)

  return (
    <section ref={ref} className="bg-cream py-12 md:py-16">
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 md:grid-cols-[1.05fr_1fr] md:gap-12 md:px-8">
        <div
          className={cn(
            'order-2 transition-all duration-1000 ease-out md:sticky md:top-28 md:order-1',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          )}
        >
          <img src={storyImg} alt="The little girl who dreamed" className="mx-auto w-full max-w-lg" />
        </div>

        <div
          className={cn(
            'order-1 transition-all delay-150 duration-1000 ease-out md:order-2',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          )}
        >
          <p className="font-script mb-2 text-lg text-brand-500">Why &ldquo;Her Style Code&rdquo;?</p>
          <h2 className="text-2xl leading-tight text-ink-900 md:text-3xl">The Story Behind Her Style Code</h2>
          <CollapsibleBrandStory />
          <Link
            to="/page/about-us"
            className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-ink-500 transition-colors hover:text-brand-700"
          >
            More about Her Style Code <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function CategoryGrid({ categories }: { categories: Category[] }) {
  const topLevel = categories.filter((c) => !c.parent_id)
  const scrollerRef = { current: null as HTMLDivElement | null }
  const scrollBy = (dir: 1 | -1) => scrollerRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  if (topLevel.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-script mb-1 text-lg text-brand-500">Curated For You</p>
          <h2 className="text-2xl text-ink-900 md:text-3xl">Shop by Category</h2>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            aria-label="Scroll categories left"
            onClick={() => scrollBy(-1)}
            className="rounded-full border border-blush-200 p-2 text-ink-700 hover:bg-blush-50"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Scroll categories right"
            onClick={() => scrollBy(1)}
            className="rounded-full border border-blush-200 p-2 text-ink-700 hover:bg-blush-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={(el) => { scrollerRef.current = el }} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 md:gap-6">
        {topLevel.map((c) => (
          <Link
            key={c.id}
            to={`/category/${c.slug}`}
            className="group flex w-[42%] shrink-0 snap-start flex-col items-center gap-3 text-center sm:w-[30%] md:w-[19%]"
          >
            <div className="cylinder-shape aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-blush-100 to-blush-200 shadow-luxe transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-luxe">
              {c.video_url ? (
                <video
                  src={c.video_url}
                  poster={c.image_url ?? undefined}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={c.image_url ?? `https://placehold.co/400x520/FCE7EF/D6336C?text=${encodeURIComponent(c.name)}`}
                  alt={c.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
            </div>
            <div>
              <span className="block text-sm font-medium text-ink-700 md:text-base">{c.name}</span>
              {c.description && <span className="mt-0.5 hidden text-xs text-ink-300 md:block">{c.description}</span>}
            </div>
          </Link>
        ))}
        <Link
          to="/shop"
          className="group flex w-[42%] shrink-0 snap-start flex-col items-center justify-center gap-2 text-center sm:w-[30%] md:w-[19%]"
        >
          <div className="cylinder-shape flex aspect-[3/4] w-full items-center justify-center gap-1 bg-blush-50 text-brand-600 shadow-luxe transition-transform duration-300 group-hover:-translate-y-1">
            <span className="text-sm font-medium">View All</span>
            <ChevronRight size={16} />
          </div>
        </Link>
      </div>
    </section>
  )
}

function momentHref(m: Moment): string {
  if (m.link_type === 'product') return m.product?.slug ? `/product/${m.product.slug}` : '#'
  if (m.link_type === 'category') return m.category?.slug ? `/category/${m.category.slug}` : '#'
  return m.custom_url || '#'
}

function MomentsSection({ moments }: { moments: Moment[] }) {
  if (moments.length === 0) return null
  return (
    <section className="bg-blush-50 py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading eyebrow="Designed For Your" title="Every Moment" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 md:gap-6">
          {moments.map((m) => (
            <Link key={m.id} to={momentHref(m)} className="group flex flex-col items-center gap-3 text-center">
              <div className="cylinder-shape aspect-[3/4] w-full overflow-hidden bg-blush-200 shadow-luxe transition-transform duration-300 group-hover:-translate-y-1">
                <img src={m.image_url ?? 'https://placehold.co/400x520/FCE7EF/D6336C?text=HerStyleCode'} alt={m.label} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{m.label}</p>
                {m.description && <p className="text-xs text-ink-300">{m.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqHomeSection({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null)
  if (faqs.length === 0) return null
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <SectionHeading eyebrow="Good To Know" title="Frequently Asked Questions" />
      <div>
        {faqs.map((f) => (
          <div key={f.id} className="border-b border-blush-100 py-4">
            <button onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-4 text-left">
              <span className="font-medium text-ink-900">{f.question}</span>
              <span className="shrink-0 text-lg text-brand-500">{open === f.id ? '−' : '+'}</span>
            </button>
            {open === f.id && <p className="mt-2 text-sm text-ink-500">{f.answer}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link to="/faq" className="text-sm font-medium text-brand-600 hover:underline">View All FAQs →</Link>
      </div>
    </section>
  )
}

function InstagramGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function BrandBand() {
  const { settings } = useStoreSettings()
  const perks = [
    { icon: Sparkles, label: 'Premium Quality' },
    { icon: ShieldCheck, label: 'Made For Sensitive Skin' },
    { icon: BadgeCheck, label: 'Long Lasting Shine' },
    { icon: Package, label: 'Beautifully Packaged' },
  ]
  return (
    <section className="relative overflow-hidden py-14 text-center">
      <img
        src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1600&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-cream/90 via-cream/80 to-blush-100/80" />
      <svg className="absolute -left-6 -top-6 h-28 w-28 text-brand-300/50 md:h-36 md:w-36" viewBox="0 0 100 100" fill="none">
        <path d="M10 90C10 60 20 20 60 10M20 55C30 55 42 50 45 38M28 72C36 72 46 68 50 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <svg className="absolute -bottom-6 -right-6 h-28 w-28 rotate-180 text-brand-300/50 md:h-36 md:w-36" viewBox="0 0 100 100" fill="none">
        <path d="M10 90C10 60 20 20 60 10M20 55C30 55 42 50 45 38M28 72C36 72 46 68 50 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <div className="relative mx-auto flex max-w-xl flex-col items-center px-4">
        <p className="font-script flex items-center gap-2 text-2xl text-brand-500">
          <Heart size={18} className="fill-brand-400 text-brand-400" /> HerStyleCode
        </p>
        <h2 className="mt-1 text-2xl text-ink-900 md:text-3xl">Elegant Style &amp; Fashion</h2>
        {settings.social_links.instagram && (
          <a
            href={settings.social_links.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            <InstagramGlyph /> Follow For More
          </a>
        )}
        <div className="mt-9 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {perks.map((p) => (
            <div key={p.label} className="flex flex-col items-center gap-2">
              <p.icon size={22} className="text-brand-500" />
              <p className="text-xs font-medium text-ink-700">{p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReviewsRail({ reviews }: { reviews: (Review & { product_name?: string })[] }) {
  if (reviews.length === 0) return null
  return (
    <section className="bg-blush-50 py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading eyebrow="Loved By Customers" title="What They're Saying" />
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-6 shadow-luxe-sm">
              <StarRating rating={r.rating} />
              {r.title && <p className="mt-3 font-serif text-lg text-ink-900">{r.title}</p>}
              <p className="mt-2 text-sm text-ink-500">{r.body}</p>
              <p className="mt-4 text-xs font-medium text-brand-600">— {r.reviewer_name}{r.product_name ? `, on ${r.product_name}` : ''}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [heroBanners, setHeroBanners] = useState<Banner[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [trending, setTrending] = useState<Product[]>([])
  const [reviews, setReviews] = useState<(Review & { product_name?: string })[]>([])
  const [reels, setReels] = useState<Reel[]>([])
  const [moments, setMoments] = useState<Moment[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const { categories } = useCategories()

  useEffect(() => {
    async function load() {
      const [banners, na, bs, tr, rv, rl, mo, fq] = await Promise.all([
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order').limit(5),
        fetchProducts({ flag: 'is_new_arrival', limit: 8 }),
        fetchProducts({ flag: 'is_bestseller', limit: 8 }),
        fetchProducts({ flag: 'is_trending', limit: 8 }),
        supabase
          .from('reviews')
          .select('*, product:products(name)')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('reels').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('moments').select('*, product:products(slug), category:categories(slug)').eq('is_active', true).order('sort_order'),
        supabase.from('faqs').select('*').eq('is_active', true).order('sort_order').limit(6),
      ])
      setHeroBanners((banners.data as Banner[]) ?? [])
      setNewArrivals(na)
      setBestSellers(bs)
      setTrending(tr)
      setReviews(
        ((rv.data as unknown as (Review & { product?: { name: string } })[]) ?? []).map((r) => ({ ...r, product_name: r.product?.name })),
      )
      setReels((rl.data as Reel[]) ?? [])
      setMoments((mo.data as unknown as Moment[]) ?? [])
      setFaqs((fq.data as Faq[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <HeroCarousel banners={heroBanners} />
      <UspStrip />
      <CategoryGrid categories={categories} />
      <ProductRail title="New Arrivals" eyebrow="Fresh In" products={newArrivals} viewAllHref="/collections/new-arrivals" />
      <ProductRail title="Best Sellers" eyebrow="Customer Favourites" products={bestSellers} viewAllHref="/collections/best-sellers" />
      <ProductRail title="Trending Now" eyebrow="What's Hot" products={trending} viewAllHref="/collections/trending" />
      <ReelsRail reels={reels} />
      <MomentsSection moments={moments} />
      <QuoteSeparator />
      <ReviewsRail reviews={reviews} />
      <FaqHomeSection faqs={faqs} />
      <BrandBand />
      <OurStorySection />
    </div>
  )
}
