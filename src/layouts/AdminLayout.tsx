import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Ticket, Star, Layers, Settings, LogOut, ExternalLink, Menu, X, Link2, Boxes,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navGroups: { label: string; items: { to: string; label: string; icon: typeof Package; end?: boolean }[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/admin/customers', label: 'Customers', icon: Users },
      { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { to: '/admin/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/navigation', label: 'Bottom Nav Links', icon: Link2 },
    ],
  },
  {
    label: 'Content',
    items: [{ to: '/admin/content', label: 'Content', icon: Layers }],
  },
  {
    label: 'System',
    items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }],
  },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
              >
                <item.icon size={16} /> {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter({ name, onSignOut }: { name?: string | null; onSignOut: () => void }) {
  return (
    <div className="border-t border-gray-200 p-3">
      {name && <p className="mb-1 truncate px-3 text-xs text-gray-500">{name}</p>}
      <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
        <ExternalLink size={16} /> View Store
      </a>
      <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
        <LogOut size={16} /> Log out
      </button>
    </div>
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
    <div className="admin-ui flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
          <img src={logo} alt="HerStyleCode" className="h-10 w-auto object-contain" />
          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700">Admin</span>
        </div>
        <SidebarNav />
        <SidebarFooter name={profile?.full_name} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[82vw] flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
              <img src={logo} alt="HerStyleCode" className="h-9 w-auto object-contain" />
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            <SidebarFooter name={profile?.full_name} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-gray-700 hover:bg-gray-100">
            <Menu size={22} />
          </button>
          <img src={logo} alt="HerStyleCode" className="h-9 w-auto object-contain" />
          <span className="max-w-[28vw] truncate text-xs text-gray-500">{profile?.full_name ?? 'Admin'}</span>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
