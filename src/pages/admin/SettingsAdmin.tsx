import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { invalidateStoreSettingsCache } from '@/hooks/useStoreSettings'
import { PageHeader, Card } from '@/components/admin/AdminUI'
import { Input, Textarea, FieldLabel } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FullPageSpinner } from '@/components/ui/Misc'
import type { StoreSettingsMap } from '@/types'

const DEFAULTS: StoreSettingsMap = {
  store_info: { name: 'HerStyleCode', tagline: 'Your Style. Your Rules.', support_email: '', support_phone: '', whatsapp_number: '', address: '' },
  social_links: { instagram: '', facebook: '', pinterest: '', youtube: '' },
  shipping: { free_shipping_threshold: 999, standard_shipping_fee: 59, cod_available: true, cod_fee: 0 },
  tax: { gst_percentage: 0, prices_include_tax: true },
  announcement_bar: {
    enabled: true,
    speed_seconds: 22,
    items: ['Free shipping on prepaid orders above ₹999', 'Cash on Delivery available', 'Easy 7-day returns'],
  },
  analytics: { ga4_id: '', meta_pixel_id: '', gsc_verification: '' },
}

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<StoreSettingsMap>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('store_settings').select('key, value').then(({ data }) => {
      const merged = { ...DEFAULTS }
      for (const row of data ?? []) {
        ;(merged as Record<string, unknown>)[row.key] = { ...(DEFAULTS as unknown as Record<string, object>)[row.key], ...(row.value as object) }
      }
      setSettings(merged)
      setLoading(false)
    })
  }, [])

  const update = <K extends keyof StoreSettingsMap>(key: K, patch: Partial<StoreSettingsMap[K]>) => {
    setSettings((s) => ({ ...s, [key]: { ...s[key], ...patch } }))
  }

  const handleSave = async () => {
    setSaving(true)
    const entries = Object.entries(settings) as [keyof StoreSettingsMap, object][]
    for (const [key, value] of entries) {
      await supabase.from('store_settings').upsert({ key, value })
    }
    invalidateStoreSettingsCache()
    setSaving(false)
    toast.success('Settings saved')
  }

  if (loading) return <FullPageSpinner />

  return (
    <div>
      <PageHeader title="Settings" action={<Button onClick={handleSave} loading={saving}>Save All Settings</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-serif text-lg">Store Info</h3>
          <div className="space-y-4">
            <Input label="Store Name" value={settings.store_info.name} onChange={(e) => update('store_info', { name: e.target.value })} />
            <Input label="Tagline" value={settings.store_info.tagline} onChange={(e) => update('store_info', { tagline: e.target.value })} />
            <Input label="Support Email" value={settings.store_info.support_email} onChange={(e) => update('store_info', { support_email: e.target.value })} />
            <Input label="Support Phone" value={settings.store_info.support_phone} onChange={(e) => update('store_info', { support_phone: e.target.value })} />
            <Input label="WhatsApp Number (with country code)" value={settings.store_info.whatsapp_number} onChange={(e) => update('store_info', { whatsapp_number: e.target.value })} />
            <Textarea label="Business Address" value={settings.store_info.address} onChange={(e) => update('store_info', { address: e.target.value })} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Social Links</h3>
          <div className="space-y-4">
            <Input label="Instagram URL" value={settings.social_links.instagram} onChange={(e) => update('social_links', { instagram: e.target.value })} />
            <Input label="Facebook URL" value={settings.social_links.facebook} onChange={(e) => update('social_links', { facebook: e.target.value })} />
            <Input label="Pinterest URL" value={settings.social_links.pinterest} onChange={(e) => update('social_links', { pinterest: e.target.value })} />
            <Input label="YouTube URL" value={settings.social_links.youtube} onChange={(e) => update('social_links', { youtube: e.target.value })} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Shipping</h3>
          <div className="space-y-4">
            <Input label="Free Shipping Threshold (₹)" type="number" value={settings.shipping.free_shipping_threshold} onChange={(e) => update('shipping', { free_shipping_threshold: Number(e.target.value) })} />
            <Input label="Standard Shipping Fee (₹)" type="number" value={settings.shipping.standard_shipping_fee} onChange={(e) => update('shipping', { standard_shipping_fee: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.shipping.cod_available} onChange={(e) => update('shipping', { cod_available: e.target.checked })} /> Enable Cash on Delivery
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Tax (GST)</h3>
          <div className="space-y-4">
            <Input label="GST Percentage" type="number" value={settings.tax.gst_percentage} onChange={(e) => update('tax', { gst_percentage: Number(e.target.value) })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.tax.prices_include_tax} onChange={(e) => update('tax', { prices_include_tax: e.target.checked })} /> Prices are tax-inclusive
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Top Announcement Strip</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.announcement_bar.enabled} onChange={(e) => update('announcement_bar', { enabled: e.target.checked })} /> Enabled (scrolling strip at the very top)
            </label>
            <Input
              label="Scroll Speed (seconds per loop — lower is faster)"
              type="number"
              min={5}
              value={settings.announcement_bar.speed_seconds}
              onChange={(e) => update('announcement_bar', { speed_seconds: Number(e.target.value) })}
            />
            <div>
              <FieldLabel>Messages (shown one after another, on a loop)</FieldLabel>
              <div className="space-y-2">
                {settings.announcement_bar.items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const items = [...settings.announcement_bar.items]
                        items[i] = e.target.value
                        update('announcement_bar', { items })
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => update('announcement_bar', { items: settings.announcement_bar.items.filter((_, idx) => idx !== i) })}
                      className="rounded-xl px-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-2"
                onClick={() => update('announcement_bar', { items: [...settings.announcement_bar.items, ''] })}
              >
                + Add Message
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Analytics & Marketing</h3>
          <div className="space-y-4">
            <Input label="Google Analytics 4 (GA4) ID" value={settings.analytics.ga4_id} onChange={(e) => update('analytics', { ga4_id: e.target.value })} placeholder="G-XXXXXXX" />
            <Input label="Meta / Facebook Pixel ID" value={settings.analytics.meta_pixel_id} onChange={(e) => update('analytics', { meta_pixel_id: e.target.value })} />
            <Input label="Google Search Console Verification" value={settings.analytics.gsc_verification} onChange={(e) => update('analytics', { gsc_verification: e.target.value })} />
          </div>
        </Card>
      </div>
    </div>
  )
}
