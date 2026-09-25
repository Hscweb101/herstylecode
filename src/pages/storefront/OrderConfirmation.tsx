import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'
import { formatINR, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner, EmptyState } from '@/components/ui/Misc'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as unknown as Order)
        setLoading(false)
      })
  }, [orderId])

  if (loading) return <FullPageSpinner />
  if (!order) return <EmptyState title="Order not found" />

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
      <h1 className="mt-4 font-serif text-3xl">Thank You for Your Order!</h1>
      <p className="mt-2 text-ink-500">
        Your order <strong>{order.order_number}</strong> has been placed successfully.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 text-left shadow-luxe-sm">
        <div className="mb-4 flex justify-between text-sm text-ink-500">
          <span>Order Date</span>
          <span>{formatDate(order.placed_at)}</span>
        </div>
        <div className="space-y-3 border-t border-blush-100 pt-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <img src={item.image_url ?? undefined} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-ink-900">{item.product_name}</p>
                <p className="text-xs text-ink-300">Qty {item.quantity}</p>
              </div>
              <span className="font-medium">{formatINR(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-blush-100 pt-4 text-base font-semibold">
          <span>Total Paid</span>
          <span>{formatINR(order.total_amount)}</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link to="/track-order"><Button variant="outline">Track Order</Button></Link>
        <Link to="/shop"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  )
}
