import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Mail, MessageCircle, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import logo from '@/assets/logo.png'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/types'

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function PinterestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8.5 17c1-3 1.6-5.3 2.2-7.7a2.7 2.7 0 0 1 5.2.9c0 2-1.3 4-3.2 4-1 0-1.7-.5-2-1.2" />
      <path d="M11 9.3c-.3 1-1.1 4.3-1.4 5.6" />
    </svg>
  )
}

const shopLinks = [
  { label: 'Shop All', to: '/shop' },
  { label: 'New Arrivals', to: '/collections/new-arrivals' },
  { label: 'Best Sellers', to: '/collections/best-sellers' },
  { label: 'Sale', to: '/collections/sale' },
]

const supportLinks = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Track Order', to: '/track-order' },
  { label: 'About Us', to: '/page/about-us' },
]

const policyLinks = [
  { label: 'Shipping Policy', to: '/page/shipping-policy' },
  { label: 'Returns & Refund', to: '/page/returns-refund-policy' },
  { label: 'Privacy Policy', to: '/page/privacy-policy' },
  { label: 'Terms & Conditions', to: '/page/terms-conditions' },
  { label: 'Cancellation Policy', to: '/page/cancellation-policy' },
]

const paymentLogos = [
  { file: 'upi.svg', name: 'UPI' },
  { file: 'googlepay.svg', name: 'Google Pay' },
  { file: 'phonepe.svg', name: 'PhonePe' },
  { file: 'paytm.svg', name: 'Paytm' },
  { file: 'visa.svg', name: 'Visa' },
  { file: 'mastercard.svg', name: 'Mastercard' },
  { file: 'rupay.svg', name: 'RuPay' },
]

function LinkGroup({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-900">{title}</h4>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-[13px] text-ink-500 transition-colors hover:text-brand-600">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** "From the Blog" teaser. Rendered above the footer (not inside it) so the footer itself stays slim. */
export function BlogTeaser() {
  const location = useLocation()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const hidden = location.pathname === '/checkout' || location.pathname.startsWith('/product/')

  useEffect(() => {
    if (hidden) return
    supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setPosts((data as BlogPost[]) ?? []))
  }, [hidden])

  if (hidden || posts.length === 0) return null

  return (
    <section className="mx-auto mt-16 w-full max-w-7xl px-4 md:px-8">
      <div className="rounded-3xl bg-blush-50 p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-serif text-xl text-ink-900 md:text-2xl">From the Blog</h3>
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-luxe-sm">
              <div className="aspect-[16/10] overflow-hidden bg-blush-100">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium text-ink-900">{p.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const { settings } = useStoreSettings()
  const whatsapp = settings.store_info.whatsapp_number.replace(/[^0-9]/g, '')

  const socials = [
    { href: settings.social_links.instagram, label: 'Instagram', icon: <InstagramIcon /> },
    { href: settings.social_links.facebook, label: 'Facebook', icon: <FacebookIcon /> },
    { href: settings.social_links.pinterest, label: 'Pinterest', icon: <PinterestIcon /> },
    { href: whatsapp ? `https://wa.me/${whatsapp}` : '', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
  ].filter((s) => s.href)

  return (
    <footer className="mt-16 border-t border-blush-100 bg-gradient-to-b from-white to-blush-50/70">
      <div className="h-0.5 bg-gradient-to-r from-brand-400 via-gold-500 to-brand-400" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr]">
          {/* brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block">
              <img src={logo} alt="HerStyleCode" className="h-14 w-auto object-contain" />
            </Link>
            <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-ink-500">{settings.store_info.tagline}</p>
            {socials.length > 0 && (
              <div className="mt-3 flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-blush-200 bg-white text-ink-700 transition-colors hover:border-brand-500 hover:bg-brand-600 hover:text-white"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <LinkGroup title="Shop" links={shopLinks} />
          <LinkGroup title="Support" links={supportLinks} />
          <LinkGroup title="Policies" links={policyLinks} />

          {/* contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-900">Contact</h4>
            <ul className="space-y-1.5 text-[13px] text-ink-500">
              {settings.store_info.support_email && (
                <li>
                  <a href={`mailto:${settings.store_info.support_email}`} className="flex items-center gap-2 transition-colors hover:text-brand-600">
                    <Mail size={14} className="shrink-0 text-brand-500" />
                    <span className="break-all">{settings.store_info.support_email}</span>
                  </a>
                </li>
              )}
              {settings.store_info.support_phone && (
                <li>
                  <a href={`tel:${settings.store_info.support_phone}`} className="flex items-center gap-2 transition-colors hover:text-brand-600">
                    <Phone size={14} className="shrink-0 text-brand-500" />
                    {settings.store_info.support_phone}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium text-[#128C7E] hover:underline">
                    <MessageCircle size={14} className="shrink-0" /> Chat on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-blush-200 pt-4 md:flex-row">
          <p className="text-xs text-ink-500">© {new Date().getFullYear()} HerStyleCode. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {paymentLogos.map(({ file, name }) => (
              <span key={name} className="flex h-7 items-center rounded-md border border-blush-200 bg-white px-2">
                <img src={`/payments/${file}`} alt={name} title={name} className="h-4 w-auto max-w-[3.25rem] object-contain" />
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-300">
          HerStyleCode sells fashion (artificial) jewellery. Our products are not made of real gold, silver or precious stones.
        </p>
      </div>
    </footer>
  )
}
