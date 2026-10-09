export type OrderStatus =
  | 'new' | 'paid' | 'processing' | 'packed' | 'shipped'
  | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'failed' | 'refunded' | 'partially_refunded'
export type PaymentMethod = 'razorpay' | 'cod'

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  video_url: string | null
  sort_order: number
  is_active: boolean
  seo_title: string | null
  seo_description: string | null
}

export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
}

export interface ProductImage {
  id: string
  product_id: string
  variant_id: string | null
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  variant_name: string
  colour: string | null
  size: string | null
  finish: string | null
  price: number | null
  compare_at_price: number | null
  stock_quantity: number
  image_url: string | null
  is_active: boolean
  sort_order: number
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  sku: string
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  cost_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  material: string | null
  colour: string | null
  size: string | null
  weight_grams: number | null
  care_instructions: string | null
  whats_included: string | null
  delivery_info: string | null
  return_eligible: boolean
  cod_available: boolean
  show_purchase_proof: boolean
  online_discount_type: 'amount' | 'percent'
  online_discount_value: number
  cod_advance_type: 'none' | 'amount' | 'percent'
  cod_advance_value: number
  video_url: string | null
  tags: string[]
  is_active: boolean
  is_featured: boolean
  is_new_arrival: boolean
  is_bestseller: boolean
  is_trending: boolean
  is_on_sale: boolean
  rating_avg: number
  rating_count: number
  view_count: number
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  category?: Category | null
  images?: ProductImage[]
  variants?: ProductVariant[]
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  product?: Product
  variant?: ProductVariant | null
}

export interface Cart {
  id: string
  customer_id: string | null
  session_id: string | null
  items: CartItem[]
}

export interface WishlistItem {
  id: string
  customer_id: string | null
  session_id: string | null
  product_id: string
  variant_id: string | null
  product?: Product
}

export interface Address {
  id: string
  customer_id: string
  label: string | null
  full_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  country: string
  is_default_shipping: boolean
  is_default_billing: boolean
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: 'customer' | 'staff' | 'admin'
  avatar_url: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string | null
  sku: string
  image_url: string | null
  unit_price: number
  quantity: number
  line_total: number
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  subtotal: number
  discount_amount: number
  shipping_amount: number
  tax_amount: number
  total_amount: number
  advance_amount: number
  advance_paid: boolean
  coupon_code: string | null
  shipping_address: ShippingAddressJson
  billing_address: ShippingAddressJson | null
  shipping_method: string | null
  shipping_provider: string | null
  tracking_number: string | null
  tracking_url: string | null
  internal_notes: string | null
  placed_at: string
  created_at: string
  items?: OrderItem[]
}

export interface ShippingAddressJson {
  full_name: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state: string
  pincode: string
  country: string
}

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value: number
  max_discount_amount: number | null
  usage_limit: number | null
  usage_limit_per_customer: number
  used_count: number
  first_order_only: boolean
  free_shipping: boolean
  applies_to: 'all' | 'category' | 'product'
  starts_at: string
  ends_at: string | null
  is_active: boolean
}

export interface Review {
  id: string
  product_id: string
  customer_id: string | null
  order_id: string | null
  reviewer_name: string
  rating: number
  title: string | null
  body: string | null
  images: string[]
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
}

export interface Banner {
  id: string
  placement: 'hero'
  title: string | null
  subtitle: string | null
  image_url: string | null
  mobile_image_url: string | null
  link_url: string | null
  cta_text: string | null
  sort_order: number
  is_active: boolean
}

export interface Moment {
  id: string
  label: string
  description: string | null
  image_url: string | null
  link_type: 'product' | 'category' | 'url'
  product_id: string | null
  category_id: string | null
  custom_url: string | null
  sort_order: number
  is_active: boolean
  product?: { slug: string } | null
  category?: { slug: string } | null
}

export interface StaticPage {
  id: string
  slug: string
  title: string
  content: string
  seo_title: string | null
  seo_description: string | null
  updated_at: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  category: string | null
  sort_order: number
  is_active: boolean
}

export interface NavigationItem {
  id: string
  parent_id: string | null
  label: string
  url: string
  sort_order: number
  is_active: boolean
}

export interface Reel {
  id: string
  video_url: string
  poster_url: string | null
  caption: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_name: string
  tags: string[]
  is_published: boolean
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface NavigationItem {
  id: string
  parent_id: string | null
  label: string
  url: string
  sort_order: number
  is_active: boolean
}

export interface StoreSettingsMap {
  store_info: {
    name: string
    tagline: string
    support_email: string
    support_phone: string
    whatsapp_number: string
    address: string
  }
  social_links: { instagram: string; facebook: string; pinterest: string; youtube: string }
  shipping: {
    free_shipping_threshold: number
    standard_shipping_fee: number
    cod_available: boolean
    cod_fee: number
  }
  tax: { gst_percentage: number; prices_include_tax: boolean }
  announcement_bar: { enabled: boolean; speed_seconds: number; items: string[] }
  analytics: { ga4_id: string; meta_pixel_id: string; gsc_verification: string }
  payment_offers: PaymentOffers
}

export interface PaymentOffers {
  online_discount_type: 'amount' | 'percent'
  online_discount_value: number
  cod_advance_type: 'none' | 'amount' | 'percent'
  cod_advance_value: number
}
