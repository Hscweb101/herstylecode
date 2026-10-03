import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Banknote, CreditCard, Flag, Hash, Home, Mail, MapPin, Minus, Phone, Plus, ShieldCheck, User, X } from 'lucide-react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { cn, formatINR } from '@/lib/utils'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { invokeCreateOrder } from '@/lib/checkoutApi'
import { Spinner } from '@/components/ui/Misc'
import type { Address, Product, ProductVariant } from '@/types'

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
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
type Errors = Partial<Record<keyof FormState, string>>

const EMPTY_FORM: FormState = { full_name: '', phone: '', address: '', landmark: '', state: '', city: '', pincode: '', email: '' }

/** "+91 98765 43210" / "098765 43210" -> "9876543210" */
function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (f.full_name.trim().length < 2) e.full_name = 'Enter your full name'
  if (!/^[6-9]\d{9}$/.test(normalizePhone(f.phone))) e.phone = 'Enter a valid 10-digit mobile number'
  if (f.address.trim().length < 4) e.address = 'Enter your house / building / street'
  if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = 'Enter a 6-digit pincode'
  if (!f.city.trim()) e.city = 'Enter your city'
  if (!f.state.trim()) e.state = 'Select your state'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email for order updates'
  return e
}

/** Maps the postal API's spelling ("Jammu & Kashmir", "NCT of Delhi"...) onto our state list. */
function matchState(raw: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()
  const n = norm(raw)
  const exact = INDIAN_STATES.find((s) => norm(s) === n)
  if (exact) return exact
  if (n.includes('delhi')) return 'Delhi'
  if (n.includes('orissa')) return 'Odisha'
  if (n.includes('uttaranchal')) return 'Uttarakhand'
  if (n.includes('pondicherry')) return 'Puducherry'
  return raw
}

/** Best-effort city + state lookup for a pincode. Returns null if it fails (the shopper can type them). */
async function lookupPincode(pin: string): Promise<{ city?: string; state?: string } | null> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
    const data = await res.json()
    const office = data?.[0]?.PostOffice?.[0]
    if (!office) return null
    return { city: office.District, state: office.State ? matchState(office.State) : undefined }
  } catch {
    return null
  }
}

// 16px on phones stops iOS from zooming into a field when it is focused.
const fieldCls = 'min-w-0 w-full flex-1 bg-white px-2.5 py-2.5 text-base text-ink-900 outline-none placeholder:text-ink-300 sm:text-sm'

function Row({
  label, required, icon, error, hint, children,
}: {
  label: string
  required?: boolean
  icon: React.ReactNode
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-start gap-x-3 sm:grid-cols-[104px_1fr]">
      <span className="pt-2.5 text-[12px] font-semibold leading-tight text-ink-900">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      <div className="min-w-0">
        <div
          className={cn(
            'flex overflow-hidden rounded-lg border transition-colors focus-within:ring-2',
            error ? 'border-red-400 focus-within:ring-red-200' : 'border-blush-200 focus-within:border-brand-400 focus-within:ring-brand-100',
          )}
        >
          <span className={cn('flex w-9 shrink-0 items-center justify-center border-r', error ? 'border-red-300 bg-red-50 text-red-600' : 'border-blush-200 bg-blush-50 text-brand-600')}>
            {icon}
          </span>
          {children}
        </div>
        {error ? <p className="mt-1 text-[11px] leading-tight text-red-600">{error}</p> : hint ? <p className="mt-1 text-[11px] leading-tight text-brand-600">{hint}</p> : null}
      </div>
    </div>
  )
}

function Stat({ label, value, green, bold }: { label: string; value: string; green?: boolean; bold?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={cn(bold ? 'text-base font-bold' : 'text-sm font-semibold', green ? 'text-emerald-600' : 'text-ink-900')}>{value}</p>
    </div>
  )
}

interface QuickCheckoutModalProps {
  product: Product
  variant: ProductVariant | null
  qty: number
  onClose: () => void
}

