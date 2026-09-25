# HerStyleCode — E-Commerce Platform

A full-stack, mobile-first jewellery e-commerce website with a complete admin panel, built for HerStyleCode.

**Live demo Supabase project:** `herstylecode` (see `SUPABASE_TRANSFER.md` to move this to the client's own account/org).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (custom brand theme) |
| Routing | React Router v7 |
| State | Zustand (cart, wishlist, auth, UI) |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Payments | Razorpay (Checkout.js + server-side order verification) |
| Fonts | Playfair Display, Cormorant Garamond, Poppins (self-hosted via `@fontsource`) |

## Project Structure

```
src/
  assets/            Brand logo
  components/
    ui/              Generic UI kit (Button, Input, Badge, etc.)
    storefront/      Header, Footer, ProductCard, CartDrawer, SearchOverlay...
    admin/           Shared admin UI (Table, Card, ConfirmModal...)
  hooks/             useStoreSettings, useCategories
  layouts/           StorefrontLayout, AdminLayout
  lib/               supabase client, queries, razorpay helper, utils
  pages/
    storefront/      Home, Shop, ProductDetail, Cart, Checkout, Account...
    admin/           Dashboard, ProductForm, OrdersList, Settings...
    auth/            Customer Login/Signup
  routes/            AdminRoute guard
  store/             authStore, cartStore, wishlistStore, uiStore
  types/             Shared TypeScript types matching the DB schema

supabase/
  migrations/        Full SQL schema, RLS policies, functions (0001-0010)
  functions/         Edge Functions: checkout-create-order, verify-razorpay-payment,
                     razorpay-webhook, track-order

documentation/       You are here
```

## Getting Started (local development)

```bash
npm install
cp .env.example .env.local   # already filled in for the current Supabase project
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

See `.env.example` at the project root and `ENV_VARS.md` in this folder for a full explanation of every variable, including which are safe to expose to the browser and which must stay server-side only.

## Key Design Decisions

- **No password required for browsing.** Every visitor is automatically signed in as a real (but anonymous) Supabase Auth user the moment they load the site. This gives every guest a proper database identity so their cart/wishlist are protected by the same Row Level Security rules as a registered customer, without forcing signup. When a guest creates an account, their existing anonymous session is *upgraded in place* — their cart, wishlist, and orders carry over automatically.
- **Prices are never trusted from the browser.** The `checkout-create-order` Edge Function re-reads every product/variant price from the database before creating an order, so a tampered client request can never under-charge a customer.
- **Stock can never oversell.** Inventory decrements happen inside a single atomic Postgres function (`decrement_stock`) that only succeeds if enough stock exists, called either at COD order time or after payment is verified.
- **Coupons are never exposed to the public.** The `coupons` table has no public read policy; codes are validated through a `validate_coupon()` Postgres function that only returns whether a code is valid and its discount — never the full coupon list.

## What's Included vs. What Needs Your Own Accounts

See `PROJECT_STATUS.md` for the full checklist against the original requirements document, including which items are fully built, which are wired up but need your own third-party credentials (Razorpay live keys, Shiprocket, WhatsApp Business API, etc.), and which are intentionally deferred (P2 items per the original brief).
