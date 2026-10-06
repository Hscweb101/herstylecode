import type { Product } from '@/types'

/** The per-product payment offers an admin sets in Admin > Products. Mirrors checkout-create-order (the server is the source of truth). */
export type OfferFields = Partial<
  Pick<Product, 'online_discount_type' | 'online_discount_value' | 'cod_advance_type' | 'cod_advance_value'>
>

function offerAmount(type: string | null | undefined, value: number | null | undefined, unitPrice: number, qty: number) {
  const v = Number(value) || 0
  if (v <= 0) return 0
  const lineTotal = unitPrice * qty
  return Math.min(lineTotal, type === 'percent' ? Math.round((lineTotal * Math.min(v, 100)) / 100) : Math.round(v * qty))
}

/** Rupees off a line when the shopper pays online ("Pay Now"). */
export function onlineDiscountFor(p: OfferFields | null | undefined, unitPrice: number, qty: number) {
  return p ? offerAmount(p.online_discount_type, p.online_discount_value, unitPrice, qty) : 0
}

/** Rupees of a line that must be paid online up front when the shopper chooses Cash on Delivery. */
export function codAdvanceFor(p: OfferFields | null | undefined, unitPrice: number, qty: number) {
  if (!p || p.cod_advance_type === 'none') return 0
  return offerAmount(p.cod_advance_type, p.cod_advance_value, unitPrice, qty)
}
