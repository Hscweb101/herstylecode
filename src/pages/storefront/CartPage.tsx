import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useSeo } from '@/hooks/useSeo'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { formatINR } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/Misc'

export default function CartPage() {
  useSeo({ title: 'Your Cart', noindex: true })
  const { items, updateQty, removeItem, subtotal } = useCartStore()
  const { settings } = useStoreSettings()
  const userId = useAuthStore((s) => s.userId)
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)

  const sub = subtotal()
  const shipping = sub >= settings.shipping.free_shipping_threshold || sub === 0 ? 0 : settings.shipping.standard_shipping_fee
  const discount = appliedCoupon?.discount ?? 0
  const total = Math.max(0, sub + shipping - discount)

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setApplying(true)
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: couponCode.trim(),
      p_subtotal: sub,
      p_customer_id: userId,
      p_guest_email: null,
    })
    setApplying(false)
    const result = Array.isArray(data) ? data[0] : data
    if (error || !result?.is_valid) {
      toast.error(result?.message ?? 'Invalid coupon')
      setAppliedCoupon(null)
      return
    }
    let discountAmount = 0
    if (result.discount_type === 'percentage') {
      discountAmount = (sub * result.discount_value) / 100
      if (result.max_discount_amount) discountAmount = Math.min(discountAmount, result.max_discount_amount)
    } else {
      discountAmount = result.discount_value
    }
    setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount: discountAmount })
    toast.success('Coupon applied!')
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="Your bag is empty"
          description="Looks like you haven't added anything yet. Let's fix that."
          action={
            <Link to="/shop">
              <Button>Start Shopping</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <h1 className="mb-8 font-serif text-3xl">Your Bag</h1>
      <div className="grid gap-10 md:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {items.map((item) => {
            const image = item.variant?.image_url ?? item.product?.images?.find((i) => i.is_primary)?.url ?? item.product?.images?.[0]?.url
            const price = item.variant?.price ?? item.product?.price ?? 0
            return (
              <div key={item.id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-luxe-sm">
                <img src={image} alt={item.product?.name} className="h-24 w-24 rounded-xl object-cover" />
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <div>
                      <Link to={`/product/${item.product?.slug}`} className="font-medium text-ink-900 hover:text-brand-600">
                        {item.product?.name}
                      </Link>
                      {item.variant?.variant_name && <p className="text-xs text-ink-300">{item.variant.variant_name}</p>}
                    </div>
                    <button onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} className="text-ink-300 hover:text-red-500" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-blush-200">
                      <button className="p-2" onClick={() => updateQty(item.id, item.quantity - 1)}>
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button className="p-2" onClick={() => updateQty(item.id, item.quantity + 1)}>
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="font-semibold text-brand-700">{formatINR(price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-luxe-sm">
          <h3 className="mb-4 font-serif text-xl">Order Summary</h3>
          <div className="mb-4 flex gap-2">
            <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1" />
            <Button variant="outline" onClick={applyCoupon} loading={applying}>
              Apply
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-500">
              <span>Subtotal</span>
              <span>{formatINR(sub)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-500">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatINR(shipping)}</span>
            </div>
            <div className="my-2 h-px bg-blush-100" />
            <div className="flex justify-between text-base font-semibold text-ink-900">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
          {sub < settings.shipping.free_shipping_threshold && (
            <p className="mt-3 text-xs text-brand-600">
              Add {formatINR(settings.shipping.free_shipping_threshold - sub)} more for free shipping!
            </p>
          )}
          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => {
              if (appliedCoupon) sessionStorage.setItem('hsc_coupon', JSON.stringify(appliedCoupon))
              navigate('/checkout')
            }}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
