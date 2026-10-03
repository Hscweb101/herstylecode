import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Misc'
import type { Order, OrderStatus } from '@/types'

const STATUS_STEPS: OrderStatus[] = ['new', 'paid', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']
const STATUS_LABELS: Record<string, string> = {
  new: 'Order Placed', paid: 'Payment Confirmed', processing: 'Processing', packed: 'Packed',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
}

/** "1001", "hsc1001", "# HSC-1001" -> "HSC1001" */
function normalizeOrderNumber(raw: string) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^d+$/.test(cleaned) ? `HSC${cleaned}` : cleaned
}

export default function TrackOrder() {
  useSeo({ title: 'Track Your Order', noindex: true })
  const [params] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(params.get('order') ?? '')
  const [contact, setContact] = useState(params.get('email') ?? '')
  const [loading, setLoading] = useState(false)

  // Signed-in customers get their account email pre-filled.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (u && !u.is_anonymous && u.email) setContact((c) => c || u.email!)
    })
  }, [])
  const [order, setOrder] = useState<Order | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOrder(null)
    const { data, error } = await supabase.functions.invoke('track-order', {
      body: { orderNumber: normalizeOrderNumber(orderNumber), contact: contact.trim() },
    })
    setLoading(false)
    if (error || data?.error) {
      // supabase-js hides the JSON body of non-2xx replies inside error.context
      let message: string | undefined = data?.error
      if (!message && error && 'context' in error && error.context instanceof Response) {
        message = await error.context.json().then((b: { error?: string }) => b?.error).catch(() => undefined)
      }
      toast.error(message ?? 'Order not found. Check your Order ID and email.')
      return
    }
    setOrder(data.order)
  }

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1
  const isTerminalNegative = order && ['cancelled', 'returned', 'refunded'].includes(order.status)

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blush-50 text-brand-600">
        <PackageSearch size={26} />
      </div>
      <h1 className="mb-2 text-center font-serif text-3xl">Track Your Order</h1>
      <p className="mb-8 text-center text-sm text-ink-500">Enter your Order ID and the email address you used at checkout. No account needed.</p>

      <form onSubmit={handleSearch} className="space-y-4 rounded-2xl bg-white p-6 shadow-luxe-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Order ID"
            placeholder="e.g. HSC1001"
            required
            autoCapitalize="characters"
            hint="Find it in your confirmation / receipt"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            hint="The email used while placing the order"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Track Order</Button>
      </form>

      {order && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-luxe-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-serif text-lg">{order.order_number}</p>
              <p className="text-xs text-ink-300">Placed on {formatDate(order.placed_at)}</p>
            </div>
            <Badge tone={isTerminalNegative ? 'danger' : 'brand'}>{STATUS_LABELS[order.status]}</Badge>
          </div>

          {!isTerminalNegative && (
            <div className="mb-6 flex items-center overflow-x-auto py-2">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step} className="flex min-w-[90px] flex-1 flex-col items-center text-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${idx <= currentStepIndex ? 'bg-brand-600' : 'bg-blush-200'}`} />
                  <p className={`mt-2 text-[10px] ${idx <= currentStepIndex ? 'text-ink-900' : 'text-ink-300'}`}>{STATUS_LABELS[step]}</p>
                  {idx < STATUS_STEPS.length - 1 && <div className={`h-0.5 w-full ${idx < currentStepIndex ? 'bg-brand-600' : 'bg-blush-200'}`} />}
                </div>
              ))}
            </div>
          )}

          {order.tracking_number && (
            <p className="mb-4 text-sm text-ink-700">
              Tracking Number: <strong>{order.tracking_number}</strong>
              {order.tracking_url && (
                <a href={order.tracking_url} target="_blank" rel="noreferrer" className="ml-2 text-brand-600 underline">
                  Track with courier
                </a>
              )}
            </p>
          )}

          <div className="space-y-3 border-t border-blush-100 pt-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <img src={item.image_url ?? undefined} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p>{item.product_name}</p>
                  <p className="text-xs text-ink-300">Qty {item.quantity}</p>
                </div>
                <span className="font-medium">{formatINR(item.line_total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
