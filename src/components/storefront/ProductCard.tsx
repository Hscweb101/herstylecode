import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Heart, ShoppingCart, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product } from '@/types'
import { cn, discountPercent, formatINR } from '@/lib/utils'
import { Badge, StarRating } from '@/components/ui/Misc'
import { SmartImage } from '@/components/ui/SmartImage'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'

export function ProductCard({ product }: { product: Product }) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id))
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const addItem = useCartStore((s) => s.addItem)
  const [hovered, setHovered] = useState(false)

  const sortedImages = [...(product.images ?? [])].sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1))
  const primaryImage = sortedImages[0]?.url ?? 'https://placehold.co/600x600/F1EBD8/722F37?text=HerStyleCode'
  const secondaryImage = sortedImages[1]?.url ?? primaryImage
  const image = hovered ? secondaryImage : primaryImage
  const pct = discountPercent(product.price, product.compare_at_price)
  const outOfStock = product.track_inventory !== false && product.stock_quantity <= 0
  const lowStock = !outOfStock && product.stock_quantity > 0 && product.stock_quantity <= 5

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleWishlist(product.id)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (outOfStock) return
    addItem(product.id, null, 1)
    toast.success('Added to cart')
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white/60 shadow-[0_6px_22px_-10px_rgba(96,6,25,0.25)] transition-shadow duration-300 hover:shadow-[0_10px_28px_-8px_rgba(96,6,25,0.32)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/4.3] overflow-hidden bg-blush-50">
        <SmartImage
          src={image}
          variant="md"
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {pct && <Badge tone="brand">{pct}% OFF</Badge>}
          {product.is_new_arrival && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-cream">
              <Sparkles size={10} className="fill-current" /> New
            </span>
          )}
          {outOfStock && <Badge tone="neutral">Sold Out</Badge>}
          {lowStock && <span className="inline-flex items-center rounded-full bg-brand-300 px-2.5 py-0.5 text-[11px] font-medium text-white">Low Stock</span>}
        </div>
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-cream/95 shadow-luxe-sm transition-transform hover:scale-110"
        >
          <Heart size={16} className={isWishlisted ? 'fill-brand-600 text-brand-600' : 'text-ink-700'} />
        </button>
      </div>
      <div className="relative flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3 pr-14">
        {product.rating_count > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={product.rating_avg} size={11} />
            <span className="text-[11px] text-ink-300">({product.rating_count})</span>
          </div>
        )}
        <h3 className="line-clamp-2 font-serif text-[15px] leading-snug text-ink-900">{product.name}</h3>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="text-base font-semibold text-brand-700">{formatINR(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-ink-300 line-through">{formatINR(product.compare_at_price)}</span>
          )}
        </div>
        <button
          onClick={handleQuickAdd}
          disabled={outOfStock}
          aria-label={outOfStock ? 'Sold out' : 'Add to cart'}
          className={cn(
            'absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-brand-300 text-brand-600 transition-colors hover:bg-brand-600 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <ShoppingCart size={15} />
        </button>
      </div>
    </Link>
  )
}
