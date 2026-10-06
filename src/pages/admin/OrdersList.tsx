import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileDown, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { downloadPackingSlip } from '@/lib/packingSlip'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { formatINR, formatDate, isUnpaidOnlineOrder } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DateRangeFilter, defaultRange, inRange, resolveRange, type DateRangeValue } from '@/components/admin/DateRangeFilter'
import type { Order, OrderStatus } from '@/types'

const STATUSES: OrderStatus[] = ['new', 'paid', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded']
const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New', paid: 'Paid', processing: 'Processing', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
}

const UNPAID = 'unpaid'

function toCSV(orders: Order[]): string {
  const header = ['Order Number', 'Date', 'Status', 'Payment Status', 'Customer', 'Phone', 'Total']
  const rows = orders.map((o) => [
    o.order_number, formatDate(o.placed_at), o.status, o.payment_status, o.guest_name ?? '', o.guest_phone ?? '', o.total_amount,
  ])
  return [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultRange('all'))
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
  const { settings } = useStoreSettings()

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setOrders((data as Order[]) ?? [])
      setLoading(false)
    })
  }, [])

  const range = resolveRange(dateRange)
  const filtered = orders.filter((o) => {
    if (!inRange(o.placed_at, range)) return false
    const matchesSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.guest_phone?.includes(search) || o.guest_email?.toLowerCase().includes(search.toLowerCase())
    // Failed/abandoned online payments are hidden unless the "Failed / Unpaid" filter is chosen.
    const matchesStatus = statusFilter === UNPAID ? isUnpaidOnlineOrder(o) : !isUnpaidOnlineOrder(o) && (!statusFilter || o.status === statusFilter)
    return matchesSearch && matchesStatus
  })

  const handlePackingSlip = async (o: Order) => {
    const { data } = await supabase.from('orders').select('*, items:order_items(*)').eq('id', o.id).single()
    if (!data) {
      toast.error('Could not load the order')
      return
    }
    try {
      await downloadPackingSlip(data as unknown as Order, settings.store_info.support_email)
    } catch (err) {
      console.error(err)
      toast.error('Could not create the packing slip')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('orders').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Could not delete order')
    else {
      toast.success('Order deleted')
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const handleExport = () => {
    const csv = toCSV(filtered)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Orders" description={`${filtered.length} orders${dateRange.preset === 'all' ? '' : ` · ${range.label}`}`} action={<Button variant="outline" onClick={handleExport}><Download size={15} /> Export CSV</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Input placeholder="Search order #, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          <option value={UNPAID}>Failed / Unpaid (online)</option>
        </Select>
      </div>
      <Table>
        <thead><tr><Th>Order</Th><Th>Date</Th><Th>Customer</Th><Th>Payment</Th><Th>Status</Th><Th>Total</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.id}>
              <Td><Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-700">{o.order_number}</Link></Td>
              <Td>{formatDate(o.placed_at)}</Td>
              <Td>{o.guest_name}<br /><span className="text-xs text-ink-300">{o.guest_phone}</span></Td>
              <Td><Badge tone={o.payment_status === 'paid' ? 'success' : o.payment_status === 'failed' ? 'danger' : o.payment_status === 'partially_paid' ? 'gold' : 'neutral'}>{o.payment_status.replace('_', ' ')}</Badge></Td>
              <Td><Badge tone={['cancelled', 'returned', 'refunded'].includes(o.status) ? 'danger' : 'brand'}>{STATUS_LABELS[o.status]}</Badge></Td>
              <Td>{formatINR(o.total_amount)}</Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton title="Download packing slip" onClick={() => handlePackingSlip(o)}><FileDown size={15} /></IconButton>
                  <IconButton title="Delete" onClick={() => setDeleteTarget(o)}><Trash2 size={15} /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ConfirmModal open={!!deleteTarget} title="Delete Order" description={`Permanently delete order ${deleteTarget?.order_number}? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
