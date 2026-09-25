import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchProducts, type ProductFilters } from '@/lib/queries'
import type { Product } from '@/types'
import { ProductCard } from '@/components/storefront/ProductCard'
import { EmptyState, FullPageSpinner } from '@/components/ui/Misc'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Input'
import { useCategories } from '@/hooks/useCategories'
import { cn, discountPercent, formatINR } from '@/lib/utils'

const TITLES: Record<string, string> = {
  'new-arrivals': 'New Arrivals',
  'best-sellers': 'Best Sellers',
  trending: 'Trending Now',
  sale: 'Sale',
}

const PAGE_SIZE = 12
const PRICE_STEP = 50

// Sort options. The last three put that group of products first (then everything else in the default order).
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'best_sellers', label: 'Best Sellers' },
  { value: 'sale', label: 'Sale' },
  { value: 'new_arrivals', label: 'New Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Top Rated' },
]
const SERVER_SORTS = ['newest', 'price_asc', 'price_desc', 'popularity', 'rating']

function FilterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-ink-900">
      <span className="h-3.5 w-1 rounded-full bg-brand-500" />
      {children}
    </h4>
  )
}

/** Two-handle price slider. Dragging updates the labels live; the filter is applied when you let go. */
function PriceRange({
  bounds,
  value,
  onCommit,
}: {
  bounds: { min: number; max: number }
  value: [number, number]
  onCommit: (lo: number, hi: number) => void
}) {
  const [lo, setLo] = useState(value[0])
  const [hi, setHi] = useState(value[1])
  const span = Math.max(1, bounds.max - bounds.min)
  const pct = (v: number) => ((v - bounds.min) / span) * 100
  const commit = () => onCommit(lo, hi)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="rounded-full bg-blush-50 px-3 py-1 font-semibold text-brand-700 ring-1 ring-brand-300/40">{formatINR(lo)}</span>
        <span className="text-ink-300">to</span>
        <span className="rounded-full bg-blush-50 px-3 py-1 font-semibold text-brand-700 ring-1 ring-brand-300/40">{formatINR(hi)}</span>
      </div>

      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blush-100" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          aria-label="Minimum price"
          className="range-thumb"
          min={bounds.min}
          max={bounds.max}
          step={PRICE_STEP}
          value={lo}
          style={{ zIndex: lo > bounds.max - PRICE_STEP * 3 ? 5 : 3 }}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - PRICE_STEP))}
          onPointerUp={commit}
          onKeyUp={commit}
          onTouchEnd={commit}
        />
        <input
          type="range"
          aria-label="Maximum price"
          className="range-thumb"
          min={bounds.min}
          max={bounds.max}
          step={PRICE_STEP}
          value={hi}
          style={{ zIndex: 4 }}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + PRICE_STEP))}
          onPointerUp={commit}
          onKeyUp={commit}
          onTouchEnd={commit}
        />
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-ink-300">
        <span>{formatINR(bounds.min)}</span>
        <span>{formatINR(bounds.max)}</span>
      </div>
    </div>
  )
}

