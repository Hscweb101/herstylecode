import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { NavigationItem } from '@/types'

let cache: NavigationItem[] | null = null

export function useNavigationItems() {
  const [items, setItems] = useState<NavigationItem[]>(cache ?? [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    supabase
      .from('navigation_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        cache = (data as NavigationItem[]) ?? []
        setItems(cache)
        setLoading(false)
      })
  }, [])

  return { items, loading }
}
