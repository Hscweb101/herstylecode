import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Trash2, Plus, Star, X, Upload, Pencil, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, Card, ConfirmModal } from '@/components/admin/AdminUI'
import { Badge, StarRating, FullPageSpinner } from '@/components/ui/Misc'
import { Select, Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Review, Product, Category } from '@/types'

const EMPTY_FORM = {
  product_id: '', reviewer_name: '', rating: 5, title: '', body: '', is_verified_purchase: false,
  images: [] as string[],
  is_approved: true,
  created_at: '', // datetime-local value; empty = now
}

// ISO timestamp -> value for <input type="datetime-local"> (local time)
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<(Review & { product_name?: string })[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [productId, setProductId] = useState('')
  const [adding, setAdding] = useState<typeof EMPTY_FORM | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = () => {
    Promise.all([
      supabase.from('reviews').select('*, product:products(name)').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, slug, category_id').order('name'),
      supabase.from('categories').select('id, name, slug, parent_id').order('name'),
    ]).then(([r, p, c]) => {
      setCategories((c.data as unknown as Category[]) ?? [])
      setReviews(((r.data as unknown as (Review & { product?: { name: string } })[]) ?? []).map((rv) => ({ ...rv, product_name: rv.product?.name })))
      setProducts((p.data as unknown as Product[]) ?? [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleImageUpload = async (files: FileList) => {
    if (!adding) return
    setUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('reviews').upload(path, file)
      if (error) {
        toast.error(error.message)
        continue
      }
      const { data } = supabase.storage.from('reviews').getPublicUrl(path)
      uploaded.push(data.publicUrl)
    }
    setUploading(false)
    setAdding((prev) => (prev ? { ...prev, images: [...prev.images, ...uploaded] } : prev))
  }

  const removeImage = (url: string) => {
    setAdding((prev) => (prev ? { ...prev, images: prev.images.filter((i) => i !== url) } : prev))
  }

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adding) return
    if (!adding.product_id || !adding.reviewer_name.trim() || !adding.body.trim()) {
      toast.error('Please fill in product, name and review text')
      return
    }
    setSaving(true)
    const row = {
      product_id: adding.product_id,
      reviewer_name: adding.reviewer_name,
      rating: adding.rating,
      title: adding.title || null,
      body: adding.body,
      images: adding.images,
      is_verified_purchase: adding.is_verified_purchase,
      is_approved: adding.is_approved,
      ...(adding.created_at ? { created_at: new Date(adding.created_at).toISOString() } : {}),
    }
    const { error } = editingId
      ? await supabase.from('reviews').update(row).eq('id', editingId)
      : await supabase.from('reviews').insert(row)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(editingId ? 'Review updated' : 'Review added')
    setAdding(null)
    setEditingId(null)
    load()
  }

  const openEdit = (r: Review) => {
    setEditingId(r.id)
    setAdding({
      product_id: r.product_id, reviewer_name: r.reviewer_name, rating: r.rating, title: r.title ?? '', body: r.body ?? '',
      is_verified_purchase: r.is_verified_purchase, images: r.images ?? [], is_approved: r.is_approved, created_at: toLocalInput(r.created_at),
    })
  }
  const openAdd = () => {
    setEditingId(null)
    setAdding({ ...EMPTY_FORM, product_id: productId })
  }
  const closeForm = () => {
    setAdding(null)
    setEditingId(null)
  }

  const handleApprove = async (id: string) => {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
    toast.success('Review approved')
    load()
  }

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('reviews').delete().eq('id', deleteId)
    toast.success('Review removed')
    setDeleteId(null)
    load()
  }

  // Category -> product -> reviews. A parent category also covers its sub-categories.
  const categoryIds = new Set(categoryId ? [categoryId, ...categories.filter((c) => c.parent_id === categoryId).map((c) => c.id)] : [])
  const productsInCategory = products.filter((p) => !categoryId || (p.category_id && categoryIds.has(p.category_id)))
  const inScope = reviews.filter((r) => {
    if (productId) return r.product_id === productId
    return !categoryId || productsInCategory.some((p) => p.id === r.product_id)
  })
  const statusMatch = (r: Review) => filter === 'all' || (filter === 'pending' ? !r.is_approved : r.is_approved)
  const filtered = inScope.filter(statusMatch)
  const countFor = (pid: string) => reviews.filter((r) => r.product_id === pid && statusMatch(r)).length
  const topCategories = categories.filter((c) => !c.parent_id)

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader
        title="Reviews"
        description={`${reviews.filter((r) => !r.is_approved).length} pending approval`}
        action={<Button onClick={openAdd}><Plus size={16} /> Add Review</Button>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setProductId('') }}>
          <option value="">All categories</option>
          {topCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">All products ({productsInCategory.length})</option>
          {productsInCategory.map((p) => <option key={p.id} value={p.id}>{p.name} ({countFor(p.id)})</option>)}
        </Select>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="all">All Reviews</option>
        </Select>
      </div>

      {!productId ? (
        // No product picked yet: a short list of products with their review counts instead of one long pile of reviews.
        <div className="divide-y divide-blush-100 overflow-hidden rounded-2xl border border-blush-100 bg-white">
          {productsInCategory.map((p) => (
            <button key={p.id} type="button" onClick={() => setProductId(p.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-blush-50">
              <span className="font-medium">{p.name}</span>
              <span className="flex items-center gap-2 text-ink-500">{countFor(p.id)} review{countFor(p.id) === 1 ? '' : 's'}<ChevronRight size={15} /></span>
            </button>
          ))}
          {productsInCategory.length === 0 && <p className="px-4 py-6 text-center text-sm text-ink-500">No products in this category.</p>}
        </div>
      ) : (
      <Table>
        <thead><tr><Th>Product</Th><Th>Rating</Th><Th>Review</Th><Th>Customer</Th><Th>Date</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <Td>{r.product_name}</Td>
              <Td><StarRating rating={r.rating} size={13} /></Td>
              <Td className="max-w-xs">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-ink-500">{r.body}</p>
                {r.images && r.images.length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {r.images.map((url, idx) => (
                      <img key={idx} src={url} alt="" className="h-8 w-8 rounded object-cover" />
                    ))}
                  </div>
                )}
              </Td>
              <Td>{r.reviewer_name}</Td>
              <Td>{formatDate(r.created_at)}</Td>
              <Td><Badge tone={r.is_approved ? 'success' : 'gold'}>{r.is_approved ? 'Approved' : 'Pending'}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  <IconButton title="Edit" onClick={() => openEdit(r)}><Pencil size={15} /></IconButton>
                  {!r.is_approved && <IconButton title="Approve" onClick={() => handleApprove(r.id)}><Check size={15} /></IconButton>}
                  <IconButton title="Delete" onClick={() => setDeleteId(r.id)}><Trash2 size={15} /></IconButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/40 px-4 py-8">
          <Card className="w-full max-w-lg">
            <form onSubmit={handleAddReview} className="space-y-4">
              <h3 className="font-serif text-lg">{editingId ? 'Edit Review' : 'Add Review'}</h3>
              <Select label="Product" required value={adding.product_id} onChange={(e) => setAdding({ ...adding, product_id: e.target.value })}>
                <option value="">— Select a product —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setAdding({ ...adding, rating: n })}>
                    <Star size={22} className={n <= adding.rating ? 'fill-gold-500 text-gold-500' : 'fill-blush-100 text-blush-200'} />
                  </button>
                ))}
              </div>
              <Input label="Date & time" type="datetime-local" value={adding.created_at} onChange={(e) => setAdding({ ...adding, created_at: e.target.value })} />
              <Input label="Reviewer Name" required value={adding.reviewer_name} onChange={(e) => setAdding({ ...adding, reviewer_name: e.target.value })} />
              <Input label="Review Title (optional)" value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })} />
              <Textarea label="Review Text" required value={adding.body} onChange={(e) => setAdding({ ...adding, body: e.target.value })} />
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Photos (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {adding.images.map((url) => (
                    <div key={url} className="relative h-16 w-16">
                      <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-blush-200 text-ink-300 hover:border-brand-300 hover:text-brand-500">
                    {uploading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Upload size={18} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      disabled={uploading}
                      onChange={(e) => e.target.files && e.target.files.length > 0 && handleImageUpload(e.target.files)}
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-ink-300">Upload real product photos to make the review look genuine.</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={adding.is_verified_purchase} onChange={(e) => setAdding({ ...adding, is_verified_purchase: e.target.checked })} />
                Mark as Verified Purchase
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={adding.is_approved} onChange={(e) => setAdding({ ...adding, is_approved: e.target.checked })} />
                Approved (visible on the website)
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                <Button type="submit" loading={saving}>{editingId ? 'Save Changes' : 'Add Review'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      <ConfirmModal open={!!deleteId} title="Delete Review" description="This review will be permanently removed." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
