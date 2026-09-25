import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useCartStore } from '@/store/cartStore'
import { formatINR } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Misc'

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUIStore()
  const { items, updateQty, removeItem, subtotal } = useCartStore()

  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/40" onClick={() => setCartOpen(false)} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-blush-100 px-5 py-4">
          <h2 className="font-serif text-lg">Your Bag ({items.length})</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <EmptyState title="Your bag is empty" description="Add something beautiful to it." />
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const image = item.variant?.image_url ?? item.product?.images?.find((i) => i.is_primary)?.url ?? item.product?.images?.[0]?.url
                const price = item.variant?.price ?? item.product?.price ?? 0
                return (
                  <div key={item.id} className="flex gap-3">
                    <img src={image} alt={item.product?.name} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <Link to={`/product/${item.product?.slug}`} onClick={() => setCartOpen(false)} className="text-sm font-medium text-ink-900 hover:text-brand-600">
                          {item.product?.name}
                        </Link>
                        <button onClick={() => removeItem(item.id)} aria-label="Remove">
                          <Trash2 size={15} className="text-ink-300 hover:text-red-500" />
                        </button>
                      </div>
                      {item.variant?.variant_name && <p className="text-xs text-ink-300">{item.variant.variant_name}</p>}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-blush-200">
                          <button className="p-1.5" onClick={() => updateQty(item.id, item.quantity - 1)}>
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs">{item.quantity}</span>
                          <button className="p-1.5" onClick={() => updateQty(item.id, item.quantity + 1)}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-brand-700">{formatINR(price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-blush-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-ink-500">Subtotal</span>
              <span className="font-semibold text-ink-900">{formatINR(subtotal())}</span>
            </div>
            <p className="mb-3 text-xs text-ink-300">Shipping & taxes calculated at checkout.</p>
            <Link to="/checkout" onClick={() => setCartOpen(false)}>
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
            <Link to="/cart" onClick={() => setCartOpen(false)} className="mt-2 block text-center text-xs text-ink-500 underline">
              View full cart
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
