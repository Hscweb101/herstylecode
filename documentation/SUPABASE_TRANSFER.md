# Transferring the Supabase Project to the Client

The website currently runs on a Supabase project named **`herstylecode`** inside the developer's personal Supabase organization (`Adarsh Tiwari`, free plan). Supabase has a **built-in, official "Transfer project" feature** that moves the entire project — database, all data, Storage buckets/files, Auth users, and Edge Functions — to a different organization with zero code changes and (typically) zero downtime. This is the recommended and only supported way to hand over ownership; do **not** try to manually dump/restore the database for this purpose.

## Prerequisites

1. The client must create their own Supabase account at [supabase.com](https://supabase.com) (free plan is fine to start).
2. The client's Supabase account must be added as a **member of the developer's organization** (or vice versa) temporarily, because Supabase requires the initiator to be a member of *both* the source and destination organizations to authorize a transfer. This is a one-time step and the developer can be removed from the client's organization immediately afterward.

## Steps

1. Log in to [supabase.com/dashboard](https://supabase.com/dashboard) as the developer.
2. Open the **`herstylecode`** project → **Settings → General**.
3. Under **Transfer project**, click **Transfer project**.
4. Select the client's organization as the destination and confirm.
5. Supabase moves the project (this can take a few minutes). The project keeps the **same project URL, API keys, and database** — nothing in the codebase or `.env` files needs to change.
6. Once transferred, the client's organization owns billing for the project going forward (Supabase's free tier covers this store comfortably at launch; upgrade only if traffic/storage grows past free-tier limits).
7. Remove the developer's access from the client's organization if it was only added for the transfer.

Official reference: Supabase Dashboard → Project Settings → General → "Transfer project" (also documented at supabase.com/docs under Project Management).

## After the transfer — what the client should immediately do

- **Rotate the database password** (Settings → Database → Reset database password) since the developer knew the original one during setup. Update `SUPABASE_DB_URL` in any local `.env.local` files if the client's team uses direct DB access.
- **Rotate the `service_role` key is not directly possible**, but you can regenerate all API keys from Settings → API Keys if there's any concern the developer retained a copy. If you do, update the Edge Function secrets (`supabase secrets set ...`) and the hosting provider's environment variables to match.
- **Change the admin panel password** for the bootstrap admin account created during setup (see `ADMIN_GUIDE.md`), or create a new admin user with the client's own email and demote/delete the developer's admin account.
- **Add the client's real Razorpay live keys** (see `RAZORPAY_SETUP.md`) — the store currently runs on Razorpay **test mode** placeholders.

## No vendor lock-in

Every table can be exported at any time via the Supabase dashboard's **Table Editor → Export as CSV**, or a full database dump via **Database → Backups**. Product data, orders, and customers are all in standard Postgres tables with no proprietary format — this is a genuine, portable Postgres database the client fully owns after transfer.
