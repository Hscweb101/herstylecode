import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CartItem } from '@/types'

interface CartState {
  cartId: string | null
  items: CartItem[]
  loading: boolean
  init: (userId: string) => Promise<void>
  addItem: (productId: string, variantId: string | null, qty: number) => Promise<void>
  updateQty: (itemId: string, qty: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  refresh: () => Promise<void>
  clear: () => Promise<void>
  reset: () => void
  subtotal: () => number
  itemCount: () => number
}

const CART_SELECT = `
  id, cart_id, product_id, variant_id, quantity,
  product:products(id, name, slug, price, compare_at_price, stock_quantity, track_inventory, is_active, cod_available, online_discount_type, online_discount_value, cod_advance_type, cod_advance_value,
    images:product_images(url, is_primary, sort_order)),
  variant:product_variants(id, variant_name, price, compare_at_price, stock_quantity, image_url, is_active)
`

// App.tsx's `if (userId) initCart(userId)` effect and the auth store's own
// onAuthStateChange listener can both fire init() for the same userId within
// the same tick (most visibly right after sign-out, when the anonymous
// session is re-established). Without de-duping, two concurrent "create the
// cart row if missing" calls race and the loser's insert throws a duplicate
// key error, which used to leave cartId stuck at null for the rest of the
// tab's life (every add-to-cart after that silently did nothing).
let pendingInitUserId: string | null = null
let pendingInit: Promise<void> | null = null

export const useCartStore = create<CartState>((set, get) => ({
  cartId: null,
  items: [],
  loading: false,

  init: async (userId: string) => {
    if (pendingInit && pendingInitUserId === userId) return pendingInit
    pendingInitUserId = userId
    pendingInit = (async () => {
      set({ loading: true })
      let { data: cart } = await supabase.from('carts').select('id').eq('customer_id', userId).maybeSingle()
      if (!cart) {
        const { data: created, error } = await supabase
          .from('carts')
          .insert({ customer_id: userId })
          .select('id')
          .single()
        if (error) {
          if (error.code === '23505') {
            // Lost the race to a concurrent init() — the cart now exists, just fetch it.
            const { data: existing } = await supabase.from('carts').select('id').eq('customer_id', userId).maybeSingle()
            cart = existing
          } else {
            console.error('Failed to create cart', error.message)
            set({ loading: false })
            return
          }
        } else {
          cart = created
        }
      }
      if (!cart) {
        set({ loading: false })
        return
      }
      set({ cartId: cart.id })
      await get().refresh()
    })()
    try {
      await pendingInit
    } finally {
      pendingInit = null
      pendingInitUserId = null
    }
  },

  refresh: async () => {
    const cartId = get().cartId
    if (!cartId) return
    set({ loading: true })
    const { data, error } = await supabase.from('cart_items').select(CART_SELECT).eq('cart_id', cartId)
    if (error) console.error(error.message)
    set({ items: (data as unknown as CartItem[]) ?? [], loading: false })
  },

  addItem: async (productId, variantId, qty) => {
    const cartId = get().cartId
    if (!cartId) return
    const existing = get().items.find(
      (i) => i.product_id === productId && i.variant_id === variantId
    )
    if (existing) {
      await get().updateQty(existing.id, existing.quantity + qty)
      return
    }
    const { error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, product_id: productId, variant_id: variantId, quantity: qty })
    if (error) console.error(error.message)
    await get().refresh()
  },

  updateQty: async (itemId, qty) => {
    if (qty <= 0) {
      await get().removeItem(itemId)
      return
    }
    const { error } = await supabase.from('cart_items').update({ quantity: qty }).eq('id', itemId)
    if (error) console.error(error.message)
    await get().refresh()
  },

  removeItem: async (itemId) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId)
    if (error) console.error(error.message)
    await get().refresh()
  },

  clear: async () => {
    const cartId = get().cartId
    if (!cartId) return
    await supabase.from('cart_items').delete().eq('cart_id', cartId)
    set({ items: [] })
  },

  // Drops the in-memory cart reference without touching the database.
  // Must run on sign-out: the old cartId belongs to the customer_id that
  // just logged out, and RLS will reject any write against it once the
  // session's auth.uid() changes to the new anonymous user.
  reset: () => set({ cartId: null, items: [] }),

  subtotal: () => {
    return get().items.reduce((sum, item) => {
      const price = item.variant?.price ?? item.product?.price ?? 0
      return sum + price * item.quantity
    }, 0)
  },

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}))
