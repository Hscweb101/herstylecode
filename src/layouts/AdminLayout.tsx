import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Ticket, Star, Image, Film, Sparkles, Newspaper, FileText, Settings, LogOut, ExternalLink, Menu, X, Link2,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/navigation', label: 'Bottom Nav Links', icon: Link2 },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/reels', label: 'Reels', icon: Film },
  { to: '/admin/moments', label: 'Every Moment', icon: Sparkles },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper },
  { to: '/admin/pages', label: 'Pages', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-blush-50',
              isActive && 'bg-brand-600 text-white hover:bg-brand-600',
            )
          }
        >
          <item.icon size={17} /> {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-blush-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-blush-100 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-blush-100 px-5 py-4">
          <img src={logo} alt="HerStyleCode" className="h-10 w-auto object-contain" />
        </div>
        <SidebarNav />
        <div className="border-t border-blush-100 p-3">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-blush-50">
            <ExternalLink size={17} /> View Store
          </a>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blush-100 px-5 py-4">
              <img src={logo} alt="HerStyleCode" className="h-10 w-auto object-contain" />
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-ink-500 hover:bg-blush-50">
                <X size={20} />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-blush-100 p-3">
              <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-blush-50">
                <ExternalLink size={17} /> View Store
              </a>
              <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={17} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-blush-100 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-ink-700 hover:bg-blush-50">
            <Menu size={22} />
          </button>
          <img src={logo} alt="HerStyleCode" className="h-9 w-auto object-contain" />
          <span className="max-w-[30vw] truncate text-xs text-ink-500">{profile?.full_name ?? 'Admin'}</span>
        </header>
        <main className="p-4 sm:p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
