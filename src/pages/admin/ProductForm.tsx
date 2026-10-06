import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trash2, Plus, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatINR, slugify } from '@/lib/utils'
import { resizeImage } from '@/lib/image'
import { PageHeader, Card } from '@/components/admin/AdminUI'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Misc'
import type { Category, ProductImage, ProductVariant } from '@/types'

interface FormState {
  name: string; slug: string; sku: string; category_id: string;
  short_description: string; description: string; price: string; compare_at_price: string;
  stock_quantity: string; low_stock_threshold: string; material: string; colour: string; size: string;
  weight_grams: string; care_instructions: string; whats_included: string; delivery_info: string;
  return_eligible: boolean; cod_available: boolean; tags: string; video_url: string;
  show_purchase_proof: boolean; online_discount_type: 'amount' | 'percent'; online_discount_value: string;
  cod_advance_type: 'none' | 'amount' | 'percent'; cod_advance_value: string;
  is_active: boolean; is_featured: boolean; is_new_arrival: boolean; is_bestseller: boolean; is_trending: boolean; is_on_sale: boolean;
  seo_title: string; seo_description: string;
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', sku: '', category_id: '', short_description: '', description: '', price: '', compare_at_price: '',
  stock_quantity: '0', low_stock_threshold: '5', material: '', colour: '', size: '', weight_grams: '', care_instructions: '',
  whats_included: '', delivery_info: '', return_eligible: true, cod_available: true, tags: '', video_url: '',
  show_purchase_proof: true, online_discount_type: 'amount', online_discount_value: '', cod_advance_type: 'none', cod_advance_value: '',
  is_active: true, is_featured: false, is_new_arrival: false, is_bestseller: false, is_trending: false, is_on_sale: false,
  seo_title: '', seo_description: '',
}

interface VariantRow extends Partial<ProductVariant> {
  tempId: string
}

