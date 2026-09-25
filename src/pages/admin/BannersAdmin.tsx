import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Card } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Input, FieldLabel } from '@/components/ui/Input'
import type { Banner } from '@/types'

const EMPTY = {
  id: '', placement: 'hero' as Banner['placement'], title: '', subtitle: '', image_url: '', mobile_image_url: '', link_url: '', cta_text: '', sort_order: '0', is_active: true,
}

export default function BannersAdmin() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [uploadingField, setUploadingField] = useState<'image_url' | 'mobile_image_url' | null>(null)

  const load = () => {
    supabase.from('banners').select('*').order('sort_order').then(({ data }) => {
      setBanners((data as Banner[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleUpload = async (file: File, field: 'image_url' | 'mobile_image_url') => {
    if (!editing) return
    setUploadingField(field)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('banners').upload(path, file)
    setUploadingField(null)
    if (error) {
      toast.error(error.message)
      return
    }
    const { data } = supabase.storage.from('banners').getPublicUrl(path)
    setEditing((prev) => (prev ? { ...prev, [field]: data.publicUrl } : prev))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const payload = {
      placement: editing.placement, title: editing.title || null, subtitle: editing.subtitle || null,
      image_url: editing.image_url || null, mobile_image_url: editing.mobile_image_url || null,
      link_url: editing.link_url || null, cta_text: editing.cta_text || null,
      sort_order: Number(editing.sort_order), is_active: editing.is_active,
    }
    const { error } = editing.id
      ? await supabase.from('banners').update(payload).eq('id', editing.id)
      : await supabase.from('banners').insert(payload)
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
    await supabase.from('banners').delete().eq('id', deleteTarget.id)
    toast.success('Deleted')
    setDeleteTarget(null)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Homepage Banners" action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> Add Banner</Button>} />
      <Table>
        <thead><tr><Th>Preview</Th><Th>Title</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {banners.map((b) => (
            <tr key={b.id}>
              <Td>{b.image_url && <img src={b.image_url} alt="" className="h-12 w-20 rounded-lg object-cover" />}</Td>
              <Td>{b.title}</Td>
              <Td><Badge tone={b.is_active ? 'success' : 'neutral'}>{b.is_active ? 'Active' : 'Hidden'}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton onClick={() => setEditing({
                    ...b, title: b.title ?? '', subtitle: b.subtitle ?? '', image_url: b.image_url ?? '',
                    mobile_image_url: b.mobile_image_url ?? '',
                    link_url: b.link_url ?? '', cta_text: b.cta_text ?? '', sort_order: String(b.sort_order),
                  })}><Pencil size={15} /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(b)}><Trash2 size={15} /></IconButton>
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
              <h3 className="font-serif text-lg">{editing.id ? 'Edit' : 'Add'} Banner</h3>
              <Input label="Title" autoFocus value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <Input label="Subtitle" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
              <Input label="Link URL" value={editing.link_url} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/collections/sale" />
              <Input label="CTA Button Text" value={editing.cta_text} onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })} />
              <div>
                <FieldLabel>Desktop Banner Image</FieldLabel>
                {editing.image_url && <img src={editing.image_url} alt="" className="mb-2 h-32 w-full rounded-xl object-cover" />}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploadingField === 'image_url' ? 'Uploading...' : 'Upload desktop image'}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'image_url')} />
                </label>
              </div>
              <div>
                <FieldLabel>Mobile Banner Image (optional)</FieldLabel>
                <p className="mb-2 -mt-1 text-xs text-ink-300">Shown on phones instead of the desktop image. Use a tall/portrait crop for the best fit. Falls back to the desktop image if not set.</p>
                {editing.mobile_image_url && <img src={editing.mobile_image_url} alt="" className="mb-2 h-40 w-32 rounded-xl object-cover" />}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploadingField === 'mobile_image_url' ? 'Uploading...' : 'Upload mobile image'}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'mobile_image_url')} />
                </label>
              </div>
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
      <ConfirmModal open={!!deleteTarget} title="Delete Banner" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
