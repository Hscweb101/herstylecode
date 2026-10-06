import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, ExternalLink, PackageSearch } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSeo } from '@/hooks/useSeo'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Misc'
import type { Order } from '@/types'

// Seven internal statuses are shown to shoppers as five easy steps.
const STEPS = ['Order placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']
const STEP_OF: Record<string, number> = { new: 0, paid: 0, processing: 1, packed: 1, shipped: 2, out_for_delivery: 3, delivered: 4 }
const STATUS_LABELS: Record<string, string> = {
  new: 'Order Placed', paid: 'Payment Confirmed', processing: 'Processing', packed: 'Packed',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

/** "1001", "hsc1001", "# HSC-1001" -> "HSC1001". Empty stays empty. */
function normalizeOrderNumber(raw: string) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^[0-9]+$/.test(cleaned) ? `HSC${cleaned}` : cleaned
}

type TrackedOrder = Order & { history?: { status: string; created_at: string }[] }

function OrderCard({ order }: { order: TrackedOrder }) {
  const ended = ['cancelled', 'returned', 'refunded'].includes(order.status)
  const idx = STEP_OF[order.status] ?? 0
  const history = order.history ?? []
  const when = (step: number) => history.find((h) => STEP_OF[h.status] === step)?.created_at

  return (
    <div className="overflow-hidden rounded-2xl border border-blush-100 bg-white shadow-luxe-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 bg-blush-50 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">Order ID</p>
          <p className="font-mono text-xl font-bold text-ink-900">{order.order_number}</p>
          <p className="text-xs text-ink-500">Placed on {formatDate(order.placed_at)}</p>
        </div>
        <Badge tone={ended ? 'danger' : order.status === 'delivered' ? 'success' : 'brand'}>{STATUS_LABELS[order.status] ?? order.status}</Badge>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {ended ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            This order was {(STATUS_LABELS[order.status] ?? order.status).toLowerCase()}. For help, please contact us with your Order ID.
          </p>
        ) : (
          <ol className="grid grid-cols-5">
            {STEPS.map((label, i) => {
              const done = i <= idx
              const date = when(i)
              return (
                <li key={label} className="flex flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : i <= idx ? 'bg-brand-500' : 'bg-blush-200')} />
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        done ? 'bg-brand-600 text-white' : 'bg-blush-100 text-ink-300',
                        i === idx && 'ring-4 ring-brand-100',
                      )}
                    >
                      {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={cn('h-0.5 flex-1', i === STEPS.length - 1 ? 'bg-transparent' : i < idx ? 'bg-brand-500' : 'bg-blush-200')} />
                  </div>
                  <span className={cn('mt-2 px-0.5 text-[11px] font-medium leading-tight', done ? 'text-ink-900' : 'text-ink-300')}>{label}</span>
                  {date && done && <span className="mt-0.5 text-[10px] text-ink-500">{fmtDay(date)}</span>}
                </li>
              )
            })}
          </ol>
        )}

        {order.tracking_number && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-brand-300 bg-blush-50 px-4 py-3 text-sm">
            <span className="text-ink-700">
              {order.shipping_provider ? `${order.shipping_provider} · ` : ''}Tracking no. <strong className="font-mono">{order.tracking_number}</strong>
            </span>
            {order.tracking_url && (
              <a href={order.tracking_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline">
                Track with courier <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}

        <div className="mt-5 divide-y divide-blush-100 border-t border-blush-100">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3 text-sm">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-blush-100 object-cover" />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-lg bg-blush-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium text-ink-900">{item.product_name}</p>
                <p className="text-xs text-ink-500">Qty {item.quantity}</p>
              </div>
              <span className="shrink-0 font-semibold text-ink-900">{formatINR(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-blush-100 pt-4 text-base font-semibold text-ink-900">
          <span>Order total</span>
          <span>{formatINR(order.total_amount)}</span>
        </div>
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

  const runSearch = async (rawNumber: string, rawContact: string) => {
    const number = normalizeOrderNumber(rawNumber)
    const who = rawContact.trim()
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    void runSearch(orderNumber, contact)
  }

  // Scanning the QR code on a packing slip opens /track-order?order=HSC1001 -- show that order straight away.
  const autoRan = useRef(false)
  useEffect(() => {
    const fromLink = params.get('order')
    if (autoRan.current || !fromLink) return
    autoRan.current = true
    void runSearch(fromLink, params.get('email') ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blush-50 text-brand-600 ring-8 ring-blush-50/60">
          <PackageSearch size={26} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Where is my order?</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Track Your Order</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-500">
          Enter your <strong className="text-ink-900">Order ID</strong> or the <strong className="text-ink-900">email</strong> you used at checkout. Either one works, or use both.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mt-8 space-y-4 rounded-2xl border border-blush-100 bg-white p-5 shadow-luxe-sm sm:p-6">
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
        <Button type="submit" size="lg" className="w-full" loading={loading}>Track Order</Button>
      </form>

      {orders && orders.length > 1 && !selected && (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-ink-500">We found {orders.length} orders for this email:</p>
          {orders.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-blush-100 bg-white p-4 text-left shadow-luxe-sm hover:border-brand-300"
            >
              <span>
                <span className="block font-mono font-semibold">{o.order_number}</span>
                <span className="text-xs text-ink-500">{formatDate(o.placed_at)} · {formatINR(o.total_amount)}</span>
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
