import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import type { Profile } from '@/types'

interface AuthState {
  userId: string | null
  isAnonymous: boolean
  profile: Profile | null
  isAdmin: boolean
  ready: boolean
  init: () => Promise<void>
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

/** Re-assigns guest orders placed with the signed-in customer's (confirmed) e-mail to their account. */
async function claimGuestOrders() {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user || user.is_anonymous) return
  const { error } = await supabase.rpc('claim_my_orders')
  if (error) console.warn('claim_my_orders failed', error.message)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  isAnonymous: true,
  profile: null,
  isAdmin: false,
  ready: false,

  init: async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    let session = sessionData.session

    if (!session) {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Anonymous sign-in failed', error.message)
      }
      session = data?.session ?? null
    }

    set({
      userId: session?.user.id ?? null,
      isAnonymous: session?.user.is_anonymous ?? true,
    })

    await get().refreshProfile()
    set({ ready: true })
    void claimGuestOrders()

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      set({
        userId: newSession?.user.id ?? null,
        isAnonymous: newSession?.user.is_anonymous ?? true,
      })
      await get().refreshProfile()
      // Deferred: supabase-js must not be re-entered from inside its own auth callback.
      if (newSession && !newSession.user.is_anonymous) window.setTimeout(() => void claimGuestOrders(), 0)
    })
  },

  refreshProfile: async () => {
    const userId = get().userId
    if (!userId) {
      set({ profile: null, isAdmin: false })
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    set({ profile: (data as Profile) ?? null, isAdmin: data?.role === 'admin' || data?.role === 'staff' })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    // The old cart/wishlist belong to the customer_id that just logged out.
    // Drop them immediately so nothing writes against a stale cart_id under
    // the new anonymous session's auth.uid() (that would fail RLS with a
    // confusing "row-level security" error on the next add-to-cart/checkout).
    useCartStore.getState().reset()
    useWishlistStore.getState().reset()
    set({ userId: null, isAnonymous: true, profile: null, isAdmin: false })
    const { data } = await supabase.auth.signInAnonymously()
    set({ userId: data?.session?.user.id ?? null, isAnonymous: true })
  },
}))
