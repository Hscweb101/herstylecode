import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Play } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Card } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Reel } from '@/types'

const EMPTY = { id: '', video_url: '', poster_url: '', caption: '', link_url: '', sort_order: '0', is_active: true }

export default function ReelsAdmin() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null)
  const [uploadingField, setUploadingField] = useState<'video_url' | 'poster_url' | null>(null)

  const load = () => {
    supabase.from('reels').select('*').order('sort_order').then(({ data }) => {
      setReels((data as Reel[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleUpload = async (file: File, field: 'video_url' | 'poster_url') => {
    if (!editing) return
    setUploadingField(field)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('reels').upload(path, file)
    setUploadingField(null)
    if (error) {
      toast.error(error.message)
      return
    }
    const { data } = supabase.storage.from('reels').getPublicUrl(path)
    setEditing((prev) => (prev ? { ...prev, [field]: data.publicUrl } : prev))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (!editing.video_url) {
      toast.error('Please upload a video')
      return
    }
    const payload = {
      video_url: editing.video_url, poster_url: editing.poster_url || null,
      caption: editing.caption || null, link_url: editing.link_url || null,
      sort_order: Number(editing.sort_order), is_active: editing.is_active,
    }
    const { error } = editing.id
      ? await supabase.from('reels').update(payload).eq('id', editing.id)
      : await supabase.from('reels').insert(payload)
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
    await supabase.from('reels').delete().eq('id', deleteTarget.id)
    toast.success('Deleted')
    setDeleteTarget(null)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader
        title="Reels"
        description="Short vertical videos shown on the homepage, e.g. jewellery being worn. Tap one on the site to jump to its linked page."
        action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> Add Reel</Button>}
      />
      <Table>
        <thead><tr><Th>Preview</Th><Th>Caption</Th><Th>Links To</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {reels.map((r) => (
            <tr key={r.id}>
              <Td>
                {r.poster_url ? (
                  <img src={r.poster_url} alt="" className="h-16 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-blush-100 text-ink-300"><Play size={16} /></div>
                )}
              </Td>
              <Td>{r.caption}</Td>
              <Td className="text-xs text-ink-500">{r.link_url}</Td>
              <Td><Badge tone={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Active' : 'Hidden'}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton onClick={() => setEditing({
                    ...r, poster_url: r.poster_url ?? '', caption: r.caption ?? '',
                    link_url: r.link_url ?? '', sort_order: String(r.sort_order),
                  })}><Pencil size={15} /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(r)}><Trash2 size={15} /></IconButton>
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
              <h3 className="font-serif text-lg">{editing.id ? 'Edit' : 'Add'} Reel</h3>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Video</label>
                {editing.video_url && (
                  <video src={editing.video_url} className="mb-2 h-48 w-32 rounded-xl bg-black object-cover" muted loop autoPlay playsInline />
                )}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploadingField === 'video_url' ? 'Uploading...' : editing.video_url ? 'Replace video' : 'Upload video (mp4, portrait works best)'}
                  <input type="file" accept="video/mp4,video/webm" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'video_url')} />
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Poster / Thumbnail (optional)</label>
                {editing.poster_url && <img src={editing.poster_url} alt="" className="mb-2 h-24 w-16 rounded-xl object-cover" />}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploadingField === 'poster_url' ? 'Uploading...' : 'Upload poster image'}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'poster_url')} />
                </label>
              </div>

              <Input label="Caption" value={editing.caption} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} placeholder="Layered Necklaces" />
              <Input label="Link URL (where tapping the reel goes)" value={editing.link_url} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/category/necklaces" />
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
      <ConfirmModal open={!!deleteTarget} title="Delete Reel" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
