import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { PageHeader, Table, Th, Td, Card } from '@/components/admin/AdminUI'
import { Badge, FullPageSpinner } from '@/components/ui/Misc'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Product } from '@/types'

export default function InventoryAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustments, setAdjustments] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<{ id: string; change_qty: number; reason: string; note: string | null; created_at: string; product_id: string | null }[]>([])

  const load = async () => {
    const [{ data: prods }, { data: hist }] = await Promise.all([
      supabase.from('products').select('*').order('stock_quantity', { ascending: true }),
      supabase.from('inventory_history').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    setProducts((prods as Product[]) ?? [])
    setHistory(hist ?? [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const handleAdjust = async (product: Product) => {
    const delta = Number(adjustments[product.id])
    if (!delta) return
    const newQty = product.stock_quantity + delta
    if (newQty < 0) {
      toast.error('Stock cannot go negative')
      return
    }
    await supabase.from('products').update({ stock_quantity: newQty }).eq('id', product.id)
    await supabase.from('inventory_history').insert({
      product_id: product.id, change_qty: delta, reason: 'manual_adjustment', reference_type: 'manual_adjustment', note: 'Manual adjustment via admin',
    })
    toast.success('Stock updated')
    setAdjustments((a) => ({ ...a, [product.id]: '' }))
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Inventory" description="Adjust stock levels and view history" />
      <Table>
        <thead><tr><Th>Product</Th><Th>SKU</Th><Th>Current Stock</Th><Th>Adjust</Th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.name}</Td>
              <Td>{p.sku}</Td>
              <Td>
                {p.stock_quantity <= 0 ? <Badge tone="danger">0 — Out of Stock</Badge> : p.stock_quantity <= p.low_stock_threshold ? <Badge tone="gold">{p.stock_quantity}</Badge> : p.stock_quantity}
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="+10 / -5"
                    value={adjustments[p.id] ?? ''}
                    onChange={(e) => setAdjustments((a) => ({ ...a, [p.id]: e.target.value }))}
                    className="w-24"
                  />
                  <Button size="sm" variant="outline" onClick={() => handleAdjust(p)}>Apply</Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Card className="mt-6">
        <h3 className="mb-4 font-serif text-lg">Recent Inventory Changes</h3>
        <div className="space-y-2 text-sm">
          {history.map((h) => (
            <div key={h.id} className="flex justify-between border-b border-blush-50 pb-2">
              <span>{h.reason.replace(/_/g, ' ')} · {h.change_qty > 0 ? `+${h.change_qty}` : h.change_qty}</span>
              <span className="text-ink-300">{formatDate(h.created_at)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
