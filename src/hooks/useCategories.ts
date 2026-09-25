import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

let cache: Category[] | null = null

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        cache = (data as Category[]) ?? []
        setCategories(cache)
        setLoading(false)
      })
  }, [])

  return { categories, loading }
}
