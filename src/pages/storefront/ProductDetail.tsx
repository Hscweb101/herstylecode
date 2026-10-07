import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Heart, Minus, Plus, Truck, Share2, Star, ChevronLeft, ChevronRight, ChevronDown, Lock, Banknote, PenLine, X } from 'lucide-react'
import { CARE_STEPS } from '@/lib/careGuide'
import { colourSwatch } from '@/lib/colours'
import { supabase } from '@/lib/supabase'
import { fetchProductBySlug, fetchProducts } from '@/lib/queries'
import type { Product, ProductVariant, Review } from '@/types'
import { cn, discountPercent, formatINR, pushRecentlyViewed, getRecentlyViewed } from '@/lib/utils'
import { Badge, FullPageSpinner, StarRating, EmptyState } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Textarea, Input } from '@/components/ui/Input'
import { ProductCard } from '@/components/storefront/ProductCard'
import { QuickCheckoutModal } from '@/components/storefront/QuickCheckoutModal'
import { LiveViewerCount, PurchaseSocialProof, ReviewerAvatar } from '@/components/storefront/SocialProof'
import { SmartImage } from '@/components/ui/SmartImage'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useSeo } from '@/hooks/useSeo'
import { SITE_URL, BRAND_NAME, absoluteUrl, trimDescription } from '@/lib/seo'

/** Full-screen preview for review photos: tap outside / X / Esc to close, arrows or swipe buttons to browse. */
function ImageLightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index)
  const many = images.length > 1
  const prev = () => setI((n) => (n - 1 + images.length) % images.length)
  const next = () => setI((n) => (n + 1) % images.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && images.length > 1) setI((n) => (n - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight' && images.length > 1) setI((n) => (n + 1) % images.length)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [images.length, onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Review photo" onClick={onClose}>
      <button type="button" aria-label="Close preview" onClick={onClose} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
        <X size={22} />
      </button>
      {/* Image frame: capped size on big screens; arrows sit outside it on desktop, over it on phones */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img src={images[i]} alt="" className="max-h-[72vh] max-w-[min(92vw,640px)] rounded-xl object-contain shadow-2xl" />
        {many && (
          <button type="button" aria-label="Previous photo" onClick={prev} className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:-left-14 sm:bg-white/15 sm:hover:bg-white/25">
            <ChevronLeft size={24} />
          </button>
        )}
        {many && (
          <button type="button" aria-label="Next photo" onClick={next} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 sm:-right-14 sm:bg-white/15 sm:hover:bg-white/25">
            <ChevronRight size={24} />
          </button>
        )}
      </div>
      {many && <span className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{i + 1} / {images.length}</span>}
    </div>
  )
}

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false)
  const profile = useAuthStore((s) => s.profile)
  const [rating, setRating] = useState(5)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const userId = useAuthStore((s) => s.userId)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !body.trim()) {
      toast.error('Please add your name and a short review')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      customer_id: userId,
      reviewer_name: name,
      rating,
      title,
      body,
      is_verified_purchase: true,
    })
    setSubmitting(false)
    if (error) {
      toast.error('Could not submit review')
      return
    }
    toast.success('Thanks! Your review will appear once approved.')
    setName('')
    setTitle('')
    setBody('')
    setOpen(false)
    onSubmitted()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setName((n) => n || profile?.full_name || '')
          setOpen(true)
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-blush-50 px-4 py-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-blush-100"
      >
        <PenLine size={16} /> Write a Review
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-blush-50 p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-lg">Write a Review</h4>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close review form" className="rounded-full p-1 text-ink-500 hover:bg-blush-100">
          <X size={18} />
        </button>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)}>
            <Star size={22} className={n <= rating ? 'fill-gold-500 text-gold-500' : 'fill-blush-100 text-blush-200'} />
          </button>
        ))}
      </div>
      <Input label="Your Name" autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Review Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea label="Your Review" value={body} onChange={(e) => setBody(e.target.value)} required />
      <Button type="submit" loading={submitting}>
        Submit Review
      </Button>
    </form>
  )
}

