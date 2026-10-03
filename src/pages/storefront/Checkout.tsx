import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useSeo } from '@/hooks/useSeo'
import { invokeCreateOrder } from '@/lib/checkoutApi'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { formatINR } from '@/lib/utils'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState, Spinner } from '@/components/ui/Misc'
import type { Address } from '@/types'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

interface FormState {
  full_name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
}

export default function Checkout() {
  useSeo({ title: 'Checkout', noindex: true })
  const navigate = useNavigate()
  const { items, subtotal, updateQty, removeItem } = useCartStore()
  const { userId, isAnonymous, profile } = useAuthStore()
  const { settings } = useStoreSettings()
  const [form, setForm] = useState<FormState>({
    full_name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new')
  const [placing, setPlacing] = useState(false)
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('hsc_coupon')
    if (raw) setCoupon(JSON.parse(raw))
  }, [])

  useEffect(() => {
    if (!userId || isAnonymous) return
    supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', userId)
      .then(({ data }) => setSavedAddresses((data as Address[]) ?? []))
  }, [userId, isAnonymous])

  useEffect(() => {
    if (profile?.full_name) setForm((f) => ({ ...f, full_name: profile.full_name ?? '' }))
    if (profile?.phone) setForm((f) => ({ ...f, phone: profile.phone ?? '' }))
  }, [profile])

  const sub = subtotal()
  const shipping = sub >= settings.shipping.free_shipping_threshold ? 0 : settings.shipping.standard_shipping_fee
  const discount = coupon?.discount ?? 0
  const total = Math.max(0, sub + shipping - discount)

  const codBlockedBy = items.find((i) => i.product?.cod_available === false)?.product?.name ?? null
  const codAvailable = settings.shipping.cod_available && !codBlockedBy

  useEffect(() => {
    if (!codAvailable && paymentMethod === 'cod') setPaymentMethod('razorpay')
  }, [codAvailable, paymentMethod])

  const applySavedAddress = (id: string) => {
    setSelectedAddressId(id)
    const addr = savedAddresses.find((a) => a.id === id)
    if (addr) {
      setForm({
        full_name: addr.full_name, email: form.email, phone: addr.phone, line1: addr.line1,
        line2: addr.line2 ?? '', city: addr.city, state: addr.state, pincode: addr.pincode,
      })
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    for (const [key, val] of Object.entries(form)) {
      if (key !== 'line2' && !val) {
        toast.error('Please fill in all required fields')
        return
      }
    }
    setPlacing(true)

    const shippingAddress = {
      full_name: form.full_name, phone: form.phone, line1: form.line1, line2: form.line2,
      city: form.city, state: form.state, pincode: form.pincode, country: 'India',
    }

    const payload = {
      items: items.map((i) => ({ productId: i.product_id, variantId: i.variant_id, quantity: i.quantity })),
      shippingAddress,
      guestName: form.full_name,
      guestEmail: form.email,
      guestPhone: form.phone,
      couponCode: coupon?.code ?? null,
      paymentMethod,
    }

    const { data, error } = await invokeCreateOrder(payload)

    if (error || data?.error) {
      let message = data?.error ?? 'Could not place order. Please try again.'
      if (error instanceof FunctionsHttpError) {
        try {
          const body = await error.context.json()
          if (body?.error) message = body.error
        } catch {
          // response body wasn't JSON; keep the generic message
        }
      }
      toast.error(message)
      setPlacing(false)
      return
    }

    if (!isAnonymous && userId && selectedAddressId === 'new') {
      await supabase.from('addresses').insert({ customer_id: userId, ...shippingAddress })
    }

    if (paymentMethod === 'cod') {
      sessionStorage.removeItem('hsc_coupon')
      toast.success('Order placed successfully!')
      navigate(`/order-confirmation/${data.orderId}`)
      return
    }

    try {
      await openRazorpayCheckout({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'HerStyleCode',
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: { name: form.full_name, email: form.email, contact: form.phone },
        theme: { color: '#e34c86' },
        handler: async (response) => {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              orderId: data.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            },
          })
          if (verifyError || verifyData?.error) {
            toast.error('Payment verification failed. Please contact support.')
            return
          }
          sessionStorage.removeItem('hsc_coupon')
          toast.success('Payment successful!')
          navigate(`/order-confirmation/${data.orderId}`)
        },
        modal: {
          ondismiss: () => {
            setPlacing(false)
            toast('Payment cancelled', { icon: 'ℹ️' })
          },
        },
      })
    } catch {
      toast.error('Could not open payment window. Please try again.')
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState title="Your bag is empty" description="Add products before checking out." action={<Link to="/shop"><Button>Shop Now</Button></Link>} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <h1 className="mb-8 font-serif text-3xl">Checkout</h1>
      <form onSubmit={handlePlaceOrder} className="grid gap-10 md:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {savedAddresses.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-luxe-sm">
              <h3 className="mb-3 font-serif text-lg">Saved Addresses</h3>
              <div className="space-y-2">
                {savedAddresses.map((a) => (
                  <label key={a.id} className="flex items-start gap-2 rounded-xl border border-blush-100 p-3 text-sm">
                    <input type="radio" name="address" checked={selectedAddressId === a.id} onChange={() => applySavedAddress(a.id)} className="mt-1" />
                    <span>
                      <strong>{a.full_name}</strong> — {a.line1}, {a.city}, {a.state} {a.pincode}
                    </span>
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="address" checked={selectedAddressId === 'new'} onChange={() => setSelectedAddressId('new')} />
                  Use a new address
                </label>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-6 shadow-luxe-sm">
            <h3 className="mb-4 font-serif text-lg">Contact & Shipping Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <Input label="Mobile Number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Email" type="email" required className="sm:col-span-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Address Line 1" required className="sm:col-span-2" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              <Input label="Address Line 2 (optional)" className="sm:col-span-2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Select label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Input label="Pincode" required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-luxe-sm">
            <h3 className="mb-4 font-serif text-lg">Payment Method</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-xl border border-blush-100 p-3 text-sm">
                <input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                UPI / Cards / Net Banking (Razorpay Secure Checkout)
              </label>
              {codAvailable ? (
                <label className="flex items-center gap-3 rounded-xl border border-blush-100 p-3 text-sm">
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  Cash on Delivery
                </label>
              ) : (
                settings.shipping.cod_available && codBlockedBy && (
                  <p className="rounded-xl bg-blush-50 p-3 text-xs text-gray-500">
                    Cash on Delivery isn't available for &ldquo;{codBlockedBy}&rdquo; in your cart.
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-luxe-sm">
          <h3 className="mb-4 font-serif text-xl">Order Summary</h3>
          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
            {items.map((item) => {
              const image = item.variant?.image_url ?? item.product?.images?.find((i) => i.is_primary)?.url
              const price = item.variant?.price ?? item.product?.price ?? 0
              return (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="text-ink-900">{item.product?.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-blush-200">
                        <button type="button" className="p-1.5" onClick={() => updateQty(item.id, item.quantity - 1)}>
                          <Minus size={11} />
                        </button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <button type="button" className="p-1.5" onClick={() => updateQty(item.id, item.quantity + 1)}>
                          <Plus size={11} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} aria-label="Remove item">
                        <Trash2 size={14} className="text-ink-300 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                  <span className="shrink-0 font-medium">{formatINR(price * item.quantity)}</span>
                </div>
              )
            })}
          </div>
          <div className="space-y-2 border-t border-blush-100 pt-4 text-sm">
            <div className="flex justify-between text-ink-500"><span>Subtotal</span><span>{formatINR(sub)}</span></div>
            {coupon && <div className="flex justify-between text-emerald-600"><span>Coupon</span><span>-{formatINR(discount)}</span></div>}
            <div className="flex justify-between text-ink-500"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
            <div className="my-2 h-px bg-blush-100" />
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatINR(total)}</span></div>
          </div>
          <Button type="submit" size="lg" className="mt-5 w-full" loading={placing}>
            {placing ? 'Processing...' : `Place Order — ${formatINR(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-300">100% secure checkout. Your data is encrypted.</p>
        </div>
      </form>
      {placing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
          <Spinner />
        </div>
      )}
    </div>
  )
}
