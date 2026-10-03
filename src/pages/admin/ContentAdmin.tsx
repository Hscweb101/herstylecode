import { Suspense, lazy } from 'react'
import { NavLink, Navigate, useParams } from 'react-router-dom'
import { Image, Film, Sparkles, Newspaper, FileText } from 'lucide-react'
import { FullPageSpinner } from '@/components/ui/Misc'
import { cn } from '@/lib/utils'

const BannersAdmin = lazy(() => import('@/pages/admin/BannersAdmin'))
const ReelsAdmin = lazy(() => import('@/pages/admin/ReelsAdmin'))
const MomentsAdmin = lazy(() => import('@/pages/admin/MomentsAdmin'))
const BlogAdmin = lazy(() => import('@/pages/admin/BlogAdmin'))
const PagesAdmin = lazy(() => import('@/pages/admin/PagesAdmin'))

const TABS = [
  { key: 'banners', label: 'Banners', icon: Image, Component: BannersAdmin },
  { key: 'reels', label: 'Reels', icon: Film, Component: ReelsAdmin },
  { key: 'moments', label: 'Every Moment', icon: Sparkles, Component: MomentsAdmin },
  { key: 'blog', label: 'Blog', icon: Newspaper, Component: BlogAdmin },
  { key: 'pages', label: 'Pages', icon: FileText, Component: PagesAdmin },
]

/** One "Content" section in the sidebar with a tab per content type. */
export default function ContentAdmin() {
  const { tab } = useParams()
  const active = TABS.find((t) => t.key === tab)
  if (!active) return <Navigate to="/admin/content/banners" replace />
  const { Component } = active

  return (
    <div>
      <div className="-mx-4 mb-5 overflow-x-auto border-b border-gray-200 px-4 sm:mx-0 sm:px-0">
        <nav className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <NavLink
              key={t.key}
              to={`/admin/content/${t.key}`}
              className={({ isActive }) =>
                cn(
                  '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800',
                )
              }
            >
              <t.icon size={15} /> {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Suspense fallback={<FullPageSpinner />}>
        <Component />
      </Suspense>
    </div>
  )
}
