import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate } from '@/lib/utils'
import { PageHeader, StatCard, Card, Table, Th, Td } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import type { Order } from '@/types'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, productCount: 0, customerCount: 0, lowStock: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    async function load() {
      const [orders, products, customerProfiles, lowStock, recent] = await Promise.all([
        supabase.from('orders').select('customer_id, total_amount, payment_status'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name, phone').eq('role', 'customer'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock_quantity', 5).eq('track_inventory', true),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(6),
      ])
      const paidOrders = (orders.data ?? []).filter((o) => o.payment_status === 'paid')
      const orderedCustomerIds = new Set((orders.data ?? []).map((o) => o.customer_id).filter(Boolean))
      // "Customers" excludes throwaway anonymous browsing sessions that never registered or ordered.
      const realCustomerCount = (customerProfiles.data ?? []).filter(
        (p) => p.full_name || p.phone || orderedCustomerIds.has(p.id),
      ).length
      setStats({
        totalSales: paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
        orderCount: orders.data?.length ?? 0,
        productCount: products.count ?? 0,
        customerCount: realCustomerCount,
        lowStock: lowStock.count ?? 0,
      })
      setRecentOrders((recent.data as Order[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your store performance" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total Sales" value={formatINR(stats.totalSales)} />
        <StatCard label="Orders" value={stats.orderCount} />
        <StatCard label="Products" value={stats.productCount} />
        <StatCard label="Customers" value={stats.customerCount} />
        <StatCard label="Low Stock" value={stats.lowStock} sub={stats.lowStock > 0 ? 'Needs attention' : undefined} />
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg">Recent Orders</h3>
          <Link to="/admin/orders" className="text-sm text-brand-600 hover:underline">View All</Link>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Total</Th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <Td><Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-700">{o.order_number}</Link></Td>
                <Td>{formatDate(o.placed_at)}</Td>
                <Td><Badge tone="neutral">{o.status}</Badge></Td>
                <Td>{formatINR(o.total_amount)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
