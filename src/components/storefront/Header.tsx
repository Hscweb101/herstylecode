import { Link, NavLink } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react'
import logo from '@/assets/logo.png'
import { useUIStore } from '@/store/uiStore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useAuthStore } from '@/store/authStore'
import { Marquee } from '@/components/ui/Marquee'
import { MegaShell, ShopMegaMenu } from '@/components/storefront/MegaMenu'
import { useHoverMenu } from '@/hooks/useHoverMenu'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'

const primaryLinks = [
  { label: 'Shop', to: '/shop' },
  { label: 'Sale', to: '/collections/sale' },
]

const infoLinks = [
  { label: 'About Us', to: '/page/about-us' },
  { label: 'Contact', to: '/contact' },
]

export function AnnouncementBar() {
  const { settings } = useStoreSettings()
  const items = settings.announcement_bar.items.filter(Boolean)
  if (!settings.announcement_bar.enabled || items.length === 0) return null
  return (
    <div className="bg-ink-900 py-2 text-xs tracking-wide text-white">
      <Marquee direction="rtl" speedSeconds={settings.announcement_bar.speed_seconds}>
        {items.map((text, i) => (
          <span key={i} className="mx-8 whitespace-nowrap">
            {text}
          </span>
        ))}
      </Marquee>
    </div>
  )
}

export function Header() {
  const cartCount = useCartStore((s) => s.itemCount())
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const { setCartOpen, setSearchOpen, mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { categories } = useCategories()
  const shopMenu = useHoverMenu<boolean>()
  const isAnonymous = useAuthStore((s) => s.isAnonymous)

  return (
    <header className="relative z-40 border-b border-blush-100 bg-cream/95">
      <AnnouncementBar />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 md:px-8">
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex items-center">
          <img src={logo} alt="HerStyleCode" className="h-[3.75rem] w-auto object-contain md:h-[5.25rem]" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink
            to="/shop"
            onMouseEnter={() => shopMenu.show(true)}
            onFocus={() => shopMenu.show(true)}
            onMouseLeave={shopMenu.hide}
            onClick={shopMenu.close}
            aria-expanded={!!shopMenu.active}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-1 py-2 text-sm font-medium tracking-wide transition-colors hover:text-brand-600',
                'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-500 after:transition-transform after:duration-300',
                (isActive || shopMenu.active) && 'text-brand-600 after:scale-x-100',
                !isActive && !shopMenu.active && 'text-ink-700',
              )
            }
          >
            Shop
            <ChevronDown size={13} className={cn('transition-transform duration-200', shopMenu.active && 'rotate-180')} />
          </NavLink>
          {[...primaryLinks.filter((l) => l.label !== 'Shop'), ...infoLinks].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onMouseEnter={shopMenu.hide}
              className={({ isActive }) =>
                cn('text-sm font-medium tracking-wide text-ink-700 transition-colors hover:text-brand-600', isActive && 'text-brand-600')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)} aria-label="Search" className="rounded-full p-2 hover:bg-blush-50">
            <Search size={18} />
          </button>
          <Link to="/wishlist" aria-label="Wishlist" className="relative rounded-full p-2 hover:bg-blush-50">
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button onClick={() => setCartOpen(true)} aria-label="Cart" className="relative rounded-full p-2 hover:bg-blush-50">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <Link to="/account" aria-label="Account" className="hidden rounded-full p-2 hover:bg-blush-50 sm:block">
            <User size={18} />
          </Link>
        </div>
      </div>

      <MegaShell open={!!shopMenu.active} onEnter={shopMenu.keep} onLeave={shopMenu.hide}>
        <ShopMegaMenu categories={categories} onNavigate={shopMenu.close} />
      </MegaShell>

      {mobileMenuOpen && (
        <div className="border-t border-blush-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col divide-y divide-blush-100">
            {[
              ...primaryLinks,
              { label: 'Categories', to: '/shop' },
              { label: 'Track Order', to: '/track-order' },
              ...infoLinks,
              { label: isAnonymous ? 'Sign In / Register' : 'My Account', to: '/account' },
            ].map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMobileMenuOpen(false)} className="py-3 text-sm font-medium text-ink-700 hover:text-brand-600">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
