import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, PackageSearch } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSeo } from '@/hooks/useSeo'
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

/** "1001", "hsc1001", "# HSC-1001" -> "HSC1001". Empty stays empty. */
function normalizeOrderNumber(raw: string) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^[0-9]+$/.test(cleaned) ? `HSC${cleaned}` : cleaned
}

// The server returns { items } for the full view and a trimmed copy for single-field lookups.
type TrackedOrder = Order & { items?: Order['items'] }

function OrderCard({ order }: { order: TrackedOrder }) {
  const currentStepIndex = STATUS_STEPS.indexOf(order.status)
  const isTerminalNegative = ['cancelled', 'returned', 'refunded'].includes(order.status)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-luxe-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-serif text-lg">{order.order_number}</p>
          <p className="text-xs text-ink-300">Placed on {formatDate(order.placed_at)}</p>
        </div>
        <Badge tone={isTerminalNegative ? 'danger' : 'brand'}>{STATUS_LABELS[order.status] ?? order.status}</Badge>
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
  )
}

export default function TrackOrder() {
  useSeo({ title: 'Track Your Order', noindex: true })
  const [params] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(params.get('order') ?? '')
  const [contact, setContact] = useState(params.get('email') ?? '')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null)
  const [selected, setSelected] = useState<TrackedOrder | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const number = normalizeOrderNumber(orderNumber)
    const who = contact.trim()
    if (!number && !who) {
      toast.error('Enter your Order ID or your email')
      return
    }
    setLoading(true)
    setOrders(null)
    setSelected(null)
    const { data, error } = await supabase.functions.invoke('track-order', { body: { orderNumber: number, contact: who } })
    setLoading(false)
    if (error || data?.error) {
      // supabase-js hides the JSON body of non-2xx replies inside error.context
      let message: string | undefined = data?.error
      if (!message && error && 'context' in error && error.context instanceof Response) {
        message = await error.context.json().then((b: { error?: string }) => b?.error).catch(() => undefined)
      }
      toast.error(message ?? 'Order not found. Check your details and try again.')
      return
    }
    const found: TrackedOrder[] = data.orders ?? (data.order ? [data.order] : [])
    setOrders(found)
    if (found.length === 1) setSelected(found[0])
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blush-50 text-brand-600">
        <PackageSearch size={26} />
      </div>
      <h1 className="mb-2 text-center font-serif text-3xl">Track Your Order</h1>
      <p className="mb-8 text-center text-sm text-ink-500">Enter your Order ID <strong>or</strong> the email you used at checkout. No account needed.</p>

      <form onSubmit={handleSearch} className="space-y-4 rounded-2xl bg-white p-6 shadow-luxe-sm">
        <Input
          label="Order ID"
          placeholder="e.g. HSC1001"
          autoCapitalize="characters"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-300">
          <span className="h-px flex-1 bg-blush-100" /> or <span className="h-px flex-1 bg-blush-100" />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <p className="text-xs text-ink-300">Fill in either one. Using both shows the full order details.</p>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Track Order</Button>
      </form>

      {orders && orders.length > 1 && !selected && (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-ink-500">We found {orders.length} orders for this email:</p>
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left shadow-luxe-sm hover:ring-1 hover:ring-brand-300"
            >
              <span>
                <span className="block font-medium">{o.order_number}</span>
                <span className="text-xs text-ink-300">{formatDate(o.placed_at)} · {formatINR(o.total_amount)}</span>
              </span>
              <Badge tone={['cancelled', 'returned', 'refunded'].includes(o.status) ? 'danger' : 'brand'}>{STATUS_LABELS[o.status] ?? o.status}</Badge>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-8">
          {orders && orders.length > 1 && (
            <button onClick={() => setSelected(null)} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              <ArrowLeft size={14} /> All orders
            </button>
          )}
          <OrderCard order={selected} />
        </div>
      )}
    </div>
  )
}
