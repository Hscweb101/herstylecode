import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Copy, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { PageHeader, Table, Th, Td, IconButton, ConfirmModal, Pagination } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SmartImage } from '@/components/ui/SmartImage'
import type { Category, Product } from '@/types'

const UNCATEGORISED = '__none'

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const load = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, images:product_images(url, is_primary)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setProducts((prods as unknown as Product[]) ?? [])
    setCategories((cats as Category[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  // Category dropdown: parents first, each followed by its children, with product counts.
  const categoryOptions = useMemo(() => {
    const countFor = (id: string) => {
      const ids = new Set([id, ...categories.filter((c) => c.parent_id === id).map((c) => c.id)])
      return products.filter((p) => p.category_id && ids.has(p.category_id)).length
    }
    const parents = categories.filter((c) => !c.parent_id)
    return parents.flatMap((parent) => [
      { id: parent.id, label: `${parent.name} (${countFor(parent.id)})` },
      ...categories.filter((c) => c.parent_id === parent.id).map((c) => ({ id: c.id, label: `  - ${c.name} (${countFor(c.id)})` })),
    ])
  }, [categories, products])

  const uncategorisedCount = products.filter((p) => !p.category_id).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    // A parent category also covers its sub-categories (e.g. "Earrings" includes "Hoop Earrings").
    const ids = categoryId && categoryId !== UNCATEGORISED ? new Set([categoryId, ...categories.filter((c) => c.parent_id === categoryId).map((c) => c.id)]) : null
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      if (categoryId === UNCATEGORISED) return !p.category_id
      if (ids) return !!p.category_id && ids.has(p.category_id)
      return true
    })
  }, [products, categories, search, categoryId])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = search.trim() !== '' || categoryId !== ''

  const clearFilters = () => {
    setSearch('')
    setCategoryId('')
    setPage(1)
  }

  const handleDuplicate = async (p: Product) => {
    const { id, images, created_at, updated_at, ...rest } = p as Product & Record<string, unknown>
    void id; void images; void created_at; void updated_at
    const { error } = await supabase.from('products').insert({
      ...rest,
      name: `${p.name} (Copy)`,
      slug: `${p.slug}-copy-${Date.now()}`,
      sku: `${p.sku}-COPY-${Date.now()}`,
    })
    if (error) {
      toast.error('Could not duplicate product')
      return
    }
    toast.success('Product duplicated')
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Could not delete product')
    } else {
      toast.success('Product deleted')
      load()
    }
    setDeleteTarget(null)
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader
        title="Products"
        description={hasFilters ? `${filtered.length} of ${products.length} products` : `${products.length} products`}
        action={<Link to="/admin/products/new"><Button><Plus size={16} /> Add Product</Button></Link>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="[&_input]:pl-10"
          />
        </div>
        <Select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by category"
          className="w-full sm:w-64"
        >
          <option value="">All categories ({products.length})</option>
          {categoryOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
          {uncategorisedCount > 0 && <option value={UNCATEGORISED}>Uncategorised ({uncategorisedCount})</option>}
        </Select>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-brand-600 hover:bg-blush-50">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>SKU</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p) => {
            const image = p.images?.find((i) => i.is_primary)?.url ?? p.images?.[0]?.url
            return (
              <tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {image ? (
                      <SmartImage src={image} variant="sm" alt="" loading="lazy" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-blush-50" />
                    )}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </Td>
                <Td className="text-ink-500">{p.category_id ? categoryName.get(p.category_id) ?? '-' : '-'}</Td>
                <Td>{p.sku}</Td>
                <Td>{formatINR(p.price)}</Td>
                <Td>
                  {p.stock_quantity <= 0 ? <Badge tone="danger">Out of Stock</Badge> : p.stock_quantity <= p.low_stock_threshold ? <Badge tone="gold">{p.stock_quantity} left</Badge> : p.stock_quantity}
                </Td>
                <Td><Badge tone={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Hidden'}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Link to={`/admin/products/${p.id}`}><IconButton title="Edit"><Pencil size={15} /></IconButton></Link>
                    <IconButton title="Duplicate" onClick={() => handleDuplicate(p)}><Copy size={15} /></IconButton>
                    <IconButton title="Delete" onClick={() => setDeleteTarget(p)}><Trash2 size={15} /></IconButton>
                  </div>
                </Td>
              </tr>
            )
          })}
          {visible.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-500">
                No products match your search{categoryId ? ' in this category' : ''}.
                {hasFilters && (
                  <button onClick={clearFilters} className="ml-2 font-medium text-brand-600 underline">Clear filters</button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onPage={setPage}
        onPageSize={(n) => {
          setPageSize(n)
          setPage(1)
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