function TrustStrip({ returnEligible, codAvailable }: { returnEligible: boolean; codAvailable: boolean }) {
  // Icons: Google Material Symbols (Apache-2.0), tinted with the brand colour via CSS mask.
  const items = [
    { icon: 'shipping.svg', title: 'Free Shipping', sub: 'Prepaid ₹999+' },
    { icon: 'returns.svg', title: returnEligible ? '7-Day Returns' : 'Final Sale', sub: returnEligible ? 'Easy & hassle-free' : 'Not returnable' },
    { icon: 'cod.svg', title: codAvailable ? 'COD Available' : 'Prepaid Only', sub: codAvailable ? 'Pay when it arrives' : 'UPI, cards & more' },
    { icon: 'secure.svg', title: 'Secure Payments', sub: '100% safe checkout' },
  ]
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-blush-200 bg-gradient-to-br from-white via-blush-50 to-white p-3 shadow-luxe-sm md:p-4">
      <div className="grid grid-cols-4 divide-x divide-blush-200">
        {items.map(({ icon, title, sub }) => (
          <div key={title} className="flex flex-col items-center gap-1.5 px-1 text-center md:gap-2 md:px-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-luxe-sm ring-1 ring-brand-300/50 md:h-12 md:w-12">
              <span
                aria-hidden
                className="h-6 w-6 bg-brand-700 md:h-7 md:w-7"
                style={{
                  WebkitMask: `url(/trust/${icon}) center / contain no-repeat`,
                  mask: `url(/trust/${icon}) center / contain no-repeat`,
                }}
              />
            </span>
            <span className="text-[10.5px] font-semibold leading-tight text-ink-900 md:text-xs">{title}</span>
            <span className="text-[9px] leading-tight text-ink-500 md:text-[10.5px]">{sub}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PAYMENT_LOGOS = [
  { file: 'upi.svg', name: 'UPI' },
  { file: 'googlepay.svg', name: 'Google Pay' },
  { file: 'phonepe.svg', name: 'PhonePe' },
  { file: 'paytm.svg', name: 'Paytm' },
  { file: 'visa.svg', name: 'Visa' },
  { file: 'mastercard.svg', name: 'Mastercard' },
  { file: 'rupay.svg', name: 'RuPay' },
]

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-blush-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-medium text-ink-900"
      >
        {title}
        <ChevronDown size={18} className={cn('shrink-0 text-ink-500 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="pb-4 text-sm leading-relaxed text-ink-700">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** The standard six care points, each a short heading + one line, with a link to the full guide. */
function CareList({ note }: { note?: string | null }) {
  return (
    <div>
      <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {CARE_STEPS.map(({ icon: Icon, title, short }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-900">{title}</span>
              <span className="block text-[13px] leading-snug text-ink-500">{short}</span>
            </span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-3 text-[13px] text-ink-500">{note}</p>}
      <Link to="/care-instructions" className="mt-4 inline-block text-sm font-medium text-brand-600 underline underline-offset-2">
        Read the full care guide
      </Link>
    </div>
  )
}

function Gallery({
  images,
  activeUrl,
  onSelect,
  alt,
}: {
  images: { url: string }[]
  activeUrl: string | null
  onSelect: (url: string) => void
  alt: string
}) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const current = Math.max(0, images.findIndex((i) => i.url === activeUrl))
  const main = images[current]?.url ?? activeUrl
  const go = (delta: number) => {
    if (images.length < 2) return
    onSelect(images[(current + delta + images.length) % images.length].url)
  }

  // Keep the selected thumbnail centred in the rail (scrolls only the rail, never the page).
  useEffect(() => {
    const rail = railRef.current
    const active = rail?.querySelector<HTMLElement>('[data-active="true"]')
    if (!rail || !active) return
    rail.scrollTo({ top: active.offsetTop - rail.clientHeight / 2 + active.clientHeight / 2, behavior: 'smooth' })
  }, [current])

  return (
    <div className="flex gap-2.5 sm:gap-3">
      {images.length > 1 && (
        // Thumbnail rail on the left. Absolutely positioned inside so its height always equals the main image.
        <div className="relative w-14 shrink-0 sm:w-[72px]">
          <div ref={railRef} className="absolute inset-0 flex flex-col gap-2 overflow-y-auto scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={img.url + idx}
                type="button"
                data-active={idx === current}
                aria-label={`Show image ${idx + 1}`}
                onClick={() => onSelect(img.url)}
                className={cn(
                  'aspect-[4/5] w-full shrink-0 overflow-hidden rounded-xl border-2 transition-colors',
                  idx === current ? 'border-brand-500' : 'border-transparent opacity-70',
                )}
              >
                <SmartImage src={img.url} variant="sm" alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="relative aspect-[4/5] min-w-0 flex-1 overflow-hidden rounded-3xl bg-blush-50"
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return
          const dx = e.changedTouches[0].clientX - touchStartX
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          setTouchStartX(null)
        }}
      >
        {main && (
          <SmartImage
            key={main}
            src={main}
            alt={alt}
            width={1200}
            height={1500}
            loading="eager"
            fetchPriority="high"
            draggable={false}
            className="h-full w-full animate-[fadeIn_.25s_ease-out] object-cover"
          />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-luxe-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-luxe-sm"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-[11px] font-medium text-white">
              {current + 1} / {images.length}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [qty, setQty] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [related, setRelated] = useState<Product[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const [canReview, setCanReview] = useState(false)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const [quickCheckoutOpen, setQuickCheckoutOpen] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  const selectVariant = (v: ProductVariant | null) => {
    setSelectedVariant(v)
    if (v?.image_url) setActiveImage(v.image_url)
  }

  const addItem = useCartStore((s) => s.addItem)
  const isWishlisted = useWishlistStore((s) => (product ? s.isWishlisted(product.id) : false))
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const userId = useAuthStore((s) => s.userId)

  useEffect(() => {
    if (!slug) return
    let active = true
    async function load() {
      setLoading(true)
      const p = await fetchProductBySlug(slug!)
      if (!active) return
      setProduct(p)
      if (p) {
        setActiveImage(p.images?.find((i) => i.is_primary)?.url ?? p.images?.[0]?.url ?? null)
        selectVariant(p.variants?.find((v) => v.is_active) ?? null)
        pushRecentlyViewed(p.slug)
        supabase.from('products').update({ view_count: p.view_count + 1 }).eq('id', p.id).then(() => {})

        const [{ data: rv }, rel, purchaseCheck] = await Promise.all([
          supabase.from('reviews').select('*').eq('product_id', p.id).eq('is_approved', true).order('created_at', { ascending: false }),
          p.category?.slug ? fetchProducts({ categorySlug: p.category.slug, limit: 5 }) : Promise.resolve([]),
          userId
            ? supabase
                .from('order_items')
                .select('id, order:orders!inner(customer_id, status)')
                .eq('product_id', p.id)
                .eq('order.customer_id', userId)
                .neq('order.status', 'cancelled')
                .limit(1)
            : Promise.resolve({ data: [] }),
        ])
        setReviews((rv as Review[]) ?? [])
        setRelated(rel.filter((r) => r.id !== p.id))
        setCanReview(((purchaseCheck as { data: unknown[] | null }).data?.length ?? 0) > 0)

        const rvSlugs = getRecentlyViewed().filter((s) => s !== p.slug).slice(0, 4)
        if (rvSlugs.length > 0) {
          const { data: rvProducts } = await supabase
            .from('products')
            .select('id, name, slug, price, compare_at_price, stock_quantity, track_inventory, is_active, rating_avg, rating_count, images:product_images(url, is_primary)')
            .in('slug', rvSlugs)
          setRecentlyViewed((rvProducts as unknown as Product[]) ?? [])
        } else {
          setRecentlyViewed([])
        }
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [slug, userId])

  // Phone-only sticky purchase bar: shown whenever the inline Add to Cart / Buy Now buttons are off-screen.
  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [product?.id, loading])

  useEffect(() => {
    document.body.classList.toggle('has-sticky-bar', showStickyBar)
    return () => document.body.classList.remove('has-sticky-bar')
  }, [showStickyBar])

  const productImages = (product?.images ?? []).slice().sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
  const inStock = product ? !product.track_inventory || product.stock_quantity > 0 : true
  useSeo({
    title: product ? product.seo_title || `${product.name} - Buy Online in India` : 'Product',
    description: product
      ? product.seo_description ||
        trimDescription(`Buy ${product.name} online at HerStyleCode (Her Style Code) for ${formatINR(product.price)}. ${product.short_description ?? product.description ?? ''} Free shipping above ₹999, COD available.`)
      : undefined,
    image: productImages[0]?.url,
    path: product ? `/product/${product.slug}` : undefined,
    type: 'product',
    noindex: !loading && !product,
    jsonLd: product
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: trimDescription(product.short_description ?? product.description ?? product.name, 500),
            sku: product.sku,
            image: productImages.map((i) => absoluteUrl(i.url)),
            brand: { '@type': 'Brand', name: BRAND_NAME },
            ...(product.material ? { material: product.material } : {}),
            ...(product.colour ? { color: product.colour } : {}),
            ...(product.category ? { category: product.category.name } : {}),
            offers: {
              '@type': 'Offer',
              url: `${SITE_URL}/product/${product.slug}`,
              priceCurrency: 'INR',
              price: String(product.price),
              itemCondition: 'https://schema.org/NewCondition',
              availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              seller: { '@type': 'Organization', name: BRAND_NAME },
            },
            ...(product.rating_count > 0
              ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(product.rating_avg), reviewCount: String(product.rating_count) } }
              : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
              ...(product.category ? [{ '@type': 'ListItem', position: 3, name: product.category.name, item: `${SITE_URL}/category/${product.category.slug}` }] : []),
              { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.name, item: `${SITE_URL}/product/${product.slug}` },
            ],
          },
        ]
      : undefined,
  })

  if (loading) return <FullPageSpinner />
  if (!product) return <EmptyState title="Product not found" description="This item may have been removed." />

  const displayPrice = selectedVariant?.price ?? product.price
  const displayCompareAt = selectedVariant?.compare_at_price ?? product.compare_at_price
  const displayStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity
  const colourLabel = selectedVariant?.colour || selectedVariant?.variant_name || product.colour
  const outOfStock = product.track_inventory !== false && displayStock <= 0
  const pct = discountPercent(displayPrice, displayCompareAt)
  const images = selectedVariant?.image_url
    ? [{ url: selectedVariant.image_url }, ...(product.images ?? [])]
    : product.images ?? []

  const handleAddToCart = () => {
    if (outOfStock) return
    addItem(product.id, selectedVariant?.id ?? null, qty)
    toast.success('Added to cart')
  }

  const handleBuyNow = () => {
    if (outOfStock) return
    setQuickCheckoutOpen(true)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: product.name, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 md:px-8 md:pb-8">
      <div className="mb-6 text-xs text-ink-300">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span className="text-ink-500">{product.name}</span>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <Gallery images={images} activeUrl={activeImage} onSelect={setActiveImage} alt={product.name} />

        {/* Info */}
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-300">SKU: {selectedVariant?.sku ?? product.sku}</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-900">{product.name}</h1>
          {product.rating_count > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={product.rating_avg} />
              <span className="text-xs text-ink-300">({product.rating_count} reviews)</span>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-semibold text-brand-700">{formatINR(displayPrice)}</span>
            {displayCompareAt && displayCompareAt > displayPrice && (
              <>
                <span className="text-base text-ink-300 line-through">{formatINR(displayCompareAt)}</span>
                {pct && <Badge tone="brand">{pct}% OFF</Badge>}
              </>
            )}
          </div>
          {product.short_description && <p className="mt-4 text-sm text-ink-500">{product.short_description}</p>}
          <p className="mt-3 rounded-lg bg-blush-50 px-3 py-2 text-xs text-ink-500">
            This is fashion (artificial) jewellery. It is not made of real gold, silver or precious stones.
          </p>
          <div className="mt-3">
            <LiveViewerCount productId={product.id} />
          </div>

          {colourLabel && (!product.variants || product.variants.length === 0) && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Colour</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-3.5 w-3.5 rounded-full ring-1 ring-ink-300/60" style={{ background: colourSwatch(colourLabel) }} aria-hidden />
                {colourLabel}
              </span>
            </p>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Colour{selectedVariant ? <span className="ml-1.5 font-medium normal-case tracking-normal text-ink-900">: {selectedVariant.colour || selectedVariant.variant_name}</span> : null}
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.filter((v) => v.is_active).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => selectVariant(v)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-4 py-2 text-sm',
                      selectedVariant?.id === v.id ? 'border-brand-500 bg-blush-50 text-brand-700' : 'border-blush-200 text-ink-700',
                      v.stock_quantity <= 0 && product.track_inventory !== false && 'opacity-50',
                    )}
                  >
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-ink-300/60" style={{ background: colourSwatch(v.colour || v.variant_name) }} aria-hidden />
                    {v.variant_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            {outOfStock ? (
              <Badge tone="neutral">Out of Stock</Badge>
            ) : displayStock <= 5 ? (
              <Badge tone="gold">Only {displayStock} left</Badge>
            ) : (
              <Badge tone="success">In Stock</Badge>
            )}
          </div>

          {/* Desktop / tablet: qty + wishlist + share, then Add to Cart / Buy Now side by side */}
          <div className="hidden md:block">
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-blush-200">
                <button className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button className="p-3" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-blush-200"
              >
                <Heart size={18} className={isWishlisted ? 'fill-brand-600 text-brand-600' : ''} />
              </button>
              <button onClick={handleShare} aria-label="Share" className="flex h-11 w-11 items-center justify-center rounded-full border border-blush-200">
                <Share2 size={16} />
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" size="lg" className="flex-1 whitespace-nowrap" onClick={handleAddToCart} disabled={outOfStock}>
                Add to Cart
              </Button>
              <Button size="lg" className="btn-shiver flex-1 whitespace-nowrap" onClick={handleBuyNow} disabled={outOfStock}>
                Buy Now
              </Button>
            </div>
          </div>

          {/* Phones: [qty] [Add to Cart] [heart] [share] on one row, full-width Buy Now underneath */}
          <div ref={actionsRef} className="mt-5 space-y-3 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex shrink-0 items-center rounded-full border border-blush-200">
                <button className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-sm">{qty}</span>
                <button className="p-2.5" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                  <Plus size={14} />
                </button>
              </div>
              <Button size="lg" className="min-w-0 flex-1 whitespace-nowrap px-3! py-2.5! text-sm!" onClick={handleAddToCart} disabled={outOfStock}>
                Add to Cart
              </Button>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blush-200"
              >
                <Heart size={17} className={isWishlisted ? 'fill-brand-600 text-brand-600' : ''} />
              </button>
              <button
                onClick={handleShare}
                aria-label="Share"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blush-200 max-[359px]:hidden"
              >
                <Share2 size={15} />
              </button>
            </div>
            <Button variant="secondary" size="lg" className="btn-shiver w-full py-3.5!" onClick={handleBuyNow} disabled={outOfStock}>
              Buy Now
            </Button>
          </div>

          {/* Secure checkout strip */}
          <div className="mt-3">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-ink-700">
              <Lock size={14} className="text-emerald-600" /> Secure checkout
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {PAYMENT_LOGOS.map(({ file, name }) => (
                <span key={name} className="flex h-10 items-center rounded-lg border border-blush-200 bg-white px-3 shadow-luxe-sm">
                  <img src={`/payments/${file}`} alt={name} title={name} className="h-6 w-auto max-w-[4.75rem] object-contain" />
                </span>
              ))}
              {product.cod_available && (
                <span className="flex h-10 items-center gap-1.5 rounded-lg border border-blush-200 bg-white px-3 text-xs font-semibold text-ink-700 shadow-luxe-sm">
                  <Banknote size={17} className="text-emerald-600" /> COD
                </span>
              )}
            </div>
          </div>

          {product.show_purchase_proof !== false && (
            <div className="mt-4">
              <PurchaseSocialProof productId={product.id} />
            </div>
          )}

          <TrustStrip returnEligible={!!product.return_eligible} codAvailable={!!product.cod_available} />
          <p className="mt-3 hidden items-center gap-2 text-xs text-ink-500 md:flex">
            <Truck size={14} className="text-brand-500" /> {product.delivery_info ?? 'Delivered in 4-7 business days across India.'}
          </p>
        </div>
      </div>

      {/* Details - phones: collapsible sections */}
      <div className="mt-8 border-t border-blush-200 md:hidden">
        <Accordion title="Product Description" defaultOpen>
          <p className="whitespace-pre-line">{product.description}</p>
        </Accordion>
        <Accordion title="Care Instructions">
          <CareList note={product.care_instructions} />
        </Accordion>
        {product.whats_included && (
          <Accordion title="What's Included">
            <p>{product.whats_included}</p>
          </Accordion>
        )}
        <Accordion title="Shipping & Returns">
          <p>{product.delivery_info ?? 'Delivered in 4-7 business days across India.'}</p>
          <p className="mt-2">{product.return_eligible ? 'Eligible for 7-day easy returns.' : 'This item is not eligible for return.'}</p>
        </Accordion>
      </div>

      {/* Details - tablet/desktop: open sections + reviews */}
      <div className="mt-8 grid gap-10 md:mt-14 md:grid-cols-3">
        <div className="hidden space-y-8 md:col-span-2 md:block">
          <div>
            <h3 className="mb-3 font-serif text-xl">Description</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{product.description}</p>
          </div>
          <div className="border-t border-blush-200">
            <Accordion title="Care Instructions">
              <CareList note={product.care_instructions} />
            </Accordion>
          </div>
          {product.whats_included && (
            <div>
              <h3 className="mb-3 font-serif text-xl">What's Included</h3>
              <p className="text-sm text-ink-700">{product.whats_included}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 font-serif text-xl">Reviews ({reviews.length})</h3>
          <div className="space-y-4">
            {reviews.length === 0 && <p className="text-sm text-ink-300">No reviews yet. Be the first to review!</p>}
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3 border-b border-blush-100 pb-4">
                <ReviewerAvatar name={r.reviewer_name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">
                    {r.reviewer_name}
                    {r.is_verified_purchase && <span className="ml-2 text-xs font-normal text-emerald-600">Verified Purchase</span>}
                  </p>
                  <div className="mt-0.5">
                    <StarRating rating={r.rating} size={13} />
                  </div>
                  {r.title && <p className="mt-1 text-sm font-medium text-ink-900">{r.title}</p>}
                  <p className="mt-1 text-sm text-ink-500">{r.body}</p>
                  {r.images && r.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.images.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          aria-label={`View review photo ${idx + 1}`}
                          onClick={() => setLightbox({ images: r.images, index: idx })}
                          className="overflow-hidden rounded-lg ring-1 ring-blush-200 transition hover:ring-brand-400"
                        >
                          <img src={url} alt="" loading="lazy" className="h-16 w-16 cursor-zoom-in object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            {canReview ? (
              <ReviewForm productId={product.id} onSubmitted={() => {}} />
            ) : (
              <p className="rounded-2xl bg-blush-50 p-4 text-sm text-ink-500">
                Only customers who've purchased this item can leave a review.
              </p>
            )}
          </div>
        </div>
      </div>

      {lightbox && <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />}

      {related.length > 0 && (
        <div className="mt-16">
          <h3 className="mb-6 font-serif text-2xl">You May Also Like</h3>
          <div className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
            {related.slice(0, 4).map((p) => (
              <div key={p.id} className="w-[46%] shrink-0 snap-start md:w-auto">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-16">
        <h3 className="mb-4 text-center font-serif text-2xl">Frequently Asked Questions</h3>
        <div className="mx-auto max-w-3xl border-t border-blush-200">
          <Accordion title="How long will my order take to arrive?">
            <p>Orders are delivered in 4-7 business days across India. Free shipping on prepaid orders above ₹999.</p>
          </Accordion>
          <Accordion title="Do you offer Cash on Delivery (COD)?">
            <p>Yes, Cash on Delivery is available on eligible products. You will see the option at checkout.</p>
          </Accordion>
          <Accordion title="Is this real gold or silver?">
            <p>No. This is fashion (artificial) jewellery with a gold-plated finish. It is not made of real gold, silver or precious stones.</p>
          </Accordion>
          <Accordion title="Can I return or exchange my order?">
            <p>Eligible items can be returned within 7 days of delivery. Return eligibility is shown on each product page.</p>
          </Accordion>
          <Accordion title="How can I track my order?">
            <p>
              Go to <Link to="/track-order" className="font-medium text-brand-600 underline">Track Order</Link> and enter your order number
              with the phone number or email you used at checkout.
            </p>
          </Accordion>
          <Accordion title="How do I take care of my jewellery?">
            <p>Keep it dry, apply perfume before wearing it, and store it in a clean pouch. See our <Link to="/care-instructions" className="font-medium text-brand-600 underline">full care guide</Link>.</p>
          </Accordion>
        </div>
      </div>

      {recentlyViewed.length > 0 && (
        <div className="mt-16">
          <h3 className="mb-6 font-serif text-2xl">Recently Viewed</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky purchase bar - phones only */}
      <div
        aria-hidden={!showStickyBar}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-blush-100 bg-white/95 px-4 pt-3 shadow-[0_-8px_24px_-12px_rgba(96,6,25,0.25)] backdrop-blur transition-transform duration-300 md:hidden',
          'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          showStickyBar ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 leading-tight">
            <p className="text-lg font-semibold text-brand-700">{formatINR(displayPrice)}</p>
            {displayCompareAt && displayCompareAt > displayPrice && (
              <p className="text-xs text-ink-300 line-through">{formatINR(displayCompareAt)}</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="flex-1 whitespace-nowrap py-3! text-[13px]!" onClick={handleAddToCart} disabled={outOfStock} tabIndex={showStickyBar ? 0 : -1}>
            Add to Cart
          </Button>
          <Button size="sm" className="btn-shiver-strong flex-[1.3] whitespace-nowrap py-3! text-sm! font-semibold!" onClick={handleBuyNow} disabled={outOfStock} tabIndex={showStickyBar ? 0 : -1}>
            Buy Now
          </Button>
        </div>
      </div>

      {quickCheckoutOpen && (
        <QuickCheckoutModal
          product={product}
          variant={selectedVariant}
          qty={qty}
          onClose={() => setQuickCheckoutOpen(false)}
        />
      )}
    </div>
  )
}
