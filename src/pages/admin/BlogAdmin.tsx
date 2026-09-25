import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Card } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import type { BlogPost } from '@/types'

const EMPTY = {
  id: '', title: '', slug: '', excerpt: '', content: '', cover_image_url: '', author_name: 'HerStyleCode',
  tags: '', is_published: false, seo_title: '', seo_description: '',
}

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = () => {
    supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setPosts((data as BlogPost[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleUpload = async (file: File) => {
    if (!editing) return
    setUploading(true)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('blog').upload(path, file)
    setUploading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    const { data } = supabase.storage.from('blog').getPublicUrl(path)
    setEditing((prev) => (prev ? { ...prev, cover_image_url: data.publicUrl } : prev))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const wasPublished = editing.id ? posts.find((p) => p.id === editing.id)?.is_published : false
    const payload = {
      title: editing.title,
      slug: editing.slug || slugify(editing.title),
      excerpt: editing.excerpt || null,
      content: editing.content,
      cover_image_url: editing.cover_image_url || null,
      author_name: editing.author_name || 'HerStyleCode',
      tags: editing.tags.split(',').map((t) => t.trim()).filter(Boolean),
      is_published: editing.is_published,
      published_at: editing.is_published && !wasPublished ? new Date().toISOString() : undefined,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
    }
    const { error } = editing.id
      ? await supabase.from('blog_posts').update(payload).eq('id', editing.id)
      : await supabase.from('blog_posts').insert({ ...payload, published_at: editing.is_published ? new Date().toISOString() : null })
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
    await supabase.from('blog_posts').delete().eq('id', deleteTarget.id)
    toast.success('Deleted')
    setDeleteTarget(null)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Blog" description="SEO articles shown on /blog and linked from the homepage footer." action={<Button onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> New Post</Button>} />
      <Table>
        <thead><tr><Th>Cover</Th><Th>Title</Th><Th>Status</Th><Th>Views</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <Td>{p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-12 w-16 rounded-lg object-cover" />}</Td>
              <Td className="font-medium">{p.title}</Td>
              <Td><Badge tone={p.is_published ? 'success' : 'neutral'}>{p.is_published ? 'Published' : 'Draft'}</Badge></Td>
              <Td>{p.view_count}</Td>
              <Td>
                <div className="flex gap-1">
                  {p.is_published && (
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                      <IconButton title="View live"><ExternalLink size={15} /></IconButton>
                    </a>
                  )}
                  <IconButton onClick={() => setEditing({
                    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? '', content: p.content,
                    cover_image_url: p.cover_image_url ?? '', author_name: p.author_name, tags: p.tags.join(', '),
                    is_published: p.is_published, seo_title: p.seo_title ?? '', seo_description: p.seo_description ?? '',
                  })}><Pencil size={15} /></IconButton>
                  <IconButton onClick={() => setDeleteTarget(p)}><Trash2 size={15} /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/40 px-4 py-8">
          <Card className="w-full max-w-2xl">
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="font-serif text-lg">{editing.id ? 'Edit' : 'New'} Post</h3>
              <Input
                label="Title" required autoFocus value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
              />
              <Input label="Slug" required value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              <Textarea label="Excerpt (shown in previews)" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Cover Image</label>
                {editing.cover_image_url && <img src={editing.cover_image_url} alt="" className="mb-2 h-36 w-full rounded-xl object-cover" />}
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-3 text-center text-xs text-ink-300">
                  {uploading ? 'Uploading...' : editing.cover_image_url ? 'Replace cover image' : 'Upload cover image'}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                </label>
              </div>

              <Textarea
                label="Content (HTML — supports h2/h3/p/ul/ol/blockquote/img/a tags)"
                className="[&_textarea]:min-h-[260px]"
                required
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              />
              <Input label="Tags (comma-separated)" value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="styling tips, gifting" />
              <Input label="Author Name" value={editing.author_name} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} />
              <Input label="SEO Title (optional)" value={editing.seo_title} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} />
              <Textarea label="SEO Description (optional)" value={editing.seo_description} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      <ConfirmModal open={!!deleteTarget} title="Delete Post" description={`Delete "${deleteTarget?.title}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
