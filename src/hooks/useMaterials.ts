import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const DEFAULT_MATERIALS = ['Brass', 'Uncut Stone']

/** The list of material options (Admin > Product > Specifications). Stored in store_settings under "materials". */
export function useMaterials() {
  const [materials, setMaterials] = useState<string[]>(DEFAULT_MATERIALS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'materials')
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        const list = (data?.value as { options?: unknown } | undefined)?.options
        if (Array.isArray(list)) setMaterials(list.filter((m): m is string => typeof m === 'string' && m.trim() !== ''))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  /** Saves the list (admin only) and updates local state. Returns an error message, or null on success. */
  const save = useCallback(async (next: string[]): Promise<string | null> => {
    const { error } = await supabase.from('store_settings').upsert({ key: 'materials', value: { options: next } })
    if (error) return error.message
    setMaterials(next)
    return null
  }, [])

  /** Renames a material in the list and on every product that uses it. Returns an error message, or null on success. */
  const rename = useCallback(async (from: string, to: string, current: string[]): Promise<string | null> => {
    const { error: prodErr } = await supabase.from('products').update({ material: to }).eq('material', from)
    if (prodErr) return prodErr.message
    return save(current.map((m) => (m === from ? to : m)))
  }, [save])

  return { materials, loading, save, rename }
}