export default function Shop({ mode }: { mode: 'all' | 'collection' | 'category' }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [priceOpen, setPriceOpen] = useState(false) // phones: the inline price panel
  const [bounds, setBounds] = useState<{ min: number; max: number } | null>(null)
  const { categories } = useCategories()
  const gridTop = useRef<HTMLDivElement>(null)

  const sort = searchParams.get('sort') ?? 'newest'
  const search = searchParams.get('q') ?? ''
  const colourParam = searchParams.get('colour') ?? ''
  const maxPriceParam = searchParams.get('maxPrice') ?? ''
  const minPriceParam = searchParams.get('minPrice') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const serverSort = (SERVER_SORTS.includes(sort) ? sort : 'newest') as ProductFilters['sort']

  const pageTitle =
    mode === 'all' && maxPriceParam && !minPriceParam
      ? `Under ₹${maxPriceParam}`
      : mode === 'all'
        ? 'Shop All'
        : mode === 'collection'
          ? TITLES[slug ?? ''] ?? slug
          : slug?.replace(/-/g, ' ')

  // Overall price range of the store, so the slider always spans the same scale.
  useEffect(() => {
    supabase
      .from('products')
      .select('price')
      .eq('is_active', true)
      .then(({ data }) => {
        const prices = (data ?? []).map((r) => Number(r.price)).filter((n) => Number.isFinite(n))
        if (prices.length === 0) return
        const min = Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP
        const max = Math.max(min + PRICE_STEP * 2, Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP)
        setBounds({ min, max })
      })
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const filters: ProductFilters = {
        sort: serverSort,
        search: search || undefined,
        minPrice: minPriceParam ? Number(minPriceParam) : undefined,
        maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
      }
      if (mode === 'category' && slug) filters.categorySlug = slug
      if (mode === 'collection' && slug) {
        if (slug === 'sale') filters.flag = 'is_on_sale'
        else filters.collectionSlug = slug
      }
      const data = await fetchProducts(filters)
      setProducts(data)
      setLoading(false)
    }
    load()
  }, [mode, slug, serverSort, search, minPriceParam, maxPriceParam])

  // Colours available in the current result set (before the colour filter is applied, so you can switch between them).
  const colours = useMemo(
    () => Array.from(new Set(products.map((p) => (p as Product & { colour?: string }).colour).filter((c): c is string => !!c))),
    [products],
  )

  const visibleProducts = useMemo(() => {
    const list = colourParam ? products.filter((p) => (p as Product & { colour?: string }).colour === colourParam) : products
    // Best Sellers / Sale / New Arrivals: those products first, everything else after (stable, keeps the default order).
    const rank = (p: Product): number => {
      if (sort === 'best_sellers') return p.is_bestseller ? 1 : 0
      if (sort === 'new_arrivals') return p.is_new_arrival ? 1 : 0
      if (sort === 'sale') return p.is_on_sale ? 1 + (discountPercent(p.price, p.compare_at_price) ?? 0) / 100 : 0
      return 0
    }
    if (!['best_sellers', 'new_arrivals', 'sale'].includes(sort)) return list
    return [...list].sort((a, b) => rank(b) - rank(a))
  }, [products, colourParam, sort])

  const topLevelCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const currentCategory = useMemo(() => (mode === 'category' ? categories.find((c) => c.slug === slug) : undefined), [categories, mode, slug])
  // A sub-category page shows its parent in the dropdown.
  const dropdownCategory = currentCategory?.parent_id ? categories.find((c) => c.id === currentCategory.parent_id) : currentCategory
  const dropdownValue = dropdownCategory?.slug ?? ''
  const subcategories = useMemo(
    () => (currentCategory ? categories.filter((c) => c.parent_id === currentCategory.id) : []),
    [categories, currentCategory],
  )

  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedProducts = visibleProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const setParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in changes)) next.delete('page') // any filter/sort change starts again from page 1
    setSearchParams(next)
  }
  const updateParam = (key: string, value: string) => setParams({ [key]: value })

  const goToPage = (n: number) => {
    setParams({ page: n > 1 ? String(n) : '' })
    gridTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const applyPrice = (lo: number, hi: number) => {
    if (!bounds) return
    setParams({ minPrice: lo <= bounds.min ? '' : String(lo), maxPrice: hi >= bounds.max ? '' : String(hi) })
  }

  const chooseCategory = (value: string) => navigate(value ? `/category/${value}` : '/shop')

  const priceChip = (() => {
    if (!minPriceParam && !maxPriceParam) return null
    if (minPriceParam && maxPriceParam) return `${formatINR(Number(minPriceParam))} - ${formatINR(Number(maxPriceParam))}`
    return maxPriceParam ? `Under ${formatINR(Number(maxPriceParam))}` : `Above ${formatINR(Number(minPriceParam))}`
  })()

  // Everything currently narrowing the list, shown as removable chips.
  const activeFilters = [
    priceChip && { label: priceChip, remove: () => setParams({ minPrice: '', maxPrice: '' }) },
    colourParam && { label: colourParam, remove: () => updateParam('colour', '') },
    search && { label: `“${search}”`, remove: () => updateParam('q', '') },
  ].filter(Boolean) as { label: string; remove: () => void }[]

  const clearAll = () => setSearchParams({})

  const sliderValue: [number, number] | null = bounds
    ? [
        Math.min(Math.max(Number(minPriceParam) || bounds.min, bounds.min), bounds.max - PRICE_STEP),
        Math.max(Math.min(Number(maxPriceParam) || bounds.max, bounds.max), bounds.min + PRICE_STEP),
      ]
    : null

  const priceSlider =
    bounds && sliderValue ? (
      <PriceRange key={`${bounds.min}-${bounds.max}-${minPriceParam}-${maxPriceParam}`} bounds={bounds} value={sliderValue} onCommit={applyPrice} />
    ) : (
      <div className="h-16 animate-pulse rounded-xl bg-blush-50" />
    )

  const colourChips = (
    <>
      {colours.map((c) => {
        const on = colourParam === c
        return (
          <button
            key={c}
            type="button"
            aria-pressed={on}
            onClick={() => updateParam('colour', on ? '' : c)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
              on
                ? 'border-brand-600 bg-brand-600 text-white shadow-luxe-sm'
                : 'border-blush-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-600',
            )}
          >
            {c}
          </button>
        )
      })}
    </>
  )

  // Desktop / tablet: filter card in the sidebar.
  const filterPanel = (
    <div className="overflow-hidden rounded-2xl border border-brand-200/60 bg-white shadow-luxe md:sticky md:top-28">
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-5 py-3.5 text-white">
        <h3 className="flex items-center gap-2 font-serif text-lg">
          <SlidersHorizontal size={16} /> Filters
          {activeFilters.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-brand-700">
              {activeFilters.length}
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-6 p-5">
        {topLevelCategories.length > 0 && (
          <div>
            <FilterHeading>Category</FilterHeading>
            {/* A closed dropdown: shows "All Categories" until you pick one. */}
            <Select
              value={dropdownValue}
              aria-label="Select category"
              onChange={(e) => chooseCategory(e.target.value)}
              className="[&_select]:cursor-pointer [&_select]:border-brand-300 [&_select]:font-medium [&_select]:text-ink-900"
            >
              <option value="">All Categories</option>
              {topLevelCategories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <FilterHeading>Price</FilterHeading>
          {priceSlider}
        </div>

        {colours.length > 0 && (
          <div>
            <FilterHeading>Colour</FilterHeading>
            <div className="flex flex-wrap gap-2">{colourChips}</div>
          </div>
        )}

        {activeFilters.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full rounded-full border border-brand-500 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-600 hover:text-white"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-1 border-b border-blush-100 pb-6 md:mb-8">
        <h1 className="font-serif text-3xl capitalize text-ink-900 md:text-4xl">{pageTitle}</h1>
        <p className="text-sm text-ink-300">{loading ? 'Loading products…' : `${visibleProducts.length} products`}</p>
        {subcategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {subcategories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                className="rounded-full border border-blush-200 px-4 py-1.5 text-sm text-ink-700 hover:border-brand-400 hover:text-brand-600"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Phones: category and price are two separate controls (no full-page filter screen). */}
      <div className="space-y-3 md:hidden">
        <div className="grid grid-cols-[1.45fr_1fr] gap-3">
          {/* Category: a dropdown that only opens when tapped */}
          <div className="relative">
            <div
              className={cn(
                'flex items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-luxe-sm',
                dropdownCategory ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-300 bg-white text-brand-700',
              )}
            >
              <span className="truncate">{dropdownCategory ? dropdownCategory.name : 'Select Categories'}</span>
              <ChevronDown size={16} className="shrink-0" />
            </div>
            <select
              aria-label="Select category"
              value={dropdownValue}
              onChange={(e) => chooseCategory(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              <option value="">All Categories</option>
              {topLevelCategories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Price: opens a small panel right below */}
          <button
            type="button"
            aria-expanded={priceOpen}
            onClick={() => setPriceOpen((o) => !o)}
            className={cn(
              'flex items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-luxe-sm',
              priceChip ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-300 bg-white text-brand-700',
            )}
          >
            <span className="truncate">{priceChip ?? 'Price'}</span>
            <ChevronDown size={16} className={cn('shrink-0 transition-transform', priceOpen && 'rotate-180')} />
          </button>
        </div>

        {priceOpen && (
          <div className="rounded-2xl border border-brand-200/60 bg-white p-4 shadow-luxe">
            <FilterHeading>Price range</FilterHeading>
            {priceSlider}
            <div className="mt-4 flex gap-2">
              {priceChip && (
                <button
                  onClick={() => setParams({ minPrice: '', maxPrice: '' })}
                  className="flex-1 rounded-full border border-brand-500 py-2 text-sm font-semibold text-brand-600"
                >
                  Reset
                </button>
              )}
              <button onClick={() => setPriceOpen(false)} className="flex-1 rounded-full bg-brand-600 py-2 text-sm font-semibold text-white">
                Done
              </button>
            </div>
          </div>
        )}

        <Select value={sort} aria-label="Sort by" onChange={(e) => updateParam('sort', e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>Sort: {o.label}</option>
          ))}
        </Select>

        {colours.length > 0 && <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">{colourChips}</div>}
      </div>

      <div className="mt-6 grid gap-8 md:mt-0 md:grid-cols-[260px_1fr]">
        <aside className="hidden md:block">{filterPanel}</aside>

        <div ref={gridTop} className="scroll-mt-32">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {activeFilters.length > 0 ? (
                <>
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Active:</span>
                  {activeFilters.map((f) => (
                    <button
                      key={f.label}
                      onClick={f.remove}
                      className="group flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white shadow-luxe-sm transition-colors hover:bg-brand-700"
                    >
                      {f.label}
                      <X size={12} className="opacity-80 group-hover:opacity-100" />
                    </button>
                  ))}
                  <button onClick={clearAll} className="text-xs font-medium text-brand-600 underline">Clear all</button>
                </>
              ) : null}
            </div>
            <Select value={sort} aria-label="Sort by" onChange={(e) => updateParam('sort', e.target.value)} className="hidden w-56 md:block">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </Select>
          </div>

          {loading ? (
            <FullPageSpinner />
          ) : visibleProducts.length === 0 ? (
            <EmptyState title="No products found" description="Try adjusting your filters or check back soon for new arrivals." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                {pagedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination page={currentPage} pageSize={PAGE_SIZE} total={visibleProducts.length} onPage={goToPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
