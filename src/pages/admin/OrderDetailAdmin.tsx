import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Check, ChevronDown, FileDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { downloadPackingSlip } from '@/lib/packingSlip'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { formatINR, formatDate, cn } from '@/lib/utils'
import { PageHeader, Card } from '@/components/admin/AdminUI'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import type { Order, OrderStatus, ShippingAddressJson } from '@/types'

const FORWARD_STATUSES: OrderStatus[] = ['new', 'paid', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']
const EDGE_STATUSES: OrderStatus[] = ['cancelled', 'returned', 'refunded']
const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New', paid: 'Paid', processing: 'Processing', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
}

function StatusStepper({ status, onChange }: { status: OrderStatus; onChange: (s: OrderStatus) => void }) {
  const [showMore, setShowMore] = useState(EDGE_STATUSES.includes(status))
  const currentIdx = FORWARD_STATUSES.indexOf(status)

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FORWARD_STATUSES.map((s, idx) => {
          const isDone = currentIdx >= 0 && idx < currentIdx
          const isCurrent = s === status
          return (
            <button
              type="button"
              key={s}
              onClick={() => onChange(s)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm',
                isCurrent && 'border-brand-600 bg-brand-600 text-white',
                !isCurrent && isDone && 'border-brand-200 bg-blush-50 text-brand-700',
                !isCurrent && !isDone && 'border-blush-200 text-ink-500 hover:border-brand-300',
              )}
            >
              {isDone && <Check size={13} />}
              {STATUS_LABELS[s]}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-brand-600"
      >
        <ChevronDown size={14} className={cn('transition-transform', showMore && 'rotate-180')} />
        Problem with this order? (Cancel / Return / Refund)
      </button>
      {showMore && (
        <div className="mt-2 flex flex-wrap gap-2">
          {EDGE_STATUSES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => onChange(s)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-xs font-medium sm:text-sm',
                s === status ? 'border-red-500 bg-red-500 text-white' : 'border-red-200 text-red-600 hover:bg-red-50',
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrderDetailAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<{ status: string; note: string | null; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<OrderStatus>('new')
  const [tracking, setTracking] = useState({ number: '', provider: '', url: '' })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [slipLoading, setSlipLoading] = useState(false)
  const { settings } = useStoreSettings()

  const load = async () => {
    const [{ data: o }, { data: h }] = await Promise.all([
      supabase.from('orders').select('*, items:order_items(*)').eq('id', id).single(),
      supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    ])
    if (o) {
      setOrder(o as unknown as Order)
      setStatus(o.status)
      setTracking({ number: o.tracking_number ?? '', provider: o.shipping_provider ?? '', url: o.tracking_url ?? '' })
      setNotes(o.internal_notes ?? '')
    }
    setHistory(h ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const handleSave = async () => {
    if (!order) return
    setSaving(true)
    const statusChanged = status !== order.status
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        tracking_number: tracking.number || null,
        shipping_provider: tracking.provider || null,
        tracking_url: tracking.url || null,
        internal_notes: notes || null,
      })
      .eq('id', order.id)

    if (statusChanged) {
      await supabase.from('order_status_history').insert({ order_id: order.id, status, note: `Status updated to ${status}` })
    }

    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items ?? []) {
        await supabase.rpc('restore_stock', {
          p_product_id: item.product_id, p_variant_id: item.variant_id, p_qty: item.quantity,
          p_reference_type: 'order_cancelled', p_reference_id: order.id,
        })
      }
    }

    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Order updated')
    load()
  }

  const handlePackingSlip = async () => {
    if (!order) return
    setSlipLoading(true)
    try {
      await downloadPackingSlip(order, settings.store_info.support_email)
    } catch (err) {
      console.error(err)
      toast.error('Could not create the packing slip')
    }
    setSlipLoading(false)
  }

  if (loading) return <FullPageSpinner />
  if (!order) return null

  const shippingAddr = order.shipping_address as ShippingAddressJson

  return (
    <div>
      <PageHeader
        title={`Order ${order.order_number}`}
        description={formatDate(order.placed_at)}
        action={
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePackingSlip} loading={slipLoading}><FileDown size={15} /> Packing Slip</Button>
            <Button variant="ghost" onClick={() => navigate('/admin/orders')}>Back</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 font-serif text-lg">Items</h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-blush-50 pb-3 text-sm">
                  <img src={item.image_url ?? undefined} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p>{item.product_name} {item.variant_name && `(${item.variant_name})`}</p>
                    <p className="text-xs text-ink-300">SKU: {item.sku} · Qty {item.quantity}</p>
                  </div>
                  <span className="font-medium">{formatINR(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-ink-500"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount {order.coupon_code && `(${order.coupon_code})`}</span><span>-{formatINR(order.discount_amount)}</span></div>}
              <div className="flex justify-between text-ink-500"><span>Shipping</span><span>{order.shipping_amount === 0 ? 'Free' : formatINR(order.shipping_amount)}</span></div>
              {order.tax_amount > 0 && <div className="flex justify-between text-ink-500"><span>Tax</span><span>{formatINR(order.tax_amount)}</span></div>}
              <div className="flex justify-between border-t border-blush-100 pt-1 text-base font-semibold"><span>Total</span><span>{formatINR(order.total_amount)}</span></div>
            </div>
          </Card>

          <Card className="print:hidden">
            <h3 className="mb-4 font-serif text-lg">Order Status</h3>
            <StatusStepper status={status} onChange={setStatus} />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input label="Shipping Provider" value={tracking.provider} onChange={(e) => setTracking({ ...tracking, provider: e.target.value })} placeholder="Shiprocket, Delhivery..." />
              <Input label="Tracking Number" value={tracking.number} onChange={(e) => setTracking({ ...tracking, number: e.target.value })} />
              <Input label="Tracking URL" value={tracking.url} onChange={(e) => setTracking({ ...tracking, url: e.target.value })} />
              <Textarea label="Internal Notes" className="sm:col-span-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button className="mt-4" onClick={handleSave} loading={saving}>Save Changes</Button>
          </Card>

          <Card className="print:hidden">
            <h3 className="mb-4 font-serif text-lg">Status History</h3>
            <div className="space-y-2 text-sm">
              {history.map((h, idx) => (
                <div key={idx} className="flex justify-between border-b border-blush-50 pb-2">
                  <span>{h.status} {h.note && `— ${h.note}`}</span>
                  <span className="text-ink-300">{formatDate(h.created_at)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-3 font-serif text-lg">Customer</h3>
            <p className="text-sm">{order.guest_name}</p>
            <p className="text-sm text-ink-500">{order.guest_email}</p>
            <p className="text-sm text-ink-500">{order.guest_phone}</p>
          </Card>
          <Card>
            <h3 className="mb-3 font-serif text-lg">Shipping Address</h3>
            <p className="text-sm text-ink-700">
              {shippingAddr?.full_name}<br />
              {shippingAddr?.line1}{shippingAddr?.line2 ? `, ${shippingAddr.line2}` : ''}<br />
              {shippingAddr?.city}, {shippingAddr?.state} - {shippingAddr?.pincode}<br />
              {shippingAddr?.country}<br />
              {shippingAddr?.phone}
            </p>
          </Card>
          <Card>
            <h3 className="mb-3 font-serif text-lg">Payment</h3>
            <p className="text-sm">Method: <Badge tone="neutral">{order.payment_method.toUpperCase()}</Badge></p>
            <p className="mt-2 text-sm">Status: <Badge tone={order.payment_status === 'paid' ? 'success' : order.payment_status === 'partially_paid' ? 'gold' : 'danger'}>{order.payment_status.replace('_', ' ')}</Badge></p>
            {order.payment_method === 'cod' && (
              <div className="mt-3 space-y-1 rounded-lg bg-blush-50 p-3 text-sm">
                {Number(order.advance_amount) > 0 ? (
                  <>
                    <div className="flex justify-between"><span className="text-ink-500">Advance {order.advance_paid ? 'paid online' : '(not paid yet)'}</span><span className="font-medium">{formatINR(order.advance_amount)}</span></div>
                    <div className="flex justify-between font-semibold"><span>Collect on delivery</span><span>{formatINR(order.total_amount - order.advance_amount)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between font-semibold"><span>Collect on delivery</span><span>{formatINR(order.total_amount)}</span></div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
