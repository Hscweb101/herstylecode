import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, ShieldCheck, RotateCcw, Sparkles, ChevronLeft, ChevronRight, Gem, CircleDot, BadgeCheck, Package, Heart,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchProducts } from '@/lib/queries'
import type { Product, Banner, Category, Reel, Faq, Moment } from '@/types'
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
import { useSeo } from '@/hooks/useSeo'
import storyImg from '@/assets/about/aboutimg1.webp'

function SectionHeader({ eyebrow, title, subtitle, tagline, viewAllHref }: { eyebrow: string; title: string; subtitle: string; tagline?: string; viewAllHref?: string }) {
  return (
    <div className="mb-7 flex items-start justify-between gap-6 md:mb-9">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 text-brand-400">
          <span className="text-[11px] font-medium uppercase tracking-[0.3em] md:text-xs">{eyebrow}</span>
          <span className="h-px max-w-56 flex-1 bg-brand-300/70" />
          <Sparkles size={13} className="fill-current" />
        </div>
        <h2 className="mt-2 text-4xl font-semibold leading-tight text-brand-600 md:text-6xl">{title}</h2>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-brand-400 md:text-xs">{subtitle}</p>
      </div>
      <div className="hidden shrink-0 items-center gap-8 md:flex">
        {tagline && <p className="font-script max-w-[9rem] text-right text-2xl leading-tight text-brand-400">{tagline}</p>}
        {viewAllHref && (
          <Link to={viewAllHref} className="rounded-full border border-brand-600 px-6 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-600 hover:text-cream">
            View All →
          </Link>
        )}
      </div>
    </div>
  )
}

