import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
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
  const primaryImage = sortedImages[0]?.url ?? 'https://placehold.co/600x600/FCE7EF/D6336C?text=HerStyleCode'
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
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush-50">
        <SmartImage
          src={image}
          variant="md"
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {pct && <Badge tone="brand">{pct}% OFF</Badge>}
          {product.is_new_arrival && <Badge tone="ink">New</Badge>}
          {outOfStock && <Badge tone="neutral">Sold Out</Badge>}
          {lowStock && <Badge tone="gold">Low Stock</Badge>}
        </div>
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-luxe-sm transition-transform hover:scale-110"
        >
          <Heart size={16} className={isWishlisted ? 'fill-brand-600 text-brand-600' : 'text-ink-700'} />
        </button>
        <button
          onClick={handleQuickAdd}
          disabled={outOfStock}
          className={cn(
            'pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2 rounded-full bg-ink-900/90 py-2.5 text-xs font-medium text-white opacity-0 backdrop-blur transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:bg-ink-300',
          )}
        >
          <ShoppingBag size={14} /> {outOfStock ? 'Sold Out' : 'Quick Add'}
        </button>
      </div>
      <div className="mt-3 space-y-1">
        {product.rating_count > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={product.rating_avg} size={11} />
            <span className="text-[11px] text-ink-300">({product.rating_count})</span>
          </div>
        )}
        <h3 className="truncate text-sm font-medium text-ink-900">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-700">{formatINR(product.price)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-ink-300 line-through">{formatINR(product.compare_at_price)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
