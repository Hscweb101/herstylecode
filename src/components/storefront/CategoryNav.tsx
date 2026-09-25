import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useNavigationItems } from '@/hooks/useNavigationItems'
import { CategoryMegaMenu, MegaShell } from '@/components/storefront/MegaMenu'
import { useHoverMenu } from '@/hooks/useHoverMenu'
import { cn } from '@/lib/utils'

export function CategoryNav() {
  const { categories } = useCategories()
  const { items: allNavLinks } = useNavigationItems()
  const { active, show, hide, keep, close } = useHoverMenu<string>()
  // Only "quick filter" links (e.g. Under ₹399 -> /shop?maxPrice=399) belong in this bar —
  // other navigation_items rows are a separate, unrelated menu and are ignored here.
  const navLinks = allNavLinks.filter((l) => !l.parent_id && l.url.startsWith('/shop?'))
  const topLevel = categories.filter((c) => !c.parent_id)

  // Keep the last opened category's content mounted while the panel fades out.
  const [lastId, setLastId] = useState<string | null>(null)
  const activeCategory = topLevel.find((c) => c.id === active) ?? null
  const shown = activeCategory ?? topLevel.find((c) => c.id === lastId) ?? null

  if (topLevel.length === 0 && navLinks.length === 0) return null

  return (
    <div className="sticky top-0 z-30 hidden border-b border-blush-100 bg-white/95 backdrop-blur md:block" onMouseLeave={hide}>
      <div className="mx-auto max-w-7xl px-8">
        <nav className="flex items-center justify-center gap-8">
          {topLevel.map((c) => {
            const isActive = active === c.id
            return (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                onMouseEnter={() => {
                  setLastId(c.id)
                  show(c.id)
                }}
                onFocus={() => {
                  setLastId(c.id)
                  show(c.id)
                }}
                onClick={close}
                aria-expanded={isActive}
                className={cn(
                  'relative flex items-center gap-1 py-2.5 text-sm font-medium tracking-wide transition-colors',
                  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-500 after:transition-transform after:duration-300',
                  isActive ? 'text-brand-600 after:scale-x-100' : 'text-ink-700 hover:text-brand-600',
                )}
              >
                {c.name}
                <ChevronDown size={12} className={cn('transition-transform duration-200', isActive && 'rotate-180')} />
              </Link>
            )
          })}

          {navLinks.map((link) => (
            <Link
              key={link.id}
              to={link.url}
              onMouseEnter={hide}
              className="flex items-center py-2.5 text-sm font-semibold tracking-wide text-brand-600 transition-colors hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <MegaShell open={!!activeCategory} onEnter={keep} onLeave={hide}>
        {shown && (
          <CategoryMegaMenu category={shown} subcategories={categories.filter((c) => c.parent_id === shown.id)} onNavigate={close} />
        )}
      </MegaShell>
    </div>
  )
}
