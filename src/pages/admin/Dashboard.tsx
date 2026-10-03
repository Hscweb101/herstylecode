import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts'
import { IndianRupee, ShoppingBag, Users, Package, AlertTriangle, CalendarDays, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR, formatDate, isUnpaidOnlineOrder, cn } from '@/lib/utils'
import { PageHeader, StatCard, Card, Table, Th, Td } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import type { Order } from '@/types'

const HISTORY_DAYS = 90
const RANGES = [7, 14, 30, 90] as const

const STATUS_LABELS: Record<string, string> = {
  new: 'Placed', paid: 'Paid', processing: 'Processing', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
}
const STATUS_COLORS: Record<string, string> = {
  new: '#d97706', paid: '#2563eb', processing: '#7c3aed', packed: '#0891b2', shipped: '#0d9488',
  out_for_delivery: '#65a30d', delivered: '#16a34a', cancelled: '#6b7280', returned: '#ea580c', refunded: '#dc2626',
}
const BRAND = '#e34c86'
const TOOLTIP_STYLE = { borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }

type OrderRow = Pick<Order, 'id' | 'customer_id' | 'total_amount' | 'status' | 'payment_status' | 'payment_method' | 'placed_at'>
type ProductRow = { id: string; name: string; stock_quantity: number; low_stock_threshold: number }

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const daysAgo = (n: number) => {
  const d = startOfDay(new Date())
  d.setDate(d.getDate() - n)
  return d
}
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const shortDay = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const compact = (v: number) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)
const isLost = (s: string) => ['cancelled', 'returned', 'refunded'].includes(s)

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [topItems, setTopItems] = useState<{ order_id: string; product_name: string; quantity: number; line_total: number }[]>([])
  const [lowStock, setLowStock] = useState<ProductRow[]>([])
  const [totals, setTotals] = useState({ allTimeSales: 0, orderCount: 0, productCount: 0, customerCount: 0 })
  const [range, setRange] = useState<(typeof RANGES)[number]>(30)

  useEffect(() => {
    async function load() {
      const since = daysAgo(HISTORY_DAYS).toISOString()
      const [allOrders, products, customerProfiles, stock, recent] = await Promise.all([
        supabase.from('orders').select('id, customer_id, total_amount, status, payment_status, payment_method, placed_at'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name, phone').eq('role', 'customer'),
        supabase.from('products').select('id, name, stock_quantity, low_stock_threshold').eq('track_inventory', true).eq('is_active', true),
        supabase.from('orders').select('*').or('payment_method.eq.cod,payment_status.in.(paid,refunded,partially_refunded)').order('created_at', { ascending: false }).limit(6),
      ])
      const all = ((allOrders.data as OrderRow[]) ?? []).filter((o) => !isUnpaidOnlineOrder(o))
      const orderedCustomerIds = new Set(all.map((o) => o.customer_id).filter(Boolean))
      // "Customers" excludes throwaway anonymous browsing sessions that never registered or ordered.
      const realCustomers = (customerProfiles.data ?? []).filter((p) => p.full_name || p.phone || orderedCustomerIds.has(p.id)).length

      setTotals({
        allTimeSales: all.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0),
        orderCount: all.length,
        productCount: products.count ?? 0,
        customerCount: realCustomers,
      })
      const windowed = all.filter((o) => new Date(o.placed_at) >= new Date(since))
      setOrders(windowed)
      setLowStock(((stock.data as ProductRow[]) ?? []).filter((p) => p.stock_quantity <= p.low_stock_threshold).sort((a, b) => a.stock_quantity - b.stock_quantity))
      setRecentOrders((recent.data as Order[]) ?? [])

      if (windowed.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('order_id, product_name, quantity, line_total')
          .in('order_id', windowed.map((o) => o.id))
        setTopItems((items as typeof topItems) ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const view = useMemo(() => {
    const live = orders.filter((o) => !isLost(o.status))
    const sum = (list: OrderRow[]) => list.reduce((s, o) => s + Number(o.total_amount), 0)
    const todayStart = startOfDay(new Date())
    const weekStart = daysAgo(7)

    const inRange = orders.filter((o) => new Date(o.placed_at) >= daysAgo(range - 1))
    const liveInRange = inRange.filter((o) => !isLost(o.status))
    const buckets = new Map<string, { label: string; revenue: number; orders: number }>()
    for (let i = range - 1; i >= 0; i--) {
      const d = daysAgo(i)
      buckets.set(dayKey(d), { label: shortDay(d), revenue: 0, orders: 0 })
    }
    for (const o of liveInRange) {
      const b = buckets.get(dayKey(new Date(o.placed_at)))
      if (b) {
        b.revenue += Number(o.total_amount)
        b.orders += 1
      }
    }

    const statusCounts = new Map<string, number>()
    for (const o of inRange) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1)

    const rangeIds = new Set(liveInRange.map((o) => o.id))
    const byProduct = new Map<string, { revenue: number; qty: number }>()
    for (const it of topItems) {
      if (!rangeIds.has(it.order_id)) continue
      const cur = byProduct.get(it.product_name) ?? { revenue: 0, qty: 0 }
      cur.revenue += Number(it.line_total)
      cur.qty += it.quantity
      byProduct.set(it.product_name, cur)
    }

    const rangeRevenue = sum(liveInRange)
    return {
      todayOrders: live.filter((o) => new Date(o.placed_at) >= todayStart).length,
      weekRevenue: sum(live.filter((o) => new Date(o.placed_at) >= weekStart)),
      rangeRevenue,
      rangeOrders: liveInRange.length,
      avgOrder: liveInRange.length ? rangeRevenue / liveInRange.length : 0,
      trend: Array.from(buckets.values()),
      statusBreakdown: Array.from(statusCounts.entries())
        .map(([status, count]) => ({ status, name: STATUS_LABELS[status] ?? status, count }))
        .sort((a, b) => b.count - a.count),
      topProducts: Array.from(byProduct.entries())
        .map(([name, v]) => ({ name: name.length > 22 ? `${name.slice(0, 21)}…` : name, fullName: name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
    }
  }, [orders, topItems, range])

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your store performance" />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Sales (paid)" value={formatINR(totals.allTimeSales)} icon={IndianRupee} tone="brand" />
        <StatCard label="Orders" value={totals.orderCount} icon={ShoppingBag} tone="blue" />
        <StatCard label="Customers" value={totals.customerCount} icon={Users} tone="green" />
        <StatCard label="Products" value={totals.productCount} icon={Package} tone="amber" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:mt-4 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Today's Orders" value={view.todayOrders} icon={CalendarDays} tone="blue" />
        <StatCard label="Revenue (7 days)" value={formatINR(view.weekRevenue)} icon={TrendingUp} tone="green" />
        <StatCard label={`Revenue (${range} days)`} value={formatINR(view.rangeRevenue)} sub={`${view.rangeOrders} orders · avg ${formatINR(view.avgOrder)}`} icon={IndianRupee} tone="brand" />
        <StatCard label="Low Stock Alerts" value={lowStock.length} icon={AlertTriangle} tone={lowStock.length ? 'red' : 'green'} sub={lowStock.length ? 'Needs attention' : 'All stocked'} subTone={lowStock.length ? 'warn' : 'good'} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-medium text-gray-900">Revenue</h2>
              <p className="text-xs text-gray-400">Excludes cancelled, returned and unpaid online orders</p>
            </div>
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn('rounded-md px-2.5 py-1 text-xs font-medium', range === r ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-800')}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={view.trend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={44} tickFormatter={compact} />
                <Tooltip formatter={(v) => formatINR(Number(v))} labelStyle={{ fontWeight: 600 }} contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BRAND} strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-medium text-gray-900">Orders by status</h2>
          <p className="text-xs text-gray-400">Last {range} days</p>
          {view.statusBreakdown.length > 0 ? (
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={view.statusBreakdown} dataKey="count" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                    {view.statusBreakdown.map((e) => (
                      <Cell key={e.status} fill={STATUS_COLORS[e.status] ?? '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend verticalAlign="bottom" height={48} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-400">No orders in this window.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-medium text-gray-900">Orders per day</h2>
          <p className="text-xs text-gray-400">Last {range} days</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.trend} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="orders" name="Orders" fill="#f193b5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-medium text-gray-900">Top products by revenue</h2>
          <p className="text-xs text-gray-400">Last {range} days</p>
          {view.topProducts.length > 0 ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.topProducts} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={compact} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} labelFormatter={(_l, p) => p?.[0]?.payload?.fullName ?? ''} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="revenue" name="Revenue" fill={BRAND} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-400">No sales in this window.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
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
                  <Td><Badge tone={isLost(o.status) ? 'danger' : 'neutral'}>{STATUS_LABELS[o.status] ?? o.status}</Badge></Td>
                  <Td className="tabular-nums">{formatINR(o.total_amount)}</Td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><Td className="text-gray-400">No orders yet</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td></tr>
              )}
            </tbody>
          </Table>
        </Card>

        <Card>
          <h2 className="font-medium text-gray-900">Products running low</h2>
          {lowStock.length > 0 ? (
            <ul className="mt-2 divide-y divide-gray-100">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link to={`/admin/products/${p.id}`} className="min-w-0 truncate text-gray-800 hover:text-brand-600">{p.name}</Link>
                  <span className={cn('shrink-0 font-medium', p.stock_quantity === 0 ? 'text-red-600' : 'text-amber-600')}>
                    {p.stock_quantity === 0 ? 'Out of stock' : `${p.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-400">Everything is well stocked.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