export default function ProductForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null)
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  useEffect(() => {
    if (isNew) return
    async function load() {
      const [{ data: product }, { data: imgs }, { data: vars }] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
        supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
      ])
      if (product) {
        setForm({
          name: product.name, slug: product.slug, sku: product.sku, category_id: product.category_id ?? '',
          short_description: product.short_description ?? '', description: product.description ?? '',
          price: String(product.price), compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
          stock_quantity: String(product.stock_quantity), low_stock_threshold: String(product.low_stock_threshold),
          material: product.material ?? '', colour: product.colour ?? '', size: product.size ?? '',
          weight_grams: product.weight_grams ? String(product.weight_grams) : '', care_instructions: product.care_instructions ?? '',
          whats_included: product.whats_included ?? '', delivery_info: product.delivery_info ?? '',
          return_eligible: product.return_eligible, cod_available: product.cod_available, tags: (product.tags ?? []).join(', '), video_url: product.video_url ?? '',
          show_purchase_proof: product.show_purchase_proof ?? true,
          online_discount_type: product.online_discount_type ?? 'amount',
          online_discount_value: product.online_discount_value ? String(product.online_discount_value) : '',
          cod_advance_type: product.cod_advance_type ?? 'none',
          cod_advance_value: product.cod_advance_value ? String(product.cod_advance_value) : '',
          is_active: product.is_active, is_featured: product.is_featured, is_new_arrival: product.is_new_arrival,
          is_bestseller: product.is_bestseller, is_trending: product.is_trending, is_on_sale: product.is_on_sale,
          seo_title: product.seo_title ?? '', seo_description: product.seo_description ?? '',
        })
      }
      setImages((imgs as ProductImage[]) ?? [])
      setVariants(((vars as ProductVariant[]) ?? []).map((v) => ({ ...v, tempId: v.id })))
      setLoading(false)
    }
    load()
  }, [id, isNew])

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: isNew ? slugify(name) : f.slug }))
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      // Store a web-sized original plus small copies for cards (-md) and thumbnails (-sm).
      const base = `${form.slug || 'product'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const path = `${base}.jpg`
      let uploadError: { message: string } | null = null
      try {
        const [full, md, sm] = await Promise.all([resizeImage(file, 1600, 0.85), resizeImage(file, 800, 0.82), resizeImage(file, 240, 0.8)])
        const opts = { contentType: 'image/jpeg', cacheControl: '31536000' }
        const results = await Promise.all([
          supabase.storage.from('product-images').upload(path, full, opts),
          supabase.storage.from('product-images').upload(`${base}-md.jpg`, md, opts),
          supabase.storage.from('product-images').upload(`${base}-sm.jpg`, sm, opts),
        ])
        uploadError = results.find((r) => r.error)?.error ?? null
      } catch (err) {
        uploadError = { message: err instanceof Error ? err.message : 'Could not process image' }
      }
      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        continue
      }
      const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path)
      setImages((prev) => [...prev, { id: crypto.randomUUID(), product_id: id ?? '', variant_id: null, url: publicUrl.publicUrl, alt_text: form.name, sort_order: prev.length, is_primary: prev.length === 0 }])
    }
    setUploading(false)
  }

  const setPrimaryImage = (imgId: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imgId })))
  }

  const removeImage = (imgId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imgId))
  }

  const handleVariantImageUpload = async (tempId: string, file: File) => {
    setUploadingVariantId(tempId)
    const path = `${form.slug || 'product'}-variant-${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
    setUploadingVariantId(null)
    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`)
      return
    }
    const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path)
    updateVariant(tempId, { image_url: publicUrl.publicUrl })
  }

  const addVariant = () => {
    setVariants((prev) => [...prev, { tempId: crypto.randomUUID(), variant_name: '', sku: '', stock_quantity: 0, is_active: true }])
  }

  const updateVariant = (tempId: string, patch: Partial<VariantRow>) => {
    setVariants((prev) => prev.map((v) => (v.tempId === tempId ? { ...v, ...patch } : v)))
  }

  const removeVariant = (tempId: string) => {
    setVariants((prev) => prev.filter((v) => v.tempId !== tempId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.sku || !form.price) {
      toast.error('Name, SKU and Price are required')
      return
    }
    const discountValue = Number(form.online_discount_value) || 0
    const advanceValue = Number(form.cod_advance_value) || 0
    if (form.online_discount_type === 'percent' && discountValue > 100) {
      toast.error('Pay Now discount cannot be more than 100%')
      return
    }
    if (form.cod_advance_type === 'percent' && advanceValue > 100) {
      toast.error('COD advance cannot be more than 100%')
      return
    }
    if (form.online_discount_type === 'amount' && discountValue >= Number(form.price)) {
      toast.error('Pay Now discount must be less than the price')
      return
    }
    setSaving(true)

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      sku: form.sku,
      category_id: form.category_id || null,
      short_description: form.short_description || null,
      description: form.description || null,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock_quantity: Number(form.stock_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
      material: form.material || null,
      colour: form.colour || null,
      size: form.size || null,
      weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
      care_instructions: form.care_instructions || null,
      whats_included: form.whats_included || null,
      delivery_info: form.delivery_info || null,
      return_eligible: form.return_eligible,
      cod_available: form.cod_available,
      show_purchase_proof: form.show_purchase_proof,
      online_discount_type: form.online_discount_type,
      online_discount_value: Number(form.online_discount_value) || 0,
      cod_advance_type: form.cod_advance_type,
      cod_advance_value: form.cod_advance_type === 'none' ? 0 : Number(form.cod_advance_value) || 0,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      video_url: form.video_url || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_new_arrival: form.is_new_arrival,
      is_bestseller: form.is_bestseller,
      is_trending: form.is_trending,
      is_on_sale: form.is_on_sale,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    }

    let productId = id
    if (isNew) {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
      productId = data.id
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
    }

    // Reconcile images: delete removed ones (only those that existed before), insert current set fresh.
    await supabase.from('product_images').delete().eq('product_id', productId)
    if (images.length > 0) {
      await supabase.from('product_images').insert(
        images.map((img, idx) => ({
          product_id: productId, variant_id: img.variant_id, url: img.url, alt_text: img.alt_text,
          sort_order: idx, is_primary: img.is_primary,
        })),
      )
    }

    // Reconcile variants similarly.
    await supabase.from('product_variants').delete().eq('product_id', productId)
    if (variants.length > 0) {
      const rows = variants
        .filter((v) => v.variant_name && v.sku)
        .map((v, idx) => ({
          product_id: productId, sku: v.sku, variant_name: v.variant_name, colour: v.colour || null,
          size: v.size || null, finish: v.finish || null, price: v.price || null, compare_at_price: v.compare_at_price || null,
          stock_quantity: v.stock_quantity ?? 0, image_url: v.image_url || null, is_active: v.is_active ?? true, sort_order: idx,
        }))
      if (rows.length > 0) await supabase.from('product_variants').insert(rows)
    }

    setSaving(false)
    toast.success(isNew ? 'Product created' : 'Product updated')
    navigate('/admin/products')
  }

  const priceNum = Number(form.price) || 0
  const discountNum = Number(form.online_discount_value) || 0
  const payNowAmount = form.online_discount_type === 'percent' ? Math.round((priceNum * Math.min(discountNum, 100)) / 100) : Math.min(discountNum, priceNum)
  const payNowPreview = discountNum > 0 && priceNum > 0 ? `Badge: ${formatINR(payNowAmount)} OFF. Shopper pays ${formatINR(priceNum - payNowAmount)} online instead of ${formatINR(priceNum)}.` : null
  const advanceNum = Number(form.cod_advance_value) || 0
  const advanceAmount = form.cod_advance_type === 'percent' ? Math.round((priceNum * Math.min(advanceNum, 100)) / 100) : Math.min(advanceNum, priceNum)
  const codPreview = form.cod_advance_type !== 'none' && advanceNum > 0 && priceNum > 0 ? `Shopper pays ${formatINR(advanceAmount)} now and ${formatINR(priceNum - advanceAmount)} on delivery (per item).` : null

  if (loading) return <FullPageSpinner />

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title={isNew ? 'Add Product' : 'Edit Product'}
        action={
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Product</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 font-serif text-lg">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Product Name" required className="sm:col-span-2" value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
              <Input label="Slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <Input label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="HSC-ER-001-GD" />
              <Select label="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              <Textarea label="Short Description" className="sm:col-span-2" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              <Textarea label="Full Description" className="sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-serif text-lg">Pricing & Inventory</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Price (₹)" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input label="Compare-at Price (₹)" type="number" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} />
              <Input label="Stock Quantity" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
              <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
            </div>
          </Card>

          <Card>
            <h3 className="font-serif text-lg">Offers & Payment</h3>
            <p className="mb-4 mt-1 text-xs text-ink-500">Set per product. Shoppers see these in the checkout popup. Leave at 0 / None to switch them off.</p>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-blush-200 p-4">
                <p className="text-sm font-semibold text-ink-900">Pay Now discount</p>
                <p className="mb-3 text-xs text-ink-500">Shows an "₹X OFF" badge on the Pay Now button and takes it off when the shopper pays online.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type" value={form.online_discount_type} onChange={(e) => setForm({ ...form, online_discount_type: e.target.value as FormState['online_discount_type'] })}>
                    <option value="amount">Fixed amount (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </Select>
                  <Input
                    label={form.online_discount_type === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
                    type="number" min="0" step="1" placeholder="0"
                    value={form.online_discount_value}
                    onChange={(e) => setForm({ ...form, online_discount_value: e.target.value })}
                  />
                </div>
                {payNowPreview && <p className="mt-3 text-xs font-medium text-emerald-700">{payNowPreview}</p>}
              </div>

              <div className="rounded-xl border border-blush-200 p-4">
                <p className="text-sm font-semibold text-ink-900">Cash on Delivery: partial payment</p>
                <p className="mb-3 text-xs text-ink-500">The shopper pays this much online now to confirm a COD order and the rest in cash on delivery.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Advance" value={form.cod_advance_type} onChange={(e) => setForm({ ...form, cod_advance_type: e.target.value as FormState['cod_advance_type'] })}>
                    <option value="none">None (full COD)</option>
                    <option value="amount">Fixed amount (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </Select>
                  <Input
                    label={form.cod_advance_type === 'percent' ? 'Advance (%)' : 'Advance (₹)'}
                    type="number" min="0" step="1" placeholder="0"
                    disabled={form.cod_advance_type === 'none'}
                    value={form.cod_advance_value}
                    onChange={(e) => setForm({ ...form, cod_advance_value: e.target.value })}
                  />
                </div>
                {codPreview && <p className="mt-3 text-xs font-medium text-emerald-700">{codPreview}</p>}
                {!form.cod_available && <p className="mt-3 text-xs text-amber-700">Cash on Delivery is switched off for this product, so the advance will not be used.</p>}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-serif text-lg">Specifications</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Material / Finish" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
              <Input label="Colour" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
              <Input label="Size / Dimensions" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
              <Input label="Weight (grams)" type="number" value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} />
              <Textarea label="Extra care note (optional, shown under the standard care points)" className="sm:col-span-2" value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} />
              <Textarea label="What's Included" value={form.whats_included} onChange={(e) => setForm({ ...form, whats_included: e.target.value })} />
              <Textarea label="Delivery Information" value={form.delivery_info} onChange={(e) => setForm({ ...form, delivery_info: e.target.value })} />
              <Input label="Product Video URL (optional)" className="sm:col-span-2" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg">Variants</h3>
              <Button type="button" size="sm" variant="outline" onClick={addVariant}><Plus size={14} /> Add Variant</Button>
            </div>
            <div className="space-y-3">
              {variants.map((v) => (
                <div key={v.tempId} className="grid grid-cols-2 gap-2 rounded-xl border border-blush-100 p-3 sm:grid-cols-7">
                  <Input placeholder="Name (Gold)" value={v.variant_name ?? ''} onChange={(e) => updateVariant(v.tempId, { variant_name: e.target.value })} />
                  <Input placeholder="SKU" value={v.sku ?? ''} onChange={(e) => updateVariant(v.tempId, { sku: e.target.value })} />
                  <Input placeholder="Colour" value={v.colour ?? ''} onChange={(e) => updateVariant(v.tempId, { colour: e.target.value })} />
                  <Input placeholder="Price" type="number" value={v.price ?? ''} onChange={(e) => updateVariant(v.tempId, { price: Number(e.target.value) })} />
                  <Input placeholder="Stock" type="number" value={v.stock_quantity ?? 0} onChange={(e) => updateVariant(v.tempId, { stock_quantity: Number(e.target.value) })} />
                  <div className="relative">
                    <label className="flex h-[42px] cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-dashed border-blush-200 px-2 text-center text-[11px] text-ink-300 hover:border-brand-300">
                      {uploadingVariantId === v.tempId ? (
                        'Uploading...'
                      ) : v.image_url ? (
                        <img src={v.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        'Upload image'
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={uploadingVariantId === v.tempId}
                        onChange={(e) => e.target.files?.[0] && handleVariantImageUpload(v.tempId, e.target.files[0])}
                      />
                    </label>
                    {v.image_url && (
                      <button
                        type="button"
                        onClick={() => updateVariant(v.tempId, { image_url: '' })}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 shadow-luxe-sm"
                        aria-label="Remove variant image"
                      >
                        <Trash2 size={11} className="text-red-500" />
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={() => removeVariant(v.tempId)} className="flex items-center justify-center text-ink-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {variants.length === 0 && <p className="text-sm text-ink-300">No variants. Add one if this product has Gold/Silver/Size options etc.</p>}
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-serif text-lg">SEO</h3>
            <div className="grid gap-4">
              <Input label="SEO Title" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
              <Textarea label="SEO Meta Description" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-serif text-lg">Images</h3>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl border border-blush-100">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setPrimaryImage(img.id)} className="absolute left-1 top-1 rounded-full bg-white/90 p-1">
                    <Star size={12} className={img.is_primary ? 'fill-gold-500 text-gold-500' : 'text-ink-300'} />
                  </button>
                  <button type="button" onClick={() => removeImage(img.id)} className="absolute right-1 top-1 rounded-full bg-white/90 p-1">
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blush-200 p-4 text-center text-xs text-ink-300 hover:border-brand-300">
              {uploading ? 'Uploading...' : 'Click to upload images'}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => handleImageUpload(e.target.files)} disabled={uploading} />
            </label>
          </Card>

          <Card>
            <h3 className="mb-4 font-serif text-lg">Product Page Display</h3>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink-900">Show "people purchased"</p>
                <p className="mt-0.5 text-xs text-ink-500">The "[Name] and N others purchased" line under the buttons on this product's page.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.show_purchase_proof}
                aria-label="Show people purchased on the product page"
                onClick={() => setForm({ ...form, show_purchase_proof: !form.show_purchase_proof })}
                className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', form.show_purchase_proof ? 'bg-brand-600' : 'bg-gray-300')}
              >
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', form.show_purchase_proof ? 'left-[22px]' : 'left-0.5')} />
              </button>
            </div>
            <p className="mt-3 text-xs font-medium text-ink-700">{form.show_purchase_proof ? 'Currently shown' : 'Currently hidden'}</p>
          </Card>

          <Card>
            <h3 className="mb-4 font-serif text-lg">Visibility & Flags</h3>
            <div className="space-y-2 text-sm">
              {([
                ['is_active', 'Active (visible on storefront)'],
                ['is_featured', 'Featured'],
                ['is_new_arrival', 'New Arrival'],
                ['is_bestseller', 'Best Seller'],
                ['is_trending', 'Trending'],
                ['is_on_sale', 'On Sale'],
                ['return_eligible', 'Return Eligible'],
                ['cod_available', 'Available for Cash on Delivery'],
              ] as [keyof FormState, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={form[key] as boolean} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
