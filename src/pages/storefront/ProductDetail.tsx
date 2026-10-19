import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Heart, Minus, Plus, Truck, Share2, Star, ChevronLeft, ChevronRight, ChevronDown, Lock, Banknote, PenLine, X, BadgeCheck } from 'lucide-react'
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
import { LiveViewerCount, PurchaseSocialProof } from '@/components/storefront/SocialProof'
import { SmartImage } from '@/components/ui/SmartImage'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { useSeo } from '@/hooks/useSeo'
import { SITE_URL, BRAND_NAME, absoluteUrl, trimDescription } from '@/lib/seo'

/** Full-screen preview for review photos: tap outside / X / Esc to close, arrows or swipe buttons to browse. */
function ImageLightbox({ images, index, onClose, size = 'small', label = 'Review photo' }: { images: string[]; index: number; onClose: () => void; size?: 'small' | 'large'; label?: string }) {
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <button type="button" aria-label="Close preview" onClick={onClose} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
        <X size={22} />
      </button>
      {/* Image frame: capped size on big screens; arrows sit outside it on desktop, over it on phones */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[i]}
          alt=""
          className={cn('rounded-xl object-contain shadow-2xl', size === 'large' ? 'max-h-[88vh] max-w-[min(94vw,1000px)] bg-white' : 'max-h-[56vh] max-w-[min(86vw,380px)]')}
        />
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

/** Small popup for a review photo: shows the whole review card (photo, stars, text, name) in a compact size. */
function ReviewPreview({ review, index, onClose }: { review: Review; index: number; onClose: () => void }) {
  const [i, setI] = useState(index)
  const photos = review.images ?? []
  const many = photos.length > 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setI((n) => (n - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setI((n) => (n + 1) % photos.length)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [photos.length, onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Review" onClick={onClose}>
      <figure className="relative w-full max-w-[260px] overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
          <X size={15} />
        </button>
        <div className="relative">
          <img src={photos[i]} alt="" className="aspect-[4/3] w-full object-cover" />
          {many && (
            <>
              <button type="button" aria-label="Previous photo" onClick={() => setI((n) => (n - 1 + photos.length) % photos.length)} className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65">
                <ChevronLeft size={16} />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => setI((n) => (n + 1) % photos.length)} className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65">
                <ChevronRight size={16} />
              </button>
              <span className="absolute bottom-1.5 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">{i + 1} / {photos.length}</span>
            </>
          )}
        </div>
        <div className="max-h-40 overflow-y-auto p-3">
          <StarRating rating={review.rating} size={12} />
          {review.title && <p className="mt-1.5 text-xs font-semibold text-ink-900">{review.title}</p>}
          {review.body && <blockquote className="mt-1 text-[11px] leading-relaxed text-ink-500">{review.body}</blockquote>}
          <figcaption className="mt-2">
            <span className="block text-[11px] font-bold text-ink-900">{review.reviewer_name}</span>
            {review.is_verified_purchase && <span className="mt-0.5 flex items-center gap-1 text-[10px] text-brand-600"><BadgeCheck size={11} /> verified buyer</span>}
            <span className="mt-0.5 block text-[10px] text-ink-300">{new Date(review.created_at).toLocaleDateString('en-GB')}</span>
          </figcaption>
        </div>
      </figure>
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

function TrustStrip() {
  return (
    <div className="mt-6">
      <img src="/trust/features.png" alt="Free shipping, true-to-image product details, secure shopping, secure payments, COD available, premium packaging" className="h-auto w-full" loading="lazy" />
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

function Accordion({ title, children, defaultOpen = false, strong = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean; strong?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-blush-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn('flex w-full items-center justify-between gap-3 py-4 text-left', strong ? 'text-lg font-bold text-brand-600' : 'text-sm font-medium text-ink-900')}
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

/** Material / colour / size / weight, shown only for the fields filled in from the admin panel. */
function SpecList({ product }: { product: Product }) {
  const rows: [string, string][] = [
    ['Material', product.material?.trim() ?? ''],
    ['Colour', product.colour?.trim() ?? ''],
    ['Size', product.size?.trim() ?? ''],
    ['Weight', product.weight_grams ? `${product.weight_grams} g` : ''],
  ]
  const shown = rows.filter(([, v]) => v)
  if (shown.length === 0) return null
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
      {shown.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-semibold text-ink-900">{k}</dt>
          <dd className="text-ink-700">{v}</dd>
        </div>
      ))}
    </dl>
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
  const [preview, setPreview] = useState(false)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null) // hover position in %, desktop only
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
        className={cn('relative aspect-[4/5] min-w-0 flex-1 overflow-hidden rounded-3xl bg-blush-50', main && 'cursor-zoom-in')}
        onClick={() => main && setPreview(true)}
        onMouseMove={(e) => {
          if (!window.matchMedia('(hover: hover)').matches) return
          const r = e.currentTarget.getBoundingClientRect()
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
        }}
        onMouseLeave={() => setZoom(null)}
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
            className="h-full w-full animate-[fadeIn_.25s_ease-out] object-cover transition-transform duration-150 ease-out"
            style={zoom ? { transform: 'scale(2.2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => { e.stopPropagation(); go(-1) }}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-luxe-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => { e.stopPropagation(); go(1) }}
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
      {preview && <ImageLightbox images={images.map((i) => i.url)} index={current} size="large" label={`${alt} photos`} onClose={() => setPreview(false)} />}
    </div>
  )
}

const DEFAULT_OPTION_ID = '__default__'

/* The product's own Colour/Size (the images in the main gallery) is the default option; each variant adds another option. */
function variantOptions(p: Product): ProductVariant[] {
  const active = (p.variants ?? []).filter((v) => v.is_active)
  if (active.length === 0) return []
  const same = (a: string | null | undefined, b: string | null | undefined) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
  const addDefault = (p.colour || p.size) && active.every((v) => v.colour || v.size) && !active.some((v) => same(v.colour, p.colour) && same(v.size, p.size))
  if (!addDefault) return active
  const base: ProductVariant = {
    id: DEFAULT_OPTION_ID, product_id: p.id, sku: p.sku, variant_name: [p.colour, p.size].filter(Boolean).join(' / '),
    colour: p.colour || null, size: p.size || null, price: null, compare_at_price: null, stock_quantity: p.stock_quantity,
    image_url: null, finish: null, is_active: true, sort_order: -1,
  }
  return [base, ...active]
}

const optionLabel = (v: ProductVariant) => [v.colour, v.size].filter(Boolean).join(' / ') || v.variant_name

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
  const [lightbox, setLightbox] = useState<{ review: Review; index: number } | null>(null)
  const [quickCheckoutOpen, setQuickCheckoutOpen] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  const [selColour, setSelColour] = useState<string | null>(null)
  const [selSize, setSelSize] = useState<string | null>(null)
  const variantRef = useRef<HTMLDivElement>(null)

  const selectVariant = (v: ProductVariant | null) => {
    setSelectedVariant(v)
    if (v?.image_url) setActiveImage(v.image_url)
  }

  /* Colour and size are picked separately; a variant is chosen once every option the product has is picked. */
  const applySelection = (p: Product, colour: string | null, size: string | null) => {
    const options = variantOptions(p)
    const needsColour = options.some((v) => v.colour)
    const needsSize = options.some((v) => v.size)
    setSelColour(colour)
    setSelSize(size)
    const complete = (!needsColour || colour !== null) && (!needsSize || size !== null)
    const match = complete
      ? options.find((v) => (!needsColour || (v.colour ?? null) === colour) && (!needsSize || (v.size ?? null) === size)) ?? null
      : null
    setSelectedVariant(match)
    const shown = match ?? (colour ? options.find((v) => v.colour === colour) : undefined)
    const gallery = (p.images ?? []).filter((i) => !i.variant_id)
    const own = shown ? (p.images ?? []).filter((i) => i.variant_id === shown.id).sort((x, y) => x.sort_order - y.sort_order)[0]?.url ?? shown.image_url : null
    setActiveImage(own ?? gallery.find((i) => i.is_primary)?.url ?? gallery[0]?.url ?? null)
  }

  /* Opens on the first option that is in stock, so a choice is always already made. */
  const initSelection = (p: Product) => {
    const options = variantOptions(p)
    if (options.length === 0) return
    const first = options.find((v) => p.track_inventory === false || v.stock_quantity > 0) ?? options[0]
    if (!options.some((v) => v.colour || v.size)) {
      selectVariant(first)
      return
    }
    applySelection(p, first.colour ?? null, first.size ?? null)
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
        const gallery = (p.images ?? []).filter((i) => !i.variant_id)
        setActiveImage(gallery.find((i) => i.is_primary)?.url ?? gallery[0]?.url ?? null)
        initSelection(p)
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

  const productImages = (product?.images ?? []).filter((i) => !i.variant_id).slice().sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
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
  const activeVariants = variantOptions(product)
  const hasVariants = activeVariants.length > 0
  const tracked = product.track_inventory !== false
  const needsColour = activeVariants.some((v) => v.colour)
  const needsSize = activeVariants.some((v) => v.size)
  const legacyOptions = hasVariants && !needsColour && !needsSize
  const colourOptions = [...new Set(activeVariants.map((v) => v.colour).filter(Boolean))] as string[]
  const sizeOptions = [...new Set(activeVariants.map((v) => v.size).filter(Boolean))] as string[]
  const awaitingChoice = hasVariants && !selectedVariant
  const missing = legacyOptions
    ? ['an option']
    : [needsColour && !selColour ? 'a colour' : '', needsSize && !selSize ? 'a size' : ''].filter(Boolean)
  const displayStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity
  const colourLabel = selectedVariant?.colour || selectedVariant?.variant_name || product.colour
  const outOfStock = tracked && (awaitingChoice ? activeVariants.every((v) => v.stock_quantity <= 0) : displayStock <= 0)
  const pct = discountPercent(displayPrice, displayCompareAt)
  const gallery = (product.images ?? []).filter((i) => !i.variant_id)
  const imgVariant = selectedVariant ?? (selColour ? activeVariants.find((v) => v.colour === selColour) : undefined)
  const variantImgs = imgVariant ? (product.images ?? []).filter((i) => i.variant_id === imgVariant.id) : []
  // Only the chosen colour/size's own photos are shown; the main gallery is the default option's set.
  const images = variantImgs.length > 0
    ? variantImgs
    : imgVariant && imgVariant.id !== DEFAULT_OPTION_ID && imgVariant.image_url
      ? [{ url: imgVariant.image_url }]
      : gallery
  const orderVariant = selectedVariant && selectedVariant.id !== DEFAULT_OPTION_ID ? selectedVariant : null

  /* Blocks add-to-cart / buy-now until the shopper has picked every option (colour, size). */
  const needChoice = () => {
    if (!awaitingChoice) return false
    toast.error(`Please select ${missing.join(' and ')}`)
    variantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  }

  const handleAddToCart = () => {
    if (outOfStock || needChoice()) return
    addItem(product.id, orderVariant?.id ?? null, qty)
    toast.success('Added to cart')
  }

  const handleBuyNow = () => {
    if (outOfStock || needChoice()) return
    setQuickCheckoutOpen(true)
  }

  const chooseColour = (c: string) => {
    const forColour = activeVariants.filter((v) => v.colour === c)
    const keep = forColour.some((v) => v.size === selSize)
      ? selSize
      : (forColour.find((v) => !tracked || v.stock_quantity > 0) ?? forColour[0])?.size ?? null
    applySelection(product, c, keep)
  }

  const chooseSize = (sz: string) => {
    let colour = selColour
    if (needsColour && !colour) {
      const coloursForSize = activeVariants.filter((v) => v.size === sz).map((v) => v.colour).filter(Boolean) as string[]
      colour = new Set(coloursForSize).size === 1 ? coloursForSize[0] : null
    }
    applySelection(product, colour, sz)
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

          {hasVariants && (
            <div ref={variantRef} className="mt-6 space-y-4">
              {legacyOptions && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Colour{selectedVariant ? <span className="ml-1.5 font-medium normal-case tracking-normal text-ink-900">: {selectedVariant.variant_name}</span> : null}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => selectVariant(v)}
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-4 py-2 text-sm',
                          selectedVariant?.id === v.id ? 'border-brand-500 bg-blush-50 text-brand-700' : 'border-blush-200 text-ink-700',
                          v.stock_quantity <= 0 && tracked && 'opacity-50',
                        )}
                      >
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-ink-300/60" style={{ background: colourSwatch(v.variant_name) }} aria-hidden />
                        {v.variant_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {colourOptions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Colour{selColour ? <span className="ml-1.5 font-medium normal-case tracking-normal text-ink-900">: {selColour}</span> : null}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {colourOptions.map((c) => {
                      const soldOut = tracked && activeVariants.filter((v) => v.colour === c).every((v) => v.stock_quantity <= 0)
                      return (
                        <button
                          key={c}
                          onClick={() => chooseColour(c)}
                          className={cn(
                            'flex items-center gap-2 rounded-full border px-4 py-2 text-sm',
                            selColour === c ? 'border-brand-500 bg-blush-50 text-brand-700' : 'border-blush-200 text-ink-700',
                            soldOut && 'opacity-50',
                          )}
                        >
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-ink-300/60" style={{ background: colourSwatch(c) }} aria-hidden />
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {sizeOptions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Size{selSize ? <span className="ml-1.5 font-medium normal-case tracking-normal text-ink-900">: {selSize}</span> : null}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((sz) => {
                      const forColour = activeVariants.filter((v) => v.size === sz && (!selColour || v.colour === selColour))
                      const unavailable = forColour.length === 0
                      const soldOut = tracked && !unavailable && forColour.every((v) => v.stock_quantity <= 0)
                      return (
                        <button
                          key={sz}
                          disabled={unavailable}
                          onClick={() => chooseSize(sz)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-sm',
                            selSize === sz ? 'border-brand-500 bg-blush-50 text-brand-700' : 'border-blush-200 text-ink-700',
                            (soldOut || unavailable) && 'opacity-40',
                            unavailable && 'cursor-not-allowed line-through',
                          )}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            {outOfStock ? (
              <Badge tone="neutral">Out of Stock</Badge>
            ) : awaitingChoice ? null : displayStock <= 5 ? (
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

          <TrustStrip />
          <p className="mt-3 hidden items-center gap-2 text-xs text-ink-500 md:flex">
            <Truck size={14} className="text-brand-500" /> {product.delivery_info ?? 'Delivered in 4-7 business days across India.'}
          </p>
        </div>
      </div>

      {/* Details - phones: collapsible sections */}
      <div className="mt-8 border-t border-blush-200 md:hidden">
        <Accordion title="Description" defaultOpen strong>
          <p className="whitespace-pre-line">{product.description}</p>
        </Accordion>
        {(product.material || product.colour || product.size || product.weight_grams) && (
          <Accordion title="Specifications" defaultOpen strong>
            <SpecList product={product} />
          </Accordion>
        )}
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
      <div className="mt-8 md:mt-14">
        <div className="hidden space-y-8 md:block">
          <div>
            <h3 className="mb-3 text-3xl font-semibold leading-tight text-brand-600 md:text-4xl">Description</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{product.description}</p>
          </div>
          {(product.material || product.colour || product.size || product.weight_grams) && (
            <div>
              <h3 className="mb-3 text-3xl font-semibold leading-tight text-brand-600 md:text-4xl">Specifications</h3>
              <SpecList product={product} />
            </div>
          )}
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
      </div>

      {/* Reviews */}
      <section className="mt-12 border-t border-blush-200 pt-8 md:mt-14">
        <h3 className="text-2xl font-bold text-ink-900 md:text-3xl">Reviews</h3>

        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-ink-300">No reviews yet. Be the first to review!</p>
        ) : (
          <>
            {/* Overall rating + breakdown */}
            <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <div>
                  <p className="text-[11px] text-ink-500">Overall Rating</p>
                  <p className="text-6xl font-light leading-none text-ink-900 md:text-7xl">{(reviews.reduce((n, r) => n + r.rating, 0) / reviews.length).toFixed(1)}</p>
                </div>
                <div>
                  <StarRating rating={reviews.reduce((n, r) => n + r.rating, 0) / reviews.length} />
                  <p className="mt-1 text-[11px] text-ink-500">Based on {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</p>
                </div>
              </div>
              <div className="w-full max-w-xs space-y-1.5 md:max-w-sm">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => Math.round(r.rating) === star).length
                  return (
                    <div key={star} className="flex items-center gap-2 text-[11px] text-ink-700">
                      <span className="w-6 shrink-0">{star} <span className="text-brand-500">★</span></span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(count / reviews.length) * 100}%` }} />
                      </span>
                      <span className="w-5 shrink-0 text-right text-ink-500">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Photo strip: every customer photo */}
            {(() => {
              const allPhotos = reviews.flatMap((r) => (r.images ?? []).map((url, index) => ({ url, review: r, index })))
              if (allPhotos.length === 0) return null
              return (
                <div className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
                  {allPhotos.map(({ url, review, index }, idx) => (
                    <button key={`${url}-${idx}`} type="button" aria-label={`View customer photo ${idx + 1}`} onClick={() => setLightbox({ review, index })} className="shrink-0">
                      <img src={url} alt="" className="h-24 w-24 cursor-pointer rounded-md object-cover md:h-32 md:w-32" />
                    </button>
                  ))}
                </div>
              )
            })()}

            {/* Review cards */}
            <div className="scrollbar-none -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
              {reviews.map((r) => (
                <figure key={r.id} className="flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-md border border-gray-200 bg-white sm:w-64 md:w-72">
                  {r.images && r.images.length > 0 && (
                    <button type="button" aria-label="View review photos" onClick={() => setLightbox({ review: r, index: 0 })} className="relative block">
                      <img src={r.images[0]} alt="" className="aspect-[4/3] w-full cursor-pointer object-cover" />
                      {r.images.length > 1 && <span className="absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">+{r.images.length - 1}</span>}
                    </button>
                  )}
                  <div className="flex flex-1 flex-col p-3.5">
                    <StarRating rating={r.rating} size={13} />
                    {r.title && <p className="mt-2 text-xs font-semibold text-ink-900">{r.title}</p>}
                    {r.body && <blockquote className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-500">{r.body}</blockquote>}
                    <figcaption className="mt-3">
                      <span className="block text-xs font-bold text-ink-900">{r.reviewer_name}</span>
                      {r.is_verified_purchase && <span className="mt-1 flex items-center gap-1 text-[10px] text-brand-600"><BadgeCheck size={12} /> verified buyer</span>}
                      <span className="mt-1 block text-[10px] text-ink-300">{new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 max-w-xl">
          {canReview ? (
            <ReviewForm productId={product.id} onSubmitted={() => {}} />
          ) : (
            <p className="rounded-2xl bg-blush-50 p-4 text-sm text-ink-500">
              Only customers who've purchased this item can leave a review.
            </p>
          )}
        </div>
      </section>

      {lightbox && <ReviewPreview review={lightbox.review} index={lightbox.index} onClose={() => setLightbox(null)} />}

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
          variant={orderVariant}
          optionLabel={selectedVariant ? optionLabel(selectedVariant) : null}
          qty={qty}
          onClose={() => setQuickCheckoutOpen(false)}
        />
      )}
    </div>
  )
}
