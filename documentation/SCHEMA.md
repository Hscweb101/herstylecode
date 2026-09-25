# Database Schema

All schema is defined as plain, numbered SQL migration files in `supabase/migrations/`. They are idempotent-by-design (run once, in order, against a fresh database) and are the single source of truth — this document explains *why* things are shaped the way they are.

## Entity Overview

```
categories (self-referencing, for subcategories)
  └─ products
       ├─ product_images (per-product or per-variant)
       ├─ product_variants (Gold/Silver/Size options, own SKU + stock)
       ├─ inventory_history (audit log of every stock change)
       └─ reviews

collections (New Arrivals, Best Sellers, Trending, Sale, + custom)
  └─ product_collections (many-to-many join)

profiles (1:1 with auth.users; created automatically on signup, incl. anonymous)
  ├─ addresses
  ├─ carts → cart_items
  ├─ wishlists
  └─ orders
       ├─ order_items (snapshot of product/price at time of order — immutable)
       ├─ order_status_history (audit trail)
       └─ payments (Razorpay order/payment IDs, signature, status)

coupons → coupon_usages (per-customer usage tracking)

banners / static_pages / faqs / navigation_items / store_settings   (CMS, admin-editable)
newsletter_subscribers / contact_messages                            (lead capture)
```

## Why `profiles` instead of using `auth.users` directly

Supabase's `auth.users` table is not exposed to the client (PostgREST doesn't serve it). `profiles.id` mirrors `auth.users.id` 1:1 and is created automatically by the `handle_new_user()` trigger the moment any account is created — including anonymous sessions. `profiles.role` (`customer` / `staff` / `admin`) is what the app and every RLS policy check to decide access.

## Orders are never written directly by the browser

`orders`, `order_items` and `payments` all have RLS policies that only allow `INSERT`/`UPDATE` from the **admin** role. The only way an order is created is through the `checkout-create-order` Edge Function, which runs with the `service_role` key (bypassing RLS) after re-validating every price and stock level server-side. This is the standard, safe pattern for e-commerce on Supabase — it means a malicious client can never fabricate a ₹1 order for a ₹5,000 item.

## Stock control

Two Postgres functions are the *only* way stock quantities change:

- `decrement_stock(product_id, variant_id, qty, reference_type, reference_id)` — uses a conditional `UPDATE ... WHERE stock_quantity >= qty` so it is atomic and safe under concurrent orders; raises an exception (which the caller handles) if there isn't enough stock.
- `restore_stock(...)` — used for cancellations and returns.

Every call is logged to `inventory_history`, which powers the admin Inventory page's audit trail.

## Coupon validation without leaking codes

`coupons` has no public `SELECT` policy at all. Instead, `validate_coupon(code, subtotal, customer_id, guest_email)` is a `SECURITY DEFINER` Postgres function, callable by anyone, that checks: active window (`starts_at`/`ends_at`), minimum order value, total usage limit, per-customer usage limit (via `coupon_usages`), and first-order-only eligibility — returning only a valid/invalid result and the discount math, never the underlying table.

## Row Level Security summary

| Table | Public (anon/authenticated) | Admin/Staff |
|---|---|---|
| products, categories, collections, variants, images, banners, static_pages, faqs, navigation, store_settings | Read active rows only | Full CRUD |
| profiles, addresses, carts, cart_items, wishlists | Owner only (`id = auth.uid()`) | Full access |
| orders, order_items, order_status_history, payments | Owner can `SELECT` their own; no direct writes | Full CRUD |
| coupons, coupon_usages | No direct access (see `validate_coupon`) | Full CRUD |
| reviews | Public reads approved reviews; owner can insert/edit their own (unapproved) | Full CRUD (approve/delete) |
| newsletter_subscribers, contact_messages | Insert only | Read/manage |
| inventory_history | No public access | Read/manage |

`is_admin()` is a small `SECURITY DEFINER` helper function used throughout the policies — it checks `profiles.role in ('admin','staff')` for `auth.uid()`.

## Anonymous auth and guest checkout

Supabase's **Anonymous Sign-ins** feature is enabled on this project. Every visitor gets a real `auth.uid()` (with an `authenticated` JWT role, `is_anonymous: true`) the instant they load the site — before they ever interact with the store. This means:

- Guest carts/wishlists are protected by the exact same `customer_id = auth.uid()` RLS policies as logged-in customers — no special-cased, weaker security path for guests.
- A "guest" checkout still sets `orders.customer_id` to that anonymous user's ID, so `track-order` and admin tooling can associate orders correctly, while `guest_name` / `guest_email` / `guest_phone` capture the contact details actually entered at checkout.
- When someone signs up with email/password, `supabase.auth.updateUser()` upgrades the *same* anonymous account in place — their existing cart, wishlist and any prior guest orders carry over under the same `customer_id`, seamlessly becoming "their" account.

## Extending the schema

If you add new tables, follow the existing pattern: enable RLS immediately, add explicit policies (never leave a table with RLS enabled and zero policies — that silently blocks all access, including the admin), and add an `updated_at` trigger using the existing `public.set_updated_at()` function if the table needs one.
