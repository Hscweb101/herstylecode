import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Minus, Plus, X } from 'lucide-react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { formatINR } from '@/lib/utils'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Misc'
import type { Product, ProductVariant } from '@/types'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

interface FormState {
  full_name: string
  phone: string
  address: string
  landmark: string
  state: string
  city: string
  pincode: string
  email: string
}

const EMPTY_FORM: FormState = {
  full_name: '', phone: '', address: '', landmark: '', state: '', city: '', pincode: '', email: '',
}

interface QuickCheckoutModalProps {
  product: Product
  variant: ProductVariant | null
  qty: number
  onClose: () => void
}

export function QuickCheckoutModal({ product, variant, qty: initialQty, onClose }: QuickCheckoutModalProps) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { settings } = useStoreSettings()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [placing, setPlacing] = useState(false)
  const [quantity, setQuantity] = useState(Math.max(1, initialQty))

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    setForm((f) => ({
      ...f,
      full_name: profile?.full_name ?? f.full_name,
      phone: profile?.phone ?? f.phone,
    }))
  }, [profile])

  const price = variant?.price ?? product.price
  const image = variant?.image_url ?? product.images?.find((i) => i.is_primary)?.url ?? product.images?.[0]?.url
  const stock = variant ? variant.stock_quantity : product.stock_quantity
  const maxQty = product.track_inventory !== false ? Math.max(1, stock) : 20
  const subtotal = price * quantity
  const shipping = subtotal >= settings.shipping.free_shipping_threshold ? 0 : settings.shipping.standard_shipping_fee
  const total = subtotal + shipping
  const codAvailable = settings.shipping.cod_available && product.cod_available !== false

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const required: (keyof FormState)[] = ['full_name', 'phone', 'address', 'state', 'city', 'pincode', 'email']
    for (const key of required) {
      if (!form[key].trim()) {
        toast.error('Please fill in all required fields')
        return false
      }
    }
    return true
  }

  const placeOrder = async (paymentMethod: 'razorpay' | 'cod') => {
    if (!validate()) return
    setPlacing(true)

    const shippingAddress = {
      full_name: form.full_name, phone: form.phone, line1: form.address,
      line2: form.landmark, city: form.city, state: form.state, pincode: form.pincode, country: 'India',
    }

    const payload = {
      items: [{ productId: product.id, variantId: variant?.id ?? null, quantity }],
      shippingAddress,
      guestName: form.full_name,
      guestEmail: form.email,
      guestPhone: form.phone,
      couponCode: null,
      paymentMethod,
    }

    const { data, error } = await supabase.functions.invoke('checkout-create-order', { body: payload })

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

    if (paymentMethod === 'cod') {
      toast.success('Order placed successfully!')
      onClose()
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
          toast.success('Payment successful!')
          onClose()
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 px-4 py-8 sm:items-center">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blush-100 px-5 py-4">
          <h2 className="font-serif text-lg text-ink-900">Please Enter Your Full Delivery Address</h2>
          <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-full p-1 hover:bg-blush-50">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-blush-50 p-3">
            <div className="relative shrink-0">
              <img src={image} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-semibold text-white">
                {quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-ink-900">{product.name}</p>
              {variant?.variant_name && <p className="text-xs text-ink-300">{variant.variant_name}</p>}
              <div className="mt-2 inline-flex items-center rounded-full border border-blush-200 bg-white">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1 || placing}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-blush-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center text-sm font-semibold text-ink-900" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= maxQty || placing}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-blush-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Plus size={14} />
                </button>
              </div>
              {quantity >= maxQty && product.track_inventory !== false && (
                <p className="mt-1 text-[11px] text-gold-500">Only {maxQty} available</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-ink-900">{formatINR(price * quantity)}</p>
              {quantity > 1 && <p className="text-[11px] text-ink-300">{formatINR(price)} each</p>}
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-500">
              <span>Subtotal</span>
              <span className="font-medium text-ink-900">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Shipping</span>
              <span className="font-medium text-ink-900">{shipping === 0 ? 'Free' : formatINR(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-blush-100 pt-1.5 text-base font-semibold text-ink-900">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          <form className="mt-5 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <Input label="Full Name *" placeholder="First and Last name" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
            <Input label="Mobile Number *" placeholder="Mobile Number" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="Complete Full Address *" placeholder="House No. / Building Name / Street / Area" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <Input label="Landmark (Famous Spot Nearby)" placeholder="Nearby School, Hospital, Shop ..." value={form.landmark} onChange={(e) => set('landmark', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="State *" value={form.state} onChange={(e) => set('state', e.target.value)}>
                <option value="">State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Input label="City *" placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <Input label="Pincode *" placeholder="Enter 6 Digit Pincode" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <Input label="Email *" type="email" placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />

            <div className="space-y-2 pt-2">
              <Button type="button" size="lg" className="w-full" loading={placing} onClick={() => placeOrder('razorpay')}>
                Pay now — {formatINR(total)}
              </Button>
              {codAvailable && (
                <Button type="button" variant="secondary" size="lg" className="w-full" loading={placing} onClick={() => placeOrder('cod')}>
                  Cash On Delivery — {formatINR(total)}
                </Button>
              )}
            </div>
          </form>
        </div>

        {placing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/70">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  )
}
