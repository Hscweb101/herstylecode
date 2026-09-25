import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Card } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import type { Coupon } from '@/types'

const EMPTY = {
  id: '', code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '10',
  min_order_value: '0', max_discount_amount: '', usage_limit: '', usage_limit_per_customer: '1',
  first_order_only: false, free_shipping: false, starts_at: '', ends_at: '', is_active: true,
}

export default function CouponsAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)

  const load = () => {
    supabase.from('coupons').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCoupons((data as Coupon[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload = {
      code: editing.code.toUpperCase(), description: editing.description || null, discount_type: editing.discount_type,
      discount_value: Number(editing.discount_value), min_order_value: Number(editing.min_order_value || 0),
      max_discount_amount: editing.max_discount_amount ? Number(editing.max_discount_amount) : null,
      usage_limit: editing.usage_limit ? Number(editing.usage_limit) : null,
      usage_limit_per_customer: Number(editing.usage_limit_per_customer || 1),
      first_order_only: editing.first_order_only, free_shipping: editing.free_shipping,
      starts_at: editing.starts_at || new Date().toISOString(), ends_at: editing.ends_at || null, is_active: editing.is_active,
    }
    const { error } = editing.id
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert(payload)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Saved')
    setEditing(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('coupons').delete().eq('id', deleteTarget.id)
    toast.success('Deleted')
    setDeleteTarget(null)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Coupons" action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> Add Coupon</Button>} />
      <Table>
        <thead><tr><Th>Code</Th><Th>Discount</Th><Th>Usage</Th><Th>Expires</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <Td className="font-mono font-medium">{c.code}</Td>
              <Td>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</Td>
              <Td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</Td>
              <Td>{c.ends_at ? formatDate(c.ends_at) : 'No expiry'}</Td>
              <Td><Badge tone={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton onClick={() => setEditing({
                    ...c, description: c.description ?? '', discount_value: String(c.discount_value), min_order_value: String(c.min_order_value),
                    max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : '', usage_limit: c.usage_limit ? String(c.usage_limit) : '',
                    usage_limit_per_customer: String(c.usage_limit_per_customer), starts_at: c.starts_at, ends_at: c.ends_at ?? '',
                  })}><Pencil size={15} /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(c)}><Trash2 size={15} /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/40 px-4 py-8">
          <Card className="w-full max-w-lg">
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="font-serif text-lg">{editing.id ? 'Edit' : 'Add'} Coupon</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Code" required value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
                <Select label="Discount Type" value={editing.discount_type} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as 'percentage' | 'fixed' })}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </Select>
                <Input label="Discount Value" type="number" required value={editing.discount_value} onChange={(e) => setEditing({ ...editing, discount_value: e.target.value })} />
                <Input label="Max Discount (₹)" type="number" value={editing.max_discount_amount} onChange={(e) => setEditing({ ...editing, max_discount_amount: e.target.value })} />
                <Input label="Min Order Value (₹)" type="number" value={editing.min_order_value} onChange={(e) => setEditing({ ...editing, min_order_value: e.target.value })} />
                <Input label="Usage Limit (total)" type="number" value={editing.usage_limit} onChange={(e) => setEditing({ ...editing, usage_limit: e.target.value })} />
                <Input label="Usage Limit / Customer" type="number" value={editing.usage_limit_per_customer} onChange={(e) => setEditing({ ...editing, usage_limit_per_customer: e.target.value })} />
                <Input label="End Date" type="date" value={editing.ends_at?.slice(0, 10) ?? ''} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.first_order_only} onChange={(e) => setEditing({ ...editing, first_order_only: e.target.checked })} /> First order only</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.free_shipping} onChange={(e) => setEditing({ ...editing, free_shipping: e.target.checked })} /> Free shipping</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      <ConfirmModal open={!!deleteTarget} title="Delete Coupon" description={`Delete "${deleteTarget?.code}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
