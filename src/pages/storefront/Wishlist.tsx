import { Link } from 'react-router-dom'
import { useSeo } from '@/hooks/useSeo'
import { useWishlistStore } from '@/store/wishlistStore'
import { ProductCard } from '@/components/storefront/ProductCard'
import { EmptyState } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/types'

export default function Wishlist() {
  useSeo({ title: 'Wishlist', noindex: true })
  const items = useWishlistStore((s) => s.items)

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="Your wishlist is empty"
          description="Save your favourite pieces here to shop them later."
          action={<Link to="/shop"><Button>Explore Products</Button></Link>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="mb-8 font-serif text-3xl">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {items.filter((i) => i.product).map((i) => (
          <ProductCard key={i.id} product={i.product as Product} />
        ))}
      </div>
    </div>
  )
}
