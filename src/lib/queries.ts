import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'

export const PRODUCT_CARD_SELECT = `
  id, name, slug, sku, price, compare_at_price, stock_quantity, track_inventory,
  is_active, is_featured, is_new_arrival, is_bestseller, is_trending, is_on_sale,
  rating_avg, rating_count, category_id, tags, created_at,
  images:product_images(url, is_primary, sort_order)
`

export const PRODUCT_DETAIL_SELECT = `
  *,
  category:categories(id, name, slug),
  images:product_images(id, url, alt_text, is_primary, sort_order, variant_id),
  variants:product_variants(*)
`

export interface ProductFilters {
  categorySlug?: string
  collectionSlug?: string
  flag?: 'is_new_arrival' | 'is_bestseller' | 'is_trending' | 'is_on_sale' | 'is_featured'
  search?: string
  minPrice?: number
  maxPrice?: number
  colour?: string
  material?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating'
  limit?: number
}

export async function fetchProducts(filters: ProductFilters): Promise<Product[]> {
  let query = supabase.from('products').select(PRODUCT_CARD_SELECT).eq('is_active', true)

  if (filters.categorySlug) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', filters.categorySlug).maybeSingle()
    if (cat) query = query.eq('category_id', cat.id)
    else return []
  }

  if (filters.collectionSlug) {
    const { data: col } = await supabase.from('collections').select('id').eq('slug', filters.collectionSlug).maybeSingle()
    if (col) {
      const { data: links } = await supabase.from('product_collections').select('product_id').eq('collection_id', col.id)
      const ids = (links ?? []).map((l) => l.product_id)
      if (ids.length === 0) return []
      query = query.in('id', ids)
    } else return []
  }

  if (filters.flag) query = query.eq(filters.flag, true)
  if (filters.search) query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice)
  if (filters.colour) query = query.eq('colour', filters.colour)
  if (filters.material) query = query.eq('material', filters.material)

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'popularity':
      query = query.order('view_count', { ascending: false })
      break
    case 'rating':
      query = query.order('rating_avg', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) {
    console.error(error.message)
    return []
  }
  return (data as unknown as Product[]) ?? []
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(PRODUCT_DETAIL_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle()
  if (error) {
    console.error(error.message)
    return null
  }
  return data as unknown as Product | null
}
