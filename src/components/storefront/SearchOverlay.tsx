import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Search } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'
import { formatINR } from '@/lib/utils'
import { Spinner } from '@/components/ui/Misc'

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchOpen) {
      setQuery('')
      setResults([])
    }
  }, [searchOpen])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, sku, images:product_images(url, is_primary)')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,tags.cs.{${query}}`)
        .limit(8)
      setResults((data as unknown as Product[]) ?? [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(handle)
  }, [query])

  if (!searchOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink-900/40" onClick={() => setSearchOpen(false)} />
      <div className="relative mx-auto mt-20 w-[92%] max-w-xl rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-blush-100 pb-3">
          <Search size={18} className="text-ink-300" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search earrings, necklaces, SKU..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-300"
          />
          <button onClick={() => setSearchOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto py-2">
          {loading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-300">No products found for "{query}"</p>
          )}
          {results.map((p) => {
            const image = p.images?.find((i) => i.is_primary)?.url ?? p.images?.[0]?.url
            return (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-blush-50"
              >
                <img src={image} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm text-ink-900">{p.name}</p>
                  <p className="text-xs text-brand-600">{formatINR(p.price)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
