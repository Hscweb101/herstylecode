# Admin Panel Guide

## Logging in

Go to `/admin/login` (e.g. `https://yourdomain.com/admin/login`).

**Initial admin account created during setup:**

- Email: `tiwariadarsh9910@gmail.com`
- Password: shared privately at handover (not stored in this repository)

**Change this password immediately after your first login** (or delete this account and create your own — see "Managing admin users" below), especially before handing the site over to anyone else.

## Managing admin users

There's no dedicated "create admin" screen yet (it's a P2 nice-to-have, not required for launch). To promote someone to admin/staff:

1. Have them sign up as a normal customer on the storefront (`/login`), or create the account via Supabase Dashboard → Authentication → Users → Add User.
2. In Supabase Dashboard → Table Editor → `profiles`, find their row and change `role` from `customer` to `admin` (full access) or `staff` (same access currently — the schema supports differentiating staff permissions later if needed).

## What each section does

- **Dashboard** — total sales (paid orders only), order/product/customer counts, low-stock alert count, recent orders.
- **Products** — create, edit, duplicate, delete. Each product supports multiple images (drag-free upload, click the star to set the primary image), variants (Gold/Silver/Size with their own SKU, price and stock), full specs, care instructions, and visibility flags (Featured, New Arrival, Best Seller, Trending, On Sale).
- **Categories** — the 7 categories from the sitemap are pre-loaded (Earrings, Necklaces, Rings, Bracelets & Bangles, Jewellery Sets, Hair Accessories, Other Accessories). Add, rename, reorder, or hide any of them.
- **Orders** — search by order number/phone/email, filter by status, export the filtered list to CSV (failed or abandoned online payments are hidden by default — pick "Failed / Unpaid (online)" in the status filter to see them), and open any order to update its status (New → Paid → Processing → Packed → Shipped → Out for Delivery → Delivered, or Cancelled/Returned/Refunded), add a courier tracking number/link, write internal notes, and print a simple invoice. A trash icon on each row permanently deletes an order (asks for confirmation first).
- **Customers** — everyone who has registered or placed at least one order. A trash icon on each row deletes the customer's account, addresses, cart and wishlist after confirmation; their past orders are kept (shown as guest orders). Admin/staff accounts cannot be deleted here.
- **Coupons** — percentage or fixed-amount discounts, minimum order value, max discount cap, total and per-customer usage limits, first-order-only, free shipping, start/end dates.
- **Reviews** — approve or delete (with confirmation) customer reviews before they appear on product pages (moderation queue defaults to "Pending").
- **Banners** — upload the homepage hero image, an offer/sale banner, or category banners; set the link it points to and the button text.
- **Pages** — edit the content of every legal/info page (About, Shipping Policy, Returns & Refund, Cancellation, Privacy, Terms, Jewellery Care Guide, Contact) as HTML, and manage the FAQ list.
- **Inventory** — see current stock for every product, apply manual +/- adjustments (e.g. after a physical stock count), and view a running history of every stock change (order placed, cancelled, manual adjustment).
- **Settings** — store name/tagline/contact details, social links, free-shipping threshold & standard shipping fee, Cash-on-Delivery toggle, GST percentage, homepage announcement bar text, and Analytics IDs (GA4, Meta Pixel, Search Console verification — see note below).

## Analytics setup (GA4 / Meta Pixel)

The Settings page has fields to store your GA4 Measurement ID and Meta Pixel ID. As shipped, these are stored but **not yet wired into page tracking code** — connecting them (loading `gtag.js`/`fbq` and firing `purchase`, `add_to_cart`, `begin_checkout`, `view_item` events) is a short, well-defined follow-up task once you have real GA4/Pixel IDs to test against, intentionally left for after you've decided on your analytics/marketing setup.

## Shiprocket / courier integration

The Orders page lets you manually enter a shipping provider name, tracking number, and tracking URL per order — this covers "customer-facing order tracking" today without requiring a courier account. A live Shiprocket (or similar) API integration for automatic label generation is a distinct piece of work that needs your Shiprocket account credentials first; the `shipping_provider` / `tracking_number` / `tracking_url` fields already exist on every order specifically so that integration can be added later without a schema change.
