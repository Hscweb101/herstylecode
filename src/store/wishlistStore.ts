import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { WishlistItem } from '@/types'

interface WishlistState {
  items: WishlistItem[]
  loading: boolean
  init: (userId: string) => Promise<void>
  toggle: (productId: string) => Promise<void>
  isWishlisted: (productId: string) => boolean
  remove: (productId: string) => Promise<void>
  reset: () => void
}

const WISHLIST_SELECT = `
  id, customer_id, product_id, variant_id,
  product:products(id, name, slug, price, compare_at_price, is_active,
    images:product_images(url, is_primary, sort_order))
`

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,

  init: async (userId: string) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('wishlists')
      .select(WISHLIST_SELECT)
      .eq('customer_id', userId)
    if (error) console.error(error.message)
    set({ items: (data as unknown as WishlistItem[]) ?? [], loading: false })
  },

  toggle: async (productId: string) => {
    const existing = get().items.find((i) => i.product_id === productId)
    if (existing) {
      await get().remove(productId)
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user.id
    if (!userId) return
    const { error } = await supabase.from('wishlists').insert({ customer_id: userId, product_id: productId })
    if (error) {
      console.error(error.message)
      return
    }
    const { data } = await supabase
      .from('wishlists')
      .select(WISHLIST_SELECT)
      .eq('customer_id', userId)
    set({ items: (data as unknown as WishlistItem[]) ?? [] })
  },

  isWishlisted: (productId: string) => get().items.some((i) => i.product_id === productId),

  remove: async (productId: string) => {
    const item = get().items.find((i) => i.product_id === productId)
    if (!item) return
    await supabase.from('wishlists').delete().eq('id', item.id)
    set({ items: get().items.filter((i) => i.id !== item.id) })
  },

  reset: () => set({ items: [] }),
}))
