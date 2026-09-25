import { useState } from 'react'
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

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOrder(null)
    const { data, error } = await supabase.functions.invoke('track-order', { body: { orderNumber, contact } })
    setLoading(false)
    if (error || data?.error) {
      toast.error(data?.error ?? 'Order not found')
      return
    }
    setOrder(data.order)
  }

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1
  const isTerminalNegative = order && ['cancelled', 'returned', 'refunded'].includes(order.status)

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="mb-2 text-center font-serif text-3xl">Track Your Order</h1>
      <p className="mb-8 text-center text-sm text-ink-500">Enter your order number and the phone/email used at checkout.</p>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-luxe-sm sm:flex-row">
        <Input placeholder="Order Number (e.g. HSC1001)" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="flex-1" />
        <Input placeholder="Phone or Email" required value={contact} onChange={(e) => setContact(e.target.value)} className="flex-1" />
        <Button type="submit" loading={loading}>Track</Button>
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
