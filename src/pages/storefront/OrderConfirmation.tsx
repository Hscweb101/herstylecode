import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Copy, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSeo } from '@/hooks/useSeo'
import { supabase } from '@/lib/supabase'
import { downloadReceipt } from '@/lib/receipt'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import type { Order } from '@/types'
import { formatINR, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner, EmptyState } from '@/components/ui/Misc'

export default function OrderConfirmation() {
  useSeo({ title: 'Order Confirmation', noindex: true })
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useStoreSettings()

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

      <div className="mt-6 rounded-2xl border border-brand-200 bg-blush-50 p-5 text-left">
        <p className="text-sm font-semibold text-ink-900">Please note your Order Number</p>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
          <span className="font-mono text-lg font-semibold tracking-wide text-brand-700">{order.order_number}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(order.order_number).then(() => toast.success('Order number copied'))}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          You will need this order number to track your order on the Track Order page. Please also download your receipt and keep it for your records.
        </p>
        <Button
          className="mt-3 w-full"
          onClick={() => { if (!downloadReceipt(order, settings.store_info.support_email)) toast.error('Please allow pop-ups to download the receipt') }}
        >
          <Download size={15} /> Download Receipt
        </Button>
      </div>

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
        {order.payment_method === 'cod' && order.advance_paid && Number(order.advance_amount) > 0 ? (
          <div className="mt-4 space-y-1 border-t border-blush-100 pt-4 text-sm">
            <div className="flex justify-between text-ink-500"><span>Order total</span><span>{formatINR(order.total_amount)}</span></div>
            <div className="flex justify-between text-emerald-700"><span>Advance paid online</span><span>-{formatINR(order.advance_amount)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Pay on delivery</span><span>{formatINR(order.total_amount - order.advance_amount)}</span></div>
          </div>
        ) : (
          <div className="mt-4 flex justify-between border-t border-blush-100 pt-4 text-base font-semibold">
            <span>{order.payment_method === 'cod' ? 'Total (Pay on Delivery)' : 'Total Paid'}</span>
            <span>{formatINR(order.total_amount)}</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link to="/track-order"><Button variant="outline">Track Order</Button></Link>
        <Link to="/shop"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  )
}