function ProductRail({
  title, eyebrow, subtitle, tagline, products, viewAllHref, cols = 4,
}: { title: string; eyebrow: string; subtitle: string; tagline: string; products: Product[]; viewAllHref: string; cols?: 4 | 5 }) {
  if (products.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-12">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} tagline={tagline} viewAllHref={viewAllHref} />
      <div className={cn('grid grid-cols-2 gap-3.5 md:gap-5', cols === 5 ? 'md:grid-cols-5' : 'md:grid-cols-4')}>
        {products.slice(0, cols).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-7 text-center md:hidden">
        <Link to={viewAllHref} className="inline-block rounded-full border border-brand-600 px-6 py-2.5 text-sm font-medium text-brand-600">
          View All →
        </Link>
      </div>
    </section>
  )
}

function HeroSlide({ banner }: { banner: Banner | null }) {
  /* Sizes are in vw so the text block scales with the image exactly like the design reference
     (text sits left, burgundy serif title, dusty-pink eyebrow, short rule, burgundy pill button). */
  return (
    <div className="relative h-[82svh] min-h-[500px] w-full overflow-hidden bg-blush-100 md:aspect-[16/9] md:h-auto md:max-h-[92vh] md:min-h-0">
      <picture>
        {banner?.mobile_image_url && <source media="(max-width: 767px)" srcSet={banner.mobile_image_url} />}
        <img
          src={banner?.image_url ?? 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop'}
          alt={banner?.title ?? 'HerStyleCode jewellery'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <div className="relative flex h-full flex-col items-start justify-center pb-[10%] pl-[5.5vw] pr-[6vw] md:pb-[3%] md:pl-[16vw]">
        <p className="text-[3.1vw] font-semibold uppercase tracking-[0.2em] text-brand-400 md:text-[0.9vw]">Your Style. Your Rules.</p>
        <h1 className="mt-[1.6vw] max-w-[8.5em] text-balance text-[10vw] font-medium leading-[1.04] tracking-tight text-brand-600 md:mt-[0.8vw] md:text-[4.5vw]">
          {banner?.title ?? 'Jewellery That Speaks Your Story'}
        </h1>
        <span className="my-[3vw] block h-[2px] w-[20vw] bg-brand-600 md:my-[1.6vw] md:w-[7vw]" />
        <p className="max-w-[12em] font-serif text-[4.5vw] leading-snug text-brand-600 md:max-w-[12.5em] md:text-[1.5vw]">
          {banner?.subtitle ?? 'Curated fashion (artificial) jewellery for every mood, every occasion, every version of you.'}
        </p>
        <Link
          to={banner?.link_url ?? '/collections/new-arrivals'}
          className="mt-[5vw] inline-flex items-center gap-[2vw] rounded-full bg-brand-600 px-[7vw] py-[3.2vw] font-serif text-[4.6vw] text-cream shadow-luxe transition-transform hover:scale-105 hover:bg-brand-700 md:mt-[2.2vw] md:gap-[0.8vw] md:px-[2.3vw] md:py-[0.95vw] md:text-[1.35vw]"
        >
          {banner?.cta_text ?? 'Shop New Arrivals'}
          <ChevronRight className="h-[1.1em] w-[1.1em]" />
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
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-cream/90 p-2 text-brand-600 opacity-0 shadow-luxe-sm transition-opacity group-hover:opacity-100 md:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Next banner"
            onClick={() => setActive((a) => (a + 1) % slides.length)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-cream/90 p-2 text-brand-600 opacity-0 shadow-luxe-sm transition-opacity group-hover:opacity-100 md:block"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn('h-2 rounded-full transition-all', i === active ? 'w-6 bg-brand-600' : 'w-2 bg-brand-600/30')}
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
          <p className="font-script mb-2 text-xl font-semibold text-brand-400">Why &ldquo;Her Style Code&rdquo;?</p>
          <h2 className="text-2xl font-bold leading-tight text-brand-600 md:text-3xl">The Story Behind Her Style Code</h2>
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

function categoryIcon(c: Category) {
  const k = `${c.slug} ${c.name}`.toLowerCase()
  if (k.includes('ring')) return CircleDot
  if (k.includes('set')) return Gem
  return Sparkles
}

function CategoryGrid({ categories }: { categories: Category[] }) {
  const topLevel = categories.filter((c) => !c.parent_id)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: 1 | -1) => scrollerRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  if (topLevel.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-7 flex items-start justify-between gap-6 md:mb-9">
        <div>
          <div className="flex items-center gap-3 text-brand-400">
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] md:text-xs">Curated For You</span>
            <span className="h-px w-24 bg-brand-300/70 md:w-40" />
            <Sparkles size={13} className="fill-current" />
          </div>
          <h2 className="mt-2 text-4xl font-semibold leading-tight text-brand-600 md:text-6xl">Shop by Category</h2>
          <span className="mt-3 block h-px w-48 bg-brand-300/70 md:w-72" />
        </div>
        <p className="hidden max-w-[14rem] text-right text-xs uppercase leading-relaxed tracking-[0.3em] text-brand-400 md:block">
          Explore pieces for every side of you
        </p>
      </div>
      {/* scroll-px keeps the first card clear of the screen edge when it snaps into place */}
      <div ref={scrollerRef} className="scrollbar-none -mx-4 flex scroll-px-4 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:gap-5">
        {topLevel.map((c) => {
          const Icon = categoryIcon(c)
          return (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="group flex w-[62%] shrink-0 snap-start flex-col overflow-hidden rounded-t-[999px] rounded-b-3xl border border-brand-300/50 bg-cream shadow-[0_10px_26px_-12px_rgba(96,6,25,0.3)] transition-transform duration-300 hover:-translate-y-1 sm:w-[34%] md:w-[calc((100%-5rem)/5)]"
            >
              <div className="aspect-[3/3.6] w-full overflow-hidden bg-gradient-to-b from-blush-100 to-blush-200">
                {c.video_url ? (
                  <video
                    src={c.video_url}
                    poster={c.image_url ?? undefined}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={c.image_url ?? `https://placehold.co/400x520/EFE3CD/600619?text=${encodeURIComponent(c.name)}`}
                    alt={c.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex items-center gap-3 bg-white/70 px-3.5 py-3">
                <Icon size={22} strokeWidth={1.4} className="shrink-0 text-brand-600" />
                <span className="h-7 w-px shrink-0 bg-brand-300/60" />
                <span className="min-w-0 flex-1 text-center font-serif text-[15px] leading-tight text-brand-600 md:text-base">{c.name}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-300 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-cream">
                  <ChevronRight size={15} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-2.5">
        <button
          aria-label="Scroll categories left"
          onClick={() => scrollBy(-1)}
          className="rounded-full border border-brand-300 p-2 text-brand-600 transition-colors hover:bg-brand-600 hover:text-cream active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="Scroll categories right"
          onClick={() => scrollBy(1)}
          className="rounded-full border border-brand-300 p-2 text-brand-600 transition-colors hover:bg-brand-600 hover:text-cream active:scale-95"
        >
          <ChevronRight size={18} />
        </button>
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

/* Static on purpose (not loaded from the database). Edit the text below to change what shows on the home page. */
const TESTIMONIALS = [
  { quote: 'The earrings look so much more expensive than they are. I wore them to a wedding and got compliments all night.', name: 'Priya S.', place: 'Mumbai', item: 'Statement Earrings' },
  { quote: 'Lightweight, no skin irritation and the shine is still perfect after weeks. The packaging felt like a gift.', name: 'Ananya R.', place: 'Bengaluru', item: 'Necklace Set' },
  { quote: 'Finally a jewellery brand that gets my style. Delivery was quick and the pieces match the photos exactly.', name: 'Neha K.', place: 'Delhi', item: 'Jhumka Collection' },
]

function ReviewsRail() {
  return (
    <section className="relative overflow-hidden bg-brand-600 py-16 md:py-20">
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand-400/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-brand-400/15 blur-2xl" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 text-center">
          <p className="font-script mb-1 text-xl font-semibold text-brand-400 md:text-2xl">Loved By Customers</p>
          <h2 className="text-3xl font-bold text-cream md:text-4xl">What They&rsquo;re Saying</h2>
          <span className="mx-auto mt-4 block h-px w-16 bg-brand-400" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="group relative flex flex-col rounded-3xl bg-cream p-7 pt-9 shadow-luxe transition-transform duration-300 hover:-translate-y-1.5"
            >
              <span className="absolute -top-5 left-7 flex h-11 w-11 items-center justify-center rounded-full bg-brand-400 font-serif text-3xl leading-none text-cream shadow-luxe-sm">
                <span className="translate-y-[3px]">&ldquo;</span>
              </span>
              <StarRating rating={5} />
              <blockquote className="mt-4 flex-1 font-serif text-[17px] leading-relaxed text-brand-600">{t.quote}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-brand-400/30 pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-cream">{t.name[0]}</span>
                <span className="text-sm">
                  <span className="block font-semibold text-brand-600">{t.name}</span>
                  <span className="block text-xs text-brand-400">{t.place} &middot; {t.item}</span>
                </span>
              </figcaption>
            </figure>
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
  const [reels, setReels] = useState<Reel[]>([])
  const [moments, setMoments] = useState<Moment[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const { categories } = useCategories()

  useSeo({
    title: 'Her Style Code | Fashion & Artificial Jewellery Online India - HerStyleCode',
    absoluteTitle: true,
    description:
      'HerStyleCode (Her Style Code) - shop trendy artificial & fashion jewellery online in India: earrings, necklaces, rings, bangles and sets. Free shipping above ₹999, Cash on Delivery, easy returns.',
    path: '/',
  })

  useEffect(() => {
    async function load() {
      const [banners, na, bs, tr, rl, mo, fq] = await Promise.all([
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order').limit(5),
        fetchProducts({ flag: 'is_new_arrival', limit: 8 }),
        fetchProducts({ flag: 'is_bestseller', limit: 8 }),
        fetchProducts({ flag: 'is_trending', limit: 8 }),
        supabase.from('reels').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('moments').select('*, product:products(slug), category:categories(slug)').eq('is_active', true).order('sort_order'),
        supabase.from('faqs').select('*').eq('is_active', true).order('sort_order').limit(6),
      ])
      setHeroBanners((banners.data as Banner[]) ?? [])
      setNewArrivals(na)
      setBestSellers(bs)
      setTrending(tr)
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
      <ProductRail title="New Arrivals" eyebrow="Fresh In" subtitle="Discover what's new" tagline="Fresh Picks Just For You" products={newArrivals} viewAllHref="/collections/new-arrivals" />
      <ProductRail title="Best Sellers" eyebrow="Customer Favourites" subtitle="Loved again and again" tagline="Our Bestselling Pieces" products={bestSellers} viewAllHref="/collections/best-sellers" />
      <ProductRail title="Trending Now" eyebrow="What's Hot" subtitle="Our most-loved picks right now" tagline="Styles Everyone Is Loving" cols={5} products={trending} viewAllHref="/collections/trending" />
      <ReelsRail reels={reels} />
      <MomentsSection moments={moments} />
      <QuoteSeparator />
      <ReviewsRail />
      <FaqHomeSection faqs={faqs} />
      <BrandBand />
      <OurStorySection />
    </div>
  )
}
