// Lets a guest (no session ownership of the order) look up order status without exposing the orders
// table to anonymous SELECTs. Accepts an order number, an email/phone, or both:
//   - both            -> full order (as before)
//   - order number    -> limited public status of that one order (no address / contact details)
//   - email or phone  -> limited status of that contact's recent orders (no address / contact details)
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'

const SELECT = '*, items:order_items(*), history:order_status_history(status, note, created_at)'

// Only what a shopper needs to follow a parcel. Never addresses, phone, email, payment or internal notes.
function limited(order: Record<string, any>) {
  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    placed_at: order.placed_at,
    total_amount: order.total_amount,
    shipping_provider: order.shipping_provider,
    tracking_number: order.tracking_number,
    tracking_url: order.tracking_url,
    items: (order.items ?? []).map((i: any) => ({
      id: i.id,
      product_name: i.product_name,
      variant_name: i.variant_name,
      image_url: i.image_url,
      quantity: i.quantity,
      line_total: i.line_total,
    })),
    history: order.history ?? [],
  }
}

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const body = await req.json()
    const orderNumber = String(body.orderNumber ?? '').trim().toUpperCase()
    const contact = String(body.contact ?? '').trim()
    if (!orderNumber && !contact) return jsonResponse({ error: 'Enter your Order ID or your email' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const notFound = (msg: string) => jsonResponse({ error: msg }, 404)

    // ---- Order ID only
    if (orderNumber && !contact) {
      const { data: order } = await admin.from('orders').select(SELECT).eq('order_number', orderNumber).maybeSingle()
      if (!order) return notFound('Order not found. Check your Order ID and try again.')
      return jsonResponse({ order: limited(order), limited: true })
    }

    // ---- Email / phone only
    if (!orderNumber) {
      const isEmail = contact.includes('@')
      const phone = digits(contact)
      if (!isEmail && phone.length < 10) return jsonResponse({ error: 'Enter a valid email address or 10-digit phone number' }, 400)

      let query = admin.from('orders').select(SELECT).order('placed_at', { ascending: false }).limit(50)
      if (isEmail) {
        // ilike with the wildcard characters escaped, then re-checked exactly below.
        query = query.ilike('guest_email', contact.replace(/[\\%_]/g, (c) => '\\' + c))
      } else {
        query = query.ilike('guest_phone', `%${phone.slice(-10)}`)
      }
      const { data } = await query
      const matches = (data ?? [])
        .filter((o: any) => (isEmail ? String(o.guest_email ?? '').toLowerCase() === contact.toLowerCase() : digits(o.guest_phone).endsWith(phone.slice(-10))))
        // Failed / abandoned online payments are not real orders.
        .filter((o: any) => !(o.payment_method === 'razorpay' && ['pending', 'failed'].includes(o.payment_status)))
        .filter((o: any) => !(o.payment_method === 'cod' && Number(o.advance_amount) > 0 && !o.advance_paid))
        .slice(0, 10)
      if (matches.length === 0) return notFound('No orders found for that email. Check the spelling or try your Order ID.')
      return jsonResponse({ orders: matches.map(limited), limited: true })
    }

    // ---- Both: full details, contact must match
    const { data: order } = await admin.from('orders').select(SELECT).eq('order_number', orderNumber).maybeSingle()
    if (!order) return notFound('Order not found. Check your order number and try again.')

    const normalizedContact = contact.toLowerCase()
    const contactDigits = digits(contact)
    const matchesEmail = order.guest_email?.toLowerCase() === normalizedContact
    const matchesPhone = contactDigits.length >= 10 && digits(order.guest_phone).endsWith(contactDigits.slice(-10))
    const shippingContact = order.shipping_address as { phone?: string }
    const matchesShippingPhone = contactDigits.length >= 10 && digits(shippingContact?.phone).endsWith(contactDigits.slice(-10))

    if (!matchesEmail && !matchesPhone && !matchesShippingPhone) {
      return notFound('Order not found. Check your order number and contact details.')
    }

    return jsonResponse({ order })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
