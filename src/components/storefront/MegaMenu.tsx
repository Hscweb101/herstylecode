import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Truck } from 'lucide-react'
import { fetchProducts, type ProductFilters } from '@/lib/queries'
import { formatINR, cn, discountPercent } from '@/lib/utils'
import { SmartImage } from '@/components/ui/SmartImage'
import type { Category, Product } from '@/types'

/* ------------------------------------------------------------------ shared shell */

export function MegaShell({
  open,
  onEnter,
  onLeave,
  children,
}: {
  open: boolean
  onEnter: () => void
  onLeave: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-hidden={!open}
      className={cn(
        'absolute inset-x-0 top-full z-50 hidden border-t border-blush-100 bg-white shadow-[0_28px_44px_-26px_rgba(96,6,25,0.4)] transition-all duration-200 md:block',
        open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-2 opacity-0',
      )}
    >
      <div className="mx-auto max-w-7xl px-8 py-7">{children}</div>
      <div className="h-1 bg-gradient-to-r from-brand-400 via-gold-500 to-brand-400" />
    </div>
  )
}

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-500', className)}>
      <span className="h-px w-6 bg-brand-400" />
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------ product data (cached per query) */

const productCache = new Map<string, Product[]>()

function useMenuProducts(key: string | null, filters: ProductFilters) {
  const [fetched, setFetched] = useState<{ key: string; list: Product[] } | null>(null)
  const cached = key ? productCache.get(key) : undefined

  useEffect(() => {
    if (!key || productCache.has(key)) return
    let alive = true
    fetchProducts(filters).then(async (list) => {
      // If nothing is flagged (e.g. no "trending" products yet), fall back to the newest pieces.
      const result = list.length === 0 && filters.flag ? await fetchProducts({ limit: filters.limit }) : list
      productCache.set(key, result)
      if (alive) setFetched({ key, list: result })
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (cached) return cached
  return fetched && fetched.key === key ? fetched.list : null
}

function MegaProductCard({ product, onNavigate }: { product: Product; onNavigate: () => void }) {
  const sorted = [...(product.images ?? [])].sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1))
  const image = sorted[0]?.url
  const pct = discountPercent(product.price, product.compare_at_price)
  return (
    <Link to={`/product/${product.slug}`} onClick={onNavigate} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-blush-50 ring-1 ring-blush-100 transition-shadow duration-300 group-hover:shadow-luxe">
        {image && (
          <SmartImage
            src={image}
            variant="md"
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {pct && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">{pct}% OFF</span>
        )}
      </div>
      <p className="mt-2.5 line-clamp-1 text-[13px] font-medium text-ink-900 transition-colors group-hover:text-brand-600">{product.name}</p>
      <p className="mt-0.5 text-xs">
        <span className="font-semibold text-brand-700">{formatINR(product.price)}</span>
        {product.compare_at_price && product.compare_at_price > product.price && (
          <span className="ml-1.5 text-ink-300 line-through">{formatINR(product.compare_at_price)}</span>
        )}
      </p>
    </Link>
  )
}

function ProductSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-xl bg-blush-100" />
          <div className="mt-2.5 h-3 w-3/4 rounded bg-blush-100" />
          <div className="mt-1.5 h-3 w-1/3 rounded bg-blush-100" />
        </div>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ "Shop" mega menu (main navbar) */

const collectionLinks = [
  { label: 'New Arrivals', to: '/collections/new-arrivals', note: 'Fresh this season' },
  { label: 'Best Sellers', to: '/collections/best-sellers', note: 'Loved by everyone' },
  { label: 'Sale', to: '/collections/sale', note: 'Limited-time offers' },
  { label: 'Under ₹399', to: '/shop?maxPrice=399', note: 'Pretty & pocket-friendly' },
]

export function ShopMegaMenu({ categories, onNavigate }: { categories: Category[]; onNavigate: () => void }) {
  const top = categories.filter((c) => !c.parent_id)
  const trending = useMenuProducts('shop:trending', { flag: 'is_trending', limit: 3 })

  return (
    <div className="grid grid-cols-[1.05fr_0.85fr_1.5fr] divide-x divide-blush-100">
      {/* categories */}
      <div className="pr-10">
        <Eyebrow>Shop By Category</Eyebrow>
        <ul>
          {top.map((c) => {
            const subs = categories.filter((s) => s.parent_id === c.id)
            return (
              <li key={c.id} className="border-b border-blush-100 last:border-b-0">
                <Link to={`/category/${c.slug}`} onClick={onNavigate} className="group flex items-center justify-between gap-3 py-3">
                  <span>
                    <span className="block font-serif text-[17px] leading-tight text-ink-900 transition-colors group-hover:text-brand-600">{c.name}</span>
                    {subs.length > 0 && <span className="mt-0.5 block text-xs text-ink-300">{subs.map((s) => s.name).join(' · ')}</span>}
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-brand-600" />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* collections */}
      <div className="px-10">
        <Eyebrow>Collections</Eyebrow>
        <ul className="space-y-1">
          {collectionLinks.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                onClick={onNavigate}
                className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-blush-50"
              >
                <span>
                  <span className="block text-sm font-medium text-ink-900 group-hover:text-brand-600">{l.label}</span>
                  <span className="block text-xs text-ink-300">{l.note}</span>
                </span>
                <ArrowRight size={14} className="text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blush-50 to-blush-100 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-luxe-sm">
            <Truck size={16} />
          </span>
          <p className="text-xs leading-snug text-ink-700">
            <strong className="block text-[13px] text-ink-900">Free shipping</strong>
            on prepaid orders above ₹999
          </p>
        </div>
      </div>

      {/* trending now */}
      <div className="pl-10">
        <div className="flex items-start justify-between">
          <Eyebrow>Trending Now</Eyebrow>
          <Link to="/shop" onClick={onNavigate} className="text-xs font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {trending === null ? (
            <ProductSkeletons count={3} />
          ) : (
            trending.slice(0, 3).map((p) => <MegaProductCard key={p.id} product={p} onNavigate={onNavigate} />)
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ per-category mega menu (category bar) */

export function CategoryMegaMenu({
  category,
  subcategories,
  onNavigate,
}: {
  category: Category
  subcategories: Category[]
  onNavigate: () => void
}) {
  const products = useMenuProducts(`cat:${category.slug}`, { categorySlug: category.slug, limit: 4 })
  return (
    <div className="grid grid-cols-[17rem_1fr] gap-8">
      {/* left: intro card */}
      <div className="flex flex-col rounded-2xl bg-gradient-to-br from-blush-50 to-blush-100 p-6">
        <Eyebrow className="mb-3">Explore</Eyebrow>
        <h3 className="font-serif text-3xl leading-tight text-ink-900">{category.name}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-500">
          {category.description || `Handpicked ${category.name.toLowerCase()} to match every mood and every outfit.`}
        </p>

        {subcategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {subcategories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                onClick={onNavigate}
                className="rounded-full border border-brand-300/60 bg-white px-3 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <Link
          to={`/category/${category.slug}`}
          onClick={onNavigate}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-luxe-sm transition-transform hover:scale-105 hover:bg-brand-700"
        >
          Shop all {category.name} <ArrowRight size={14} />
        </Link>

        <div className="mt-auto flex gap-4 pt-5 text-xs text-ink-500">
          <Link to="/collections/new-arrivals" onClick={onNavigate} className="flex items-center gap-1.5 hover:text-brand-600">
            <Sparkles size={12} /> New in
          </Link>
          <Link to="/collections/best-sellers" onClick={onNavigate} className="flex items-center gap-1.5 hover:text-brand-600">
            <Sparkles size={12} /> Best sellers
          </Link>
        </div>
      </div>

      {/* right: products */}
      <div>
        <div className="flex items-start justify-between">
          <Eyebrow>Popular in {category.name}</Eyebrow>
          <Link to={`/category/${category.slug}`} onClick={onNavigate} className="text-xs font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {products !== null && products.length === 0 ? (
          <p className="text-sm text-ink-300">New pieces are on their way. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {products === null ? <ProductSkeletons count={4} /> : products.map((p) => <MegaProductCard key={p.id} product={p} onNavigate={onNavigate} />)}
          </div>
        )}
      </div>
    </div>
  )
}
