import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from '@/components/storefront/Header'
import { CategoryNav } from '@/components/storefront/CategoryNav'
import { BlogTeaser, Footer } from '@/components/storefront/Footer'
import { CartDrawer } from '@/components/storefront/CartDrawer'
import { SearchOverlay } from '@/components/storefront/SearchOverlay'
import { WhatsappButton } from '@/components/storefront/WhatsappButton'

export default function StorefrontLayout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <CategoryNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <BlogTeaser />
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <WhatsappButton />
    </div>
  )
}
