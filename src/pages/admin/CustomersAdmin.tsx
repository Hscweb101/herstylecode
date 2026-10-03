import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Eye, Mail, Phone, X, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { formatDate, formatINR } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal } from '@/components/admin/AdminUI'
import { Input } from '@/components/ui/Input'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import type { Address, Order } from '@/types'

interface CustomerRow {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed: boolean
  is_registered: boolean
  order_count: number
  total_spent: number
  last_order_at: string | null
}

function CustomerDetail({ customer, onClose, onDelete }: { customer: CustomerRow; onClose: () => void; onDelete: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [addresses, setAddresses] = useState<Address[] | null>(null)

  useEffect(() => {
    supabase.from('orders').select('*').eq('customer_id', customer.id).order('placed_at', { ascending: false }).then(({ data }) => setOrders((data as Order[]) ?? []))
    supabase.from('addresses').select('*').eq('customer_id', customer.id).then(({ data }) => setAddresses((data as Address[]) ?? []))
  }, [customer.id])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-900">{customer.full_name ?? 'Unnamed customer'}</h2>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone={customer.is_registered ? 'brand' : 'neutral'}>{customer.is_registered ? 'Registered' : 'Guest checkout'}</Badge>
              {customer.is_registered && <Badge tone={customer.email_confirmed ? 'success' : 'gold'}>{customer.email_confirmed ? 'Email verified' : 'Email not verified'}</Badge>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="space-y-5 p-5 text-sm">
          <div className="space-y-2">
            <p className="flex items-center gap-2 break-all text-gray-800"><Mail size={15} className="shrink-0 text-gray-400" /> {customer.email ?? '—'}</p>
            <p className="flex items-center gap-2 text-gray-800"><Phone size={15} className="shrink-0 text-gray-400" /> {customer.phone ?? '—'}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Orders', value: customer.order_count },
              { label: 'Total spent', value: formatINR(customer.total_spent) },
              { label: 'Avg. order', value: customer.order_count ? formatINR(customer.total_spent / customer.order_count) : '—' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-gray-200 p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">{s.label}</p>
                <p className="mt-0.5 font-semibold tabular-nums text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          <dl className="grid grid-cols-2 gap-y-1.5 text-gray-600">
            <dt>Joined</dt><dd className="text-right text-gray-900">{formatDate(customer.created_at)}</dd>
            <dt>Last sign-in</dt><dd className="text-right text-gray-900">{customer.last_sign_in_at ? formatDate(customer.last_sign_in_at) : '—'}</dd>
            <dt>Last order</dt><dd className="text-right text-gray-900">{customer.last_order_at ? formatDate(customer.last_order_at) : '—'}</dd>
          </dl>

          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Saved addresses</h3>
            {addresses === null ? (
              <p className="text-gray-400">Loading…</p>
            ) : addresses.length === 0 ? (
              <p className="text-gray-400">No saved addresses.</p>
            ) : (
              <ul className="space-y-2">
                {addresses.map((a) => (
                  <li key={a.id} className="flex gap-2 rounded-lg border border-gray-200 p-3">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
                    <span className="text-gray-700">
                      <span className="font-medium text-gray-900">{a.full_name}</span> · {a.phone}<br />
                      {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Orders</h3>
            {orders === null ? (
              <p className="text-gray-400">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-gray-400">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">{o.order_number}</Link>
                    <span className="text-xs text-gray-500">{formatDate(o.placed_at)}</span>
                    <span className="text-xs capitalize text-gray-600">{o.status.replace(/_/g, ' ')}</span>
                    <span className="font-medium tabular-nums text-gray-900">{formatINR(o.total_amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={onDelete} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 size={15} /> Delete customer
          </button>
        </div>
      </aside>
    </div>
  )
}

export default function CustomersAdmin() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null)
  const [selected, setSelected] = useState<CustomerRow | null>(null)

  useEffect(() => {
    supabase.rpc('admin_list_customers').then(({ data, error }) => {
      if (error) toast.error(`Could not load customers: ${error.message}`)
      // Hide throwaway anonymous browsing sessions: no name, phone, email or orders.
      const rows = ((data as CustomerRow[]) ?? []).filter((c) => c.full_name || c.phone || c.email || c.order_count > 0)
      setCustomers(rows)
      setLoading(false)
    })
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.rpc('admin_delete_customer', { target: deleteTarget.id })
    if (error) toast.error(`Could not delete customer: ${error.message}`)
    else {
      toast.success('Customer deleted')
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setSelected(null)
    }
    setDeleteTarget(null)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.full_name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q))
  }, [customers, search])

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Customers" description={`${customers.length} customers`} />
      <Input placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <Table>
        <thead>
          <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Orders</Th><Th>Total spent</Th><Th>Joined</Th><Th>Actions</Th></tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
              <Td className="font-medium">
                {c.full_name ?? '—'}
                {!c.is_registered && <span className="ml-2 text-[10px] font-normal uppercase text-gray-400">guest</span>}
              </Td>
              <Td className="max-w-[220px] truncate">{c.email ?? '—'}</Td>
              <Td>{c.phone ?? '—'}</Td>
              <Td>{c.order_count}</Td>
              <Td className="tabular-nums">{formatINR(c.total_spent)}</Td>
              <Td>{formatDate(c.created_at)}</Td>
              <Td>
                <div className="flex" onClick={(e) => e.stopPropagation()}>
                  <IconButton title="View details" onClick={() => setSelected(c)}><Eye size={15} /></IconButton>
                  <IconButton title="Delete" onClick={() => setDeleteTarget(c)}><Trash2 size={15} /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><Td className="text-gray-400">No customers found</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td><Td>{''}</Td></tr>
          )}
        </tbody>
      </Table>

      {selected && <CustomerDetail customer={selected} onClose={() => setSelected(null)} onDelete={() => setDeleteTarget(selected)} />}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Customer"
        description={`Delete ${deleteTarget?.full_name ?? deleteTarget?.email ?? 'this customer'}? Their account, addresses, cart and wishlist are removed; past orders are kept.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
