import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Card } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import type { Moment, Product, Category } from '@/types'

const EMPTY = {
  id: '', label: '', description: '', image_url: '', link_type: 'url' as Moment['link_type'],
  product_id: '', category_id: '', custom_url: '', sort_order: '0', is_active: true,
}

export default function MomentsAdmin() {
  const [moments, setMoments] = useState<Moment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Moment | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = () => {
    Promise.all([
      supabase.from('moments').select('*, product:products(slug, name), category:categories(slug, name)').order('sort_order'),
      supabase.from('products').select('id, name, slug').eq('is_active', true).order('name'),
      supabase.from('categories').select('id, name, slug').order('name'),
    ]).then(([m, p, c]) => {
      setMoments((m.data as unknown as Moment[]) ?? [])
      setProducts((p.data as unknown as Product[]) ?? [])
      setCategories((c.data as unknown as Category[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleUpload = async (file: File) => {
    if (!editing) return
    setUploading(true)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('moments').upload(path, file)
    setUploading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    const { data } = supabase.storage.from('moments').getPublicUrl(path)
    setEditing((prev) => (prev ? { ...prev, image_url: data.publicUrl } : prev))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload = {
      label: editing.label, description: editing.description || null, image_url: editing.image_url || null,
      link_type: editing.link_type,
      product_id: editing.link_type === 'product' ? editing.product_id || null : null,
      category_id: editing.link_type === 'category' ? editing.category_id || null : null,
      custom_url: editing.link_type === 'url' ? editing.custom_url || null : null,
      sort_order: Number(editing.sort_order), is_active: editing.is_active,
    }
    const { error } = editing.id
      ? await supabase.from('moments').update(payload).eq('id', editing.id)
      : await supabase.from('moments').insert(payload)
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
    await supabase.from('moments').delete().eq('id', deleteTarget.id)
    toast.success('Deleted')
    setDeleteTarget(null)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader
        title="Every Moment Tiles"
        description="The 'Designed For Your Every Moment' section on the homepage. Each tile links to a product, category, or custom URL."
        action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> Add Tile</Button>}
      />
      <Table>
        <thead><tr><Th>Preview</Th><Th>Label</Th><Th>Links To</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {moments.map((m) => (
            <tr key={m.id}>
              <Td>{m.image_url && <img src={m.image_url} alt="" className="h-14 w-11 rounded-lg object-cover" />}</Td>
              <Td className="font-medium">{m.label}</Td>
              <Td className="text-xs text-ink-500">
                {m.link_type === 'product' && (m.product?.slug ? `Product: ${m.product.slug}` : '—')}
                {m.link_type === 'category' && (m.category?.slug ? `Category: ${m.category.slug}` : '—')}
                {m.link_type === 'url' && (m.custom_url || '—')}
              </Td>
              <Td><Badge tone={m.is_active ? 'success' : 'neutral'}>{m.is_active ? 'Active' : 'Hidden'}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton onClick={() => setEditing({
                    id: m.id, label: m.label, description: m.description ?? '', image_url: m.image_url ?? '',
                    link_type: m.link_type, product_id: m.product_id ?? '', category_id: m.category_id ?? '',
                    custom_url: m.custom_url ?? '', sort_order: String(m.sort_order), is_active: m.is_active,
                  })}><Pencil size={15} /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(m)}><Trash2 size={15} /></IconButton>
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
              <h3 className="font-serif text-lg">{editing.id ? 'Edit' : 'Add'} Tile</h3>
              <Input label="Label" required autoFocus value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Work Mode" />
              <Textarea label="Short Description (optional)" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Sleek. Subtle. So You." />

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Image</label>
                {editing.image_url && <img src={editing.image_url} alt="" className="mb-2 h-32 w-24 rounded-xl object-cover" />}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploading ? 'Uploading...' : editing.image_url ? 'Replace image' : 'Upload image'}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                </label>
              </div>

              <Select label="Tapping this tile opens" value={editing.link_type} onChange={(e) => setEditing({ ...editing, link_type: e.target.value as Moment['link_type'] })}>
                <option value="url">A custom URL</option>
                <option value="product">A product</option>
                <option value="category">A category</option>
              </Select>

              {editing.link_type === 'product' && (
                <Select label="Product" value={editing.product_id} onChange={(e) => setEditing({ ...editing, product_id: e.target.value })}>
                  <option value="">— Select a product —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              )}
              {editing.link_type === 'category' && (
                <Select label="Category" value={editing.category_id} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}>
                  <option value="">— Select a category —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
              {editing.link_type === 'url' && (
                <Input label="URL" value={editing.custom_url} onChange={(e) => setEditing({ ...editing, custom_url: e.target.value })} placeholder="/collections/sale" />
              )}

              <Input label="Sort Order" type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      <ConfirmModal open={!!deleteTarget} title="Delete Tile" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
