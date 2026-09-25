import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate } from '@/lib/utils'
import { PageHeader, Table, Th, Td } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Order, OrderStatus } from '@/types'

const STATUSES: OrderStatus[] = ['new', 'paid', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded']
const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New', paid: 'Paid', processing: 'Processing', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
}

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

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setOrders((data as Order[]) ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = orders.filter((o) => {
    const matchesSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.guest_phone?.includes(search) || o.guest_email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
      <PageHeader title="Orders" description={`${orders.length} total orders`} action={<Button variant="outline" onClick={handleExport}><Download size={15} /> Export CSV</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search order #, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </Select>
      </div>
      <Table>
        <thead><tr><Th>Order</Th><Th>Date</Th><Th>Customer</Th><Th>Payment</Th><Th>Status</Th><Th>Total</Th></tr></thead>
        <tbody>
          {filtered.map((o) => (
            <tr key={o.id}>
              <Td><Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-700">{o.order_number}</Link></Td>
              <Td>{formatDate(o.placed_at)}</Td>
              <Td>{o.guest_name}<br /><span className="text-xs text-ink-300">{o.guest_phone}</span></Td>
              <Td><Badge tone={o.payment_status === 'paid' ? 'success' : o.payment_status === 'failed' ? 'danger' : 'neutral'}>{o.payment_status}</Badge></Td>
              <Td><Badge tone={['cancelled', 'returned', 'refunded'].includes(o.status) ? 'danger' : 'brand'}>{STATUS_LABELS[o.status]}</Badge></Td>
              <Td>{formatINR(o.total_amount)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
