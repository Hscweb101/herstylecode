import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Package, MapPin, User as UserIcon, LogOut, Trash2 } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { formatINR, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, EmptyState, FullPageSpinner } from '@/components/ui/Misc'
import type { Order, Address } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  new: 'Order Placed', paid: 'Payment Confirmed', processing: 'Processing', packed: 'Packed',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded',
}

function OrdersTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      // Pull in any guest orders placed with this account's e-mail (e.g. on another device) first.
      await supabase.rpc('claim_my_orders')
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
      if (!active) return
      setOrders((data as unknown as Order[]) ?? [])
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [userId])

  if (loading) return <FullPageSpinner />
  if (orders.length === 0) return <EmptyState title="No orders yet" description="Your order history will appear here." />

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl bg-white p-5 shadow-luxe-sm">
          <button className="flex w-full items-center justify-between" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
            <div className="text-left">
              <p className="font-medium">{order.order_number}</p>
              <p className="text-xs text-ink-300">{formatDate(order.placed_at)} · {formatINR(order.total_amount)}</p>
            </div>
            <Badge tone={['cancelled', 'returned'].includes(order.status) ? 'danger' : 'brand'}>{STATUS_LABELS[order.status]}</Badge>
          </button>
          {expanded === order.id && (
            <div className="mt-4 space-y-3 border-t border-blush-100 pt-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <img src={item.image_url ?? undefined} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p>{item.product_name}</p>
                    <p className="text-xs text-ink-300">Qty {item.quantity}</p>
                  </div>
                  <span>{formatINR(item.line_total)}</span>
                </div>
              ))}
              {order.tracking_number && <p className="text-xs text-ink-500">Tracking: {order.tracking_number}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AddressesTab({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' })

  const load = () => {
    supabase.from('addresses').select('*').eq('customer_id', userId).then(({ data }) => {
      setAddresses((data as Address[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(load, [userId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('addresses').insert({ customer_id: userId, ...form, country: 'India' })
    if (error) {
      toast.error('Could not save address')
      return
    }
    toast.success('Address saved')
    setForm({ full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' })
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id)
    load()
  }

  if (loading) return <FullPageSpinner />

  return (
    <div className="space-y-4">
      {addresses.map((a) => (
        <div key={a.id} className="flex items-start justify-between rounded-2xl bg-white p-5 shadow-luxe-sm">
          <div className="text-sm">
            <p className="font-medium">{a.full_name} · {a.phone}</p>
            <p className="text-ink-500">{a.line1}, {a.line2 ? `${a.line2}, ` : ''}{a.city}, {a.state} - {a.pincode}</p>
          </div>
          <button onClick={() => handleDelete(a.id)}><Trash2 size={16} className="text-ink-300 hover:text-red-500" /></button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleAdd} className="grid gap-3 rounded-2xl bg-white p-5 shadow-luxe-sm sm:grid-cols-2">
          <Input label="Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address Line 1" required className="sm:col-span-2" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <Input label="Address Line 2" className="sm:col-span-2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input label="Pincode" required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">Save Address</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>+ Add New Address</Button>
      )}
    </div>
  )
}

function ProfileTab({ userId }: { userId: string }) {
  const profile = useAuthStore((s) => s.profile)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', userId)
    setSaving(false)
    if (error) {
      toast.error('Could not update profile')
      return
    }
    await refreshProfile()
    toast.success('Profile updated')
  }

  return (
    <form onSubmit={handleSave} className="max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-luxe-sm">
      <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <Button type="submit" loading={saving}>Save Changes</Button>
    </form>
  )
}

export default function Account() {
  useSeo({ title: 'My Account', noindex: true })
  const navigate = useNavigate()
  const { userId, isAnonymous, signOut } = useAuthStore()
  const [tab, setTab] = useState<'orders' | 'addresses' | 'profile'>('orders')

  if (isAnonymous) {
    return <Navigate to="/login?mode=signin" replace />
  }
  if (!userId) return <FullPageSpinner />

  const tabs = [
    { key: 'orders' as const, label: 'My Orders', icon: Package },
    { key: 'addresses' as const, label: 'Addresses', icon: MapPin },
    { key: 'profile' as const, label: 'Profile', icon: UserIcon },
  ]

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <h1 className="mb-8 font-serif text-3xl">My Account</h1>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="flex gap-2 overflow-x-auto md:flex-col">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium',
                tab === t.key ? 'bg-brand-600 text-white' : 'text-ink-700 hover:bg-blush-50',
              )}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
          <button onClick={handleSignOut} className="flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
        <div>
          {tab === 'orders' && <OrdersTab userId={userId} />}
          {tab === 'addresses' && <AddressesTab userId={userId} />}
          {tab === 'profile' && <ProfileTab userId={userId} />}
        </div>
      </div>
    </div>
  )
}
