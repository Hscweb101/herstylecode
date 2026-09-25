import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Card } from '@/components/admin/AdminUI'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import type { NavigationItem } from '@/types'

const EMPTY = { id: '', label: '', url: '', sort_order: 0, is_active: true }

export default function NavigationAdmin() {
  const [items, setItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NavigationItem | null>(null)

  const load = () => {
    supabase
      .from('navigation_items')
      .select('*')
      .is('parent_id', null)
      .like('url', '/shop?%')
      .order('sort_order')
      .then(({ data }) => {
        setItems((data as NavigationItem[]) ?? [])
        setLoading(false)
      })
  }
  useEffect(load, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload = {
      label: editing.label,
      url: editing.url,
      sort_order: Number(editing.sort_order),
      is_active: editing.is_active,
    }
    const { error } = editing.id
      ? await supabase.from('navigation_items').update(payload).eq('id', editing.id)
      : await supabase.from('navigation_items').insert(payload)
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
    const { error } = await supabase.from('navigation_items').delete().eq('id', deleteTarget.id)
    if (error) toast.error(error.message)
    else toast.success('Deleted')
    setDeleteTarget(null)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader
        title="Bottom Nav Links"
        description="Quick filter links shown after your categories in the bar under the header (e.g. “Under ₹399”). URL must start with /shop? — e.g. /shop?maxPrice=399, or /shop?minPrice=500&maxPrice=1000 for a range."
        action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> Add Link</Button>}
      />
      <Table>
        <thead><tr><Th>Label</Th><Th>URL</Th><Th>Order</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <Td className="font-medium">{item.label}</Td>
              <Td className="text-ink-500">{item.url}</Td>
              <Td>{item.sort_order}</Td>
              <Td><Badge tone={item.is_active ? 'success' : 'neutral'}>{item.is_active ? 'Active' : 'Hidden'}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton onClick={() => setEditing({ ...item })}><Pencil size={15} /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(item)}><Trash2 size={15} /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
          <Card className="w-full max-w-md">
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="font-serif text-lg">{editing.id ? 'Edit' : 'Add'} Link</h3>
              <Input label="Label" required placeholder="Under ₹399" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              <Input label="URL" required placeholder="/shop?maxPrice=399" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
              <Input label="Sort Order" type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} title="Delete Link" description={`Delete "${deleteTarget?.label}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
