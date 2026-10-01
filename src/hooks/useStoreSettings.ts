import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StoreSettingsMap } from '@/types'

export const DEFAULT_FOOTER_LINKS: StoreSettingsMap['footer_links'] = {
  shop: [
    { label: 'Shop All', to: '/shop' },
    { label: 'New Arrivals', to: '/collections/new-arrivals' },
    { label: 'Best Sellers', to: '/collections/best-sellers' },
    { label: 'Sale', to: '/collections/sale' },
  ],
  support: [
    { label: 'Contact Us', to: '/contact' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Track Order', to: '/track-order' },
    { label: 'About Us', to: '/page/about-us' },
  ],
  policies: [
    { label: 'Shipping Policy', to: '/page/shipping-policy' },
    { label: 'Returns & Refund', to: '/page/returns-refund-policy' },
    { label: 'Privacy Policy', to: '/page/privacy-policy' },
    { label: 'Terms & Conditions', to: '/page/terms-conditions' },
    { label: 'Cancellation Policy', to: '/page/cancellation-policy' },
  ],
}

const DEFAULTS: StoreSettingsMap = {
  store_info: {
    name: 'HerStyleCode',
    tagline: 'Your Style. Your Rules.',
    support_email: 'herstylecodewebsite@gmail.com',
    support_phone: '+91 90000 00000',
    whatsapp_number: '+91 90000 00000',
    address: '',
  },
  social_links: {
    instagram: 'https://www.instagram.com/herstylecode.in',
    facebook: '',
    pinterest: 'https://pin.it/6RSayP9fW',
    youtube: 'https://www.youtube.com/@HerStyleCode',
  },
  shipping: { free_shipping_threshold: 999, standard_shipping_fee: 59, cod_available: true, cod_fee: 0 },
  tax: { gst_percentage: 0, prices_include_tax: true },
  announcement_bar: {
    enabled: true,
    speed_seconds: 22,
    items: ['Free shipping on prepaid orders above ₹999', 'Cash on Delivery available', 'Easy 7-day returns'],
  },
  analytics: { ga4_id: '', meta_pixel_id: '', gsc_verification: '' },
  footer_links: DEFAULT_FOOTER_LINKS,
}

let cache: StoreSettingsMap | null = null

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettingsMap>(cache ?? DEFAULTS)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    let active = true
    supabase
      .from('store_settings')
      .select('key, value')
      .then(({ data }) => {
        if (!active || !data) return
        const merged = { ...DEFAULTS }
        for (const row of data) {
          ;(merged as Record<string, unknown>)[row.key] = {
            ...(DEFAULTS as unknown as Record<string, object>)[row.key],
            ...(row.value as object),
          }
        }
        // Admin-saved links win; the defaults only fill in when a link is empty or not a real URL.
        const links = merged.social_links as Record<string, string>
        for (const [k, v] of Object.entries(DEFAULTS.social_links)) if (!/^https?:\/\//.test(links[k] ?? '')) links[k] = v
        cache = merged
        setSettings(merged)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { settings, loading }
}

export function invalidateStoreSettingsCache() {
  cache = null
}
