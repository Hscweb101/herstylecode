import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

/**
 * Calls the checkout-create-order edge function. If the browser's login belongs to an account that no longer
 * exists (e.g. the customer was deleted from the admin panel), the server answers 401 "Not authenticated";
 * we start a fresh guest session and retry once so the shopper can still order.
 */
export async function invokeCreateOrder(body: unknown) {
  const call = () => supabase.functions.invoke('checkout-create-order', { body: body as Record<string, unknown> })
  let res = await call()
  if (res.error instanceof FunctionsHttpError && res.error.context.status === 401) {
    await useAuthStore.getState().recoverSession()
    res = await call()
  }
  return res
}
