import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal } from '@/components/admin/AdminUI'
import { Input } from '@/components/ui/Input'
import { FullPageSpinner } from '@/components/ui/Misc'

interface CustomerRow {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
  order_count?: number
}

export default function CustomersAdmin() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null)

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      const { data: orders } = await supabase.from('orders').select('customer_id')
      const counts = new Map<string, number>()
      for (const o of orders ?? []) {
        if (o.customer_id) counts.set(o.customer_id, (counts.get(o.customer_id) ?? 0) + 1)
      }
      const withCounts = (profiles ?? [])
        .map((p) => ({ ...p, order_count: counts.get(p.id) ?? 0 }))
        .filter((p) => p.full_name || p.phone || (p.order_count ?? 0) > 0)
      setCustomers(withCounts)
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.rpc('admin_delete_customer', { target: deleteTarget.id })
    if (error) toast.error('Could not delete customer')
    else {
      toast.success('Customer deleted')
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const filtered = customers.filter((c) => !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Customers" description={`${customers.length} registered customers`} />
      <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <Table>
        <thead><tr><Th>Name</Th><Th>Phone</Th><Th>Orders</Th><Th>Joined</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.full_name ?? '—'}</Td>
              <Td>{c.phone ?? '—'}</Td>
              <Td>{c.order_count}</Td>
              <Td>{formatDate(c.created_at)}</Td>
              <Td><IconButton title="Delete" onClick={() => setDeleteTarget(c)}><Trash2 size={15} /></IconButton></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ConfirmModal open={!!deleteTarget} title="Delete Customer" description={`Delete ${deleteTarget?.full_name ?? 'this customer'}? Their account, addresses, cart and wishlist are removed; past orders are kept.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
