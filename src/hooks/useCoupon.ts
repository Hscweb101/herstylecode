import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface CouponRule {
  code: string
  discount_type: string
  discount_value: number
  max_discount_amount: number | null
}

export interface AppliedCoupon {
  code: string
  discount: number
}

function discountFor(rule: CouponRule, subtotal: number) {
  let amount = rule.discount_type === 'percentage' ? (subtotal * rule.discount_value) / 100 : rule.discount_value
  if (rule.discount_type === 'percentage' && rule.max_discount_amount) amount = Math.min(amount, rule.max_discount_amount)
  return Math.min(Math.round(amount), subtotal)
}

/**
 * Coupon state for a checkout. Validates against the same `validate_coupon` RPC the server re-runs when the
 * order is created, and re-checks whenever the subtotal changes (e.g. minimum order value no longer met).
 * `initialCode` lets the cart page hand over a coupon it already applied.
 */
export function useCoupon(subtotal: number, initialCode?: string | null) {
  const userId = useAuthStore((s) => s.userId)
  const [rule, setRule] = useState<CouponRule | null>(null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)

  const validate = useCallback(
    async (code: string, base: number): Promise<{ rule?: CouponRule; message?: string }> => {
      const { data, error: rpcError } = await supabase.rpc('validate_coupon', {
        p_code: code,
        p_subtotal: base,
        p_customer_id: userId,
        p_guest_email: null,
      })
      const result = Array.isArray(data) ? data[0] : data
      if (rpcError || !result?.is_valid) return { message: result?.message ?? 'Invalid coupon code' }
      return {
        rule: {
          code: code.toUpperCase(),
          discount_type: result.discount_type,
          discount_value: Number(result.discount_value),
          max_discount_amount: result.max_discount_amount == null ? null : Number(result.max_discount_amount),
        },
      }
    },
    [userId],
  )

  const apply = useCallback(
    async (raw: string) => {
      const code = raw.trim()
      if (!code) return false
      setApplying(true)
      setError('')
      const id = ++request.current
      const { rule: found, message } = await validate(code, subtotal)
      if (id !== request.current) return false
      setApplying(false)
      if (!found) {
        setError(message ?? 'Invalid coupon code')
        return false
      }
      setRule(found)
      return true
    },
    [validate, subtotal],
  )

  const remove = useCallback(() => {
    request.current++
    setRule(null)
    setError('')
  }, [])

  // Pick up a coupon applied on the cart page.
  useEffect(() => {
    if (initialCode) void apply(initialCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The subtotal changed while a coupon is on: re-check it.
  const lastSubtotal = useRef(subtotal)
  useEffect(() => {
    if (lastSubtotal.current === subtotal) return
    lastSubtotal.current = subtotal
    if (!rule) return
    const code = rule.code
    const id = ++request.current
    void validate(code, subtotal).then(({ rule: found, message }) => {
      if (id !== request.current) return
      if (found) setRule(found)
      else {
        setRule(null)
        setError(message ?? 'Coupon removed')
      }
    })
  }, [subtotal, rule, validate])

  const coupon: AppliedCoupon | null = rule ? { code: rule.code, discount: discountFor(rule, subtotal) } : null
  return { coupon, applying, error, apply, remove }
}