export function QuickCheckoutModal({ product, variant, qty: initialQty, onClose }: QuickCheckoutModalProps) {
  const navigate = useNavigate()
  const { profile, isAnonymous, userId } = useAuthStore()
  const { settings } = useStoreSettings()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [attempted, setAttempted] = useState(false)
  const [placing, setPlacing] = useState<null | 'razorpay' | 'cod'>(null)
  const [quantity, setQuantity] = useState(Math.max(1, initialQty))
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new')
  const bodyRef = useRef<HTMLDivElement>(null)
  const pinRequest = useRef(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !placing && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, placing])

  // Prefill from the account (name, phone, email) without overwriting what the shopper already typed.
  useEffect(() => {
    setForm((f) => ({ ...f, full_name: f.full_name || profile?.full_name || '', phone: f.phone || profile?.phone || '' }))
  }, [profile])
  useEffect(() => {
    if (isAnonymous) return
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email
      if (email) setForm((f) => ({ ...f, email: f.email || email }))
    })
  }, [isAnonymous])

  // Saved addresses for signed-in customers (one tap instead of retyping).
  useEffect(() => {
    if (isAnonymous || !userId) return
    supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', userId)
      .then(({ data }) => {
        const list = (data as Address[]) ?? []
        setAddresses(list)
        const def = list.find((a) => a.is_default_shipping) ?? list[0]
        if (def) setSelectedAddressId(def.id)
      })
  }, [isAnonymous, userId])

  const saved = addresses.find((a) => a.id === selectedAddressId)
  const usingSaved = !!saved

  const price = variant?.price ?? product.price
  const image = variant?.image_url ?? product.images?.find((i) => i.is_primary)?.url ?? product.images?.[0]?.url
  const stock = variant ? variant.stock_quantity : product.stock_quantity
  const maxQty = product.track_inventory !== false ? Math.max(1, stock) : 20
  const subtotal = price * quantity
  const shipping = subtotal >= settings.shipping.free_shipping_threshold ? 0 : settings.shipping.standard_shipping_fee
  const total = subtotal + shipping
  const codAvailable = settings.shipping.cod_available && product.cod_available !== false

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  // What gets submitted: the chosen saved address, or the typed one.
  const effective: FormState = saved
    ? {
        ...form,
        full_name: saved.full_name, phone: saved.phone, address: saved.line1, landmark: saved.line2 ?? '',
        city: saved.city, state: saved.state, pincode: saved.pincode,
      }
    : form
  const errors = validate(effective)
  const shownErrors: Errors = attempted ? errors : {}

  const onPincode = (raw: string) => {
    const pin = raw.replace(/\D/g, '').slice(0, 6)
    set('pincode', pin)
    if (pin.length !== 6) return
    const id = ++pinRequest.current
    setPincodeLoading(true)
    lookupPincode(pin).then((found) => {
      if (id !== pinRequest.current) return
      setPincodeLoading(false)
      if (found) setForm((f) => ({ ...f, city: found.city ?? f.city, state: found.state ?? f.state }))
    })
  }

  const placeOrder = async (paymentMethod: 'razorpay' | 'cod') => {
    setAttempted(true)
    if (Object.keys(errors).length > 0) {
      toast.error('Please check the highlighted fields')
      // Bring the first problem into view.
      window.setTimeout(() => bodyRef.current?.querySelector('.border-red-400')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50)
      return
    }
    setPlacing(paymentMethod)

    const phone = normalizePhone(effective.phone)
    const shippingAddress = {
      full_name: effective.full_name.trim(), phone, line1: effective.address.trim(),
      line2: effective.landmark.trim(), city: effective.city.trim(), state: effective.state, pincode: effective.pincode.trim(), country: 'India',
    }

    const payload = {
      items: [{ productId: product.id, variantId: variant?.id ?? null, quantity }],
      shippingAddress,
      guestName: effective.full_name.trim(),
      guestEmail: effective.email.trim(),
      guestPhone: phone,
      couponCode: null,
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
      setPlacing(null)
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
        prefill: { name: effective.full_name, email: effective.email, contact: phone },
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
            setPlacing(null)
            toast('Payment cancelled', { icon: 'ℹ️' })
          },
        },
      })
    } catch {
      toast.error('Could not open payment window. Please try again.')
      setPlacing(null)
    }
  }

  const bind = (k: keyof FormState) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(k, e.target.value) })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-[3px] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Delivery address and checkout">
      <div className="absolute inset-0 animate-[fadeIn_.2s_ease-out] bg-black/55" onClick={() => !placing && onClose()} />

      <div className="animate-sheet-up relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[94dvh] sm:max-w-[520px] sm:rounded-2xl">
        {/* Header */}
        <div className="relative shrink-0 border-b border-blush-100 px-10 py-3.5 text-center">
          <h2 className="font-serif text-[15px] font-semibold text-ink-900 sm:text-base">Please Enter Your Full Delivery Address</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={!!placing}
            aria-label="Close checkout"
            className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-blush-50 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain px-0.5 pb-5 pt-3 sm:px-5">
          {/* Item row with quantity control */}
          <div className="flex items-center gap-3 pb-3">
            <div className="relative h-14 w-14 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-lg border border-blush-100 bg-blush-50">
                {image && <img src={image} alt={product.name} className="h-full w-full object-cover" />}
              </div>
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">{product.name}</p>
              {variant?.variant_name && <p className="text-xs text-ink-500">{variant.variant_name}</p>}
              <p className="mt-0.5 text-xs text-ink-500">{formatINR(price)} each</p>
              {quantity >= maxQty && product.track_inventory !== false && <p className="text-[11px] text-gold-500">Only {maxQty} available</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className="flex items-center overflow-hidden rounded-lg border border-brand-300 bg-white">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="flex h-9 w-9 items-center justify-center text-brand-700 transition-colors hover:bg-blush-50 disabled:opacity-30"
                  disabled={quantity <= 1 || !!placing}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus size={15} />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-ink-900" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="flex h-9 w-9 items-center justify-center text-brand-700 transition-colors hover:bg-blush-50 disabled:opacity-30"
                  disabled={quantity >= maxQty || !!placing}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                >
                  <Plus size={15} />
                </button>
              </div>
              <span className="text-sm font-bold text-ink-900">{formatINR(subtotal)}</span>
            </div>
          </div>

          {/* Totals box */}
          <div className="rounded-lg border border-blush-100 bg-blush-50/70 px-3 py-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Subtotal" value={formatINR(subtotal)} />
              <Stat label="Shipping" value={shipping === 0 ? 'Free' : formatINR(shipping)} green={shipping === 0} />
              <Stat label="Total" value={formatINR(total)} bold />
            </div>
            {shipping > 0 && (
              <p className="mt-1.5 border-t border-dashed border-blush-200 pt-1.5 text-center text-[11px] text-ink-500">
                Add {formatINR(settings.shipping.free_shipping_threshold - subtotal)} more for free shipping
              </p>
            )}
          </div>

          {/* Delivery details */}
          <div className="mt-4 space-y-2.5">
            {addresses.length > 0 && (
              <div className="space-y-2 pb-1">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors',
                      selectedAddressId === a.id ? 'border-brand-500 bg-blush-50' : 'border-blush-100 hover:border-blush-200',
                    )}
                  >
                    <input type="radio" name="address" className="mt-1 accent-brand-600" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} />
                    <span className="text-ink-700">
                      <span className="font-semibold text-ink-900">{a.full_name}</span> · {a.phone}
                      <br />
                      <span className="text-ink-500">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                      </span>
                    </span>
                  </label>
                ))}
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                    selectedAddressId === 'new' ? 'border-brand-500 bg-blush-50' : 'border-blush-100 hover:border-blush-200',
                  )}
                >
                  <input type="radio" name="address" className="accent-brand-600" checked={selectedAddressId === 'new'} onChange={() => setSelectedAddressId('new')} />
                  <span className="font-semibold text-ink-900">Deliver to a new address</span>
                </label>
              </div>
            )}

            {!usingSaved && (
              <>
                <Row label="Full Name" required icon={<User size={15} />} error={shownErrors.full_name}>
                  <input autoComplete="name" placeholder="First and Last name" className={fieldCls} {...bind('full_name')} />
                </Row>
                <Row label="Mobile Number" required icon={<Phone size={15} />} error={shownErrors.phone}>
                  <input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" className={fieldCls} {...bind('phone')} />
                </Row>
                <Row label="Complete Address" required icon={<Home size={15} />} error={shownErrors.address}>
                  <input autoComplete="address-line1" placeholder="House No., Building, Street" className={fieldCls} {...bind('address')} />
                </Row>
                <Row label="Landmark" icon={<MapPin size={15} />}>
                  <input autoComplete="address-line2" placeholder="Nearby School, Hospital, Shop ..." className={fieldCls} {...bind('landmark')} />
                </Row>
                <Row label="Pincode" required icon={<Hash size={15} />} error={shownErrors.pincode} hint={pincodeLoading ? 'Finding your city and state...' : 'City and state fill in automatically'}>
                  <input inputMode="numeric" autoComplete="postal-code" placeholder="Enter 6 Digit Pincode" className={fieldCls} value={form.pincode} onChange={(e) => onPincode(e.target.value)} />
                </Row>
                {/* City + State share one row so the form looks shorter */}
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    { key: 'city', label: 'City', icon: <MapPin size={15} /> },
                    { key: 'state', label: 'State', icon: <Flag size={15} /> },
                  ] as const).map((f) => (
                    <div key={f.key} className="min-w-0">
                      <span className="mb-1 block text-[12px] font-semibold text-ink-900">
                        {f.label}<span className="text-red-500">*</span>
                      </span>
                      <div
                        className={cn(
                          'flex overflow-hidden rounded-lg border transition-colors focus-within:ring-2',
                          shownErrors[f.key] ? 'border-red-400 focus-within:ring-red-200' : 'border-blush-200 focus-within:border-brand-400 focus-within:ring-brand-100',
                        )}
                      >
                        <span className={cn('flex w-9 shrink-0 items-center justify-center border-r', shownErrors[f.key] ? 'border-red-300 bg-red-50 text-red-600' : 'border-blush-200 bg-blush-50 text-brand-600')}>
                          {f.icon}
                        </span>
                        {f.key === 'city' ? (
                          <input autoComplete="address-level2" placeholder="City / District" className={fieldCls} {...bind('city')} />
                        ) : (
                          <select autoComplete="address-level1" className={cn(fieldCls, !form.state && 'text-ink-300')} {...bind('state')}>
                            <option value="">Select State</option>
                            {(!form.state || INDIAN_STATES.includes(form.state) ? INDIAN_STATES : [form.state, ...INDIAN_STATES]).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      {shownErrors[f.key] && <p className="mt-1 text-[11px] leading-tight text-red-600">{shownErrors[f.key]}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
            <Row label="Email" required icon={<Mail size={15} />} error={shownErrors.email}>
              <input type="email" autoComplete="email" placeholder="For order updates & tracking" className={fieldCls} {...bind('email')} />
            </Row>
          </div>

          {/* Pay buttons */}
          <div className="mt-5 space-y-2.5">
            <div className={cn('grid gap-2.5', codAvailable ? 'grid-cols-2' : 'grid-cols-1')}>
              <button
                type="button"
                onClick={() => placeOrder('razorpay')}
                disabled={!!placing}
                className="btn-nudge flex min-h-12 flex-col items-center justify-center rounded-lg bg-brand-600 px-2 py-2 text-white shadow-[0_3px_0_0_#ab275e] transition hover:bg-brand-700 active:translate-y-[2px] active:shadow-[0_1px_0_0_#ab275e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-1.5 text-[14px] font-bold leading-tight sm:text-[15px]">
                  {placing === 'razorpay' ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <CreditCard size={16} />}
                  {placing === 'razorpay' ? 'Opening...' : 'Pay Now'}
                </span>
              </button>
              {codAvailable && (
                <button
                  type="button"
                  onClick={() => placeOrder('cod')}
                  disabled={!!placing}
                  className="flex min-h-12 flex-col items-center justify-center rounded-lg bg-ink-900 px-2 py-2 text-white shadow-[0_3px_0_0_#000] transition hover:bg-ink-700 active:translate-y-[2px] active:shadow-[0_1px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-1.5 text-[14px] font-bold leading-tight sm:text-[15px]">
                    {placing === 'cod' ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Banknote size={16} />}
                    {placing === 'cod' ? 'Placing...' : 'Cash on Delivery'}
                  </span>
                </button>
              )}
            </div>

            <div className="pt-1">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
                {['upi', 'googlepay', 'phonepe', 'paytm', 'visa', 'mastercard', 'rupay'].map((f) => (
                  <img key={f} src={`/payments/${f}.svg`} alt={f} className="h-5 w-auto opacity-90" loading="lazy" />
                ))}
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-700">
                <ShieldCheck size={14} /> 100% secure payments by Razorpay
              </p>
              <p className="mt-2 text-center text-[11px] leading-snug text-ink-500">
                By placing this order you agree to our{' '}
                <Link to="/page/terms-conditions" target="_blank" className="underline underline-offset-2">Terms</Link>,{' '}
                <Link to="/page/privacy-policy" target="_blank" className="underline underline-offset-2">Privacy</Link> &amp;{' '}
                <Link to="/page/returns-refund-policy" target="_blank" className="underline underline-offset-2">Refund Policy</Link>.
              </p>
            </div>
          </div>
        </div>

        {placing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  )
}
