import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Card } from '@/components/admin/AdminUI'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import type { Category } from '@/types'

const EMPTY = { id: '', parent_id: '', name: '', slug: '', description: '', image_url: '', video_url: '', sort_order: 0, is_active: true }

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [uploadingField, setUploadingField] = useState<'image_url' | 'video_url' | null>(null)

  const load = () => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleUpload = async (file: File, field: 'image_url' | 'video_url') => {
    if (!editing) return
    setUploadingField(field)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('categories').upload(path, file)
    setUploadingField(null)
    if (error) {
      toast.error(error.message)
      return
    }
    const { data } = supabase.storage.from('categories').getPublicUrl(path)
    setEditing((prev) => (prev ? { ...prev, [field]: data.publicUrl } : prev))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload = {
      parent_id: editing.parent_id || null,
      name: editing.name, slug: editing.slug || slugify(editing.name), description: editing.description || null,
      image_url: editing.image_url || null, video_url: editing.video_url || null,
      sort_order: Number(editing.sort_order), is_active: editing.is_active,
    }
    const { error } = editing.id
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload)
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
    const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Could not delete (may have products attached)')
    else toast.success('Deleted')
    setDeleteTarget(null)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Categories" action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> Add Category</Button>} />
      <Table>
        <thead><tr><Th>Name</Th><Th>Parent</Th><Th>Slug</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.parent_id ? <span className="pl-4 text-ink-500">↳ {c.name}</span> : c.name}</Td>
              <Td>{categories.find((p) => p.id === c.parent_id)?.name ?? '—'}</Td>
              <Td>{c.slug}</Td>
              <Td><Badge tone={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Active' : 'Hidden'}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton onClick={() => setEditing({ ...c, parent_id: c.parent_id ?? '', description: c.description ?? '', image_url: c.image_url ?? '', video_url: c.video_url ?? '' })}><Pencil size={15} /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(c)}><Trash2 size={15} /></IconButton>
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
              <h3 className="font-serif text-lg">{editing.id ? 'Edit' : 'Add'} Category</h3>
              <Select
                label="Parent Category (leave blank for a top-level category)"
                value={editing.parent_id}
                onChange={(e) => setEditing({ ...editing, parent_id: e.target.value })}
              >
                <option value="">— None (top-level) —</option>
                {categories.filter((c) => c.id !== editing.id && !c.parent_id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Input label="Name" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} />
              <Input label="Slug" required value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              <Textarea label="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Image</label>
                {editing.image_url && <img src={editing.image_url} alt="" className="mb-2 h-28 w-full rounded-xl object-cover" />}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploadingField === 'image_url' ? 'Uploading...' : editing.image_url ? 'Replace image' : 'Upload image'}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'image_url')} />
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Video (optional — plays instead of the image)</label>
                {editing.video_url && <video src={editing.video_url} className="mb-2 h-28 w-full rounded-xl bg-black object-cover" muted loop autoPlay playsInline />}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploadingField === 'video_url' ? 'Uploading...' : editing.video_url ? 'Replace video' : 'Upload video (mp4)'}
                  <input type="file" accept="video/mp4,video/webm" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'video_url')} />
                </label>
                {editing.video_url && (
                  <button type="button" className="mt-1 text-xs text-red-600 hover:underline" onClick={() => setEditing({ ...editing, video_url: '' })}>
                    Remove video
                  </button>
                )}
              </div>

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

      <ConfirmModal open={!!deleteTarget} title="Delete Category" description={`Delete "${deleteTarget?.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
