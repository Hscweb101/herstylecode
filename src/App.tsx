import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { FullPageSpinner } from '@/components/ui/Misc'
import logo from '@/assets/logo.png'

import StorefrontLayout from '@/layouts/StorefrontLayout'

import Home from '@/pages/storefront/Home'
import Shop from '@/pages/storefront/Shop'
import ProductDetail from '@/pages/storefront/ProductDetail'
import CartPage from '@/pages/storefront/CartPage'
import Checkout from '@/pages/storefront/Checkout'
import OrderConfirmation from '@/pages/storefront/OrderConfirmation'
import TrackOrder from '@/pages/storefront/TrackOrder'
import Wishlist from '@/pages/storefront/Wishlist'
import Account from '@/pages/storefront/Account'
import StaticPage from '@/pages/storefront/StaticPage'
import AboutUs from '@/pages/storefront/AboutUs'
import Faq from '@/pages/storefront/Faq'
import Contact from '@/pages/storefront/Contact'
import Blog from '@/pages/storefront/Blog'
import BlogPost from '@/pages/storefront/BlogPost'
import Login from '@/pages/auth/Login'
import ResetPassword from '@/pages/auth/ResetPassword'

// Admin panel is code-split into its own bundle so shoppers never pay for it.
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'))
const AdminRoute = lazy(() => import('@/routes/AdminRoute'))
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const ProductsList = lazy(() => import('@/pages/admin/ProductsList'))
const ProductForm = lazy(() => import('@/pages/admin/ProductForm'))
const CategoriesAdmin = lazy(() => import('@/pages/admin/CategoriesAdmin'))
const NavigationAdmin = lazy(() => import('@/pages/admin/NavigationAdmin'))
const OrdersList = lazy(() => import('@/pages/admin/OrdersList'))
const OrderDetailAdmin = lazy(() => import('@/pages/admin/OrderDetailAdmin'))
const CustomersAdmin = lazy(() => import('@/pages/admin/CustomersAdmin'))
const CouponsAdmin = lazy(() => import('@/pages/admin/CouponsAdmin'))
const ReviewsAdmin = lazy(() => import('@/pages/admin/ReviewsAdmin'))
const BannersAdmin = lazy(() => import('@/pages/admin/BannersAdmin'))
const ReelsAdmin = lazy(() => import('@/pages/admin/ReelsAdmin'))
const MomentsAdmin = lazy(() => import('@/pages/admin/MomentsAdmin'))
const BlogAdmin = lazy(() => import('@/pages/admin/BlogAdmin'))
const PagesAdmin = lazy(() => import('@/pages/admin/PagesAdmin'))
const SettingsAdmin = lazy(() => import('@/pages/admin/SettingsAdmin'))
const InventoryAdmin = lazy(() => import('@/pages/admin/InventoryAdmin'))

export default function App() {
  const init = useAuthStore((s) => s.init)
  const ready = useAuthStore((s) => s.ready)
  const userId = useAuthStore((s) => s.userId)
  const initCart = useCartStore((s) => s.init)
  const initWishlist = useWishlistStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (userId) {
      initCart(userId)
      initWishlist(userId)
    }
  }, [userId, initCart, initWishlist])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <img src={logo} alt="HerStyleCode" className="h-24 w-auto animate-pulse object-contain md:h-32" />
      </div>
    )
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop mode="all" />} />
          <Route path="/collections/:slug" element={<Shop mode="collection" />} />
          <Route path="/category/:slug" element={<Shop mode="category" />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account/*" element={<Account />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/page/about-us" element={<AboutUs />} />
          <Route path="/page/:slug" element={<StaticPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="navigation" element={<NavigationAdmin />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderDetailAdmin />} />
          <Route path="customers" element={<CustomersAdmin />} />
          <Route path="coupons" element={<CouponsAdmin />} />
          <Route path="reviews" element={<ReviewsAdmin />} />
          <Route path="banners" element={<BannersAdmin />} />
          <Route path="reels" element={<ReelsAdmin />} />
          <Route path="moments" element={<MomentsAdmin />} />
          <Route path="blog" element={<BlogAdmin />} />
          <Route path="pages" element={<PagesAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="inventory" element={<InventoryAdmin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
