import type { PaymentOffers } from '@/types'

/** Site-wide payment offers an admin sets in Admin > Settings. Mirrors checkout-create-order (the server is the source of truth). */
export const DEFAULT_PAYMENT_OFFERS: PaymentOffers = {
  online_discount_type: 'percent',
  online_discount_value: 0,
  cod_advance_type: 'none',
  cod_advance_value: 0,
}

function offerAmount(type: string | null | undefined, value: number | null | undefined, base: number) {
  const v = Number(value) || 0
  if (v <= 0 || base <= 0) return 0
  return Math.min(base, type === 'percent' ? Math.round((base * Math.min(v, 100)) / 100) : Math.round(v))
}

/** Rupees off the order subtotal when the shopper pays online ("Pay Now"). */
export function onlineDiscountFor(offers: PaymentOffers | null | undefined, subtotal: number) {
  return offers ? offerAmount(offers.online_discount_type, offers.online_discount_value, subtotal) : 0
}

/** Rupees of the order total that must be paid online up front when the shopper chooses Cash on Delivery. */
export function codAdvanceFor(offers: PaymentOffers | null | undefined, total: number) {
  if (!offers || offers.cod_advance_type === 'none') return 0
  return Math.min(offerAmount(offers.cod_advance_type, offers.cod_advance_value, total), Math.max(0, total - 1))
}
