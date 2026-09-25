// Lets a guest (no session ownership of the order) look up order status by
// order number + the phone/email used at checkout, without exposing the
// orders table to anonymous SELECTs.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions, jsonResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const { orderNumber, contact } = await req.json()
    if (!orderNumber || !contact) return jsonResponse({ error: 'Order number and phone/email are required' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: order } = await admin
      .from('orders')
      .select('*, items:order_items(*), history:order_status_history(status, note, created_at)')
      .eq('order_number', orderNumber.trim().toUpperCase())
      .maybeSingle()

    if (!order) return jsonResponse({ error: 'Order not found. Check your order number and try again.' }, 404)

    const normalizedContact = contact.trim().toLowerCase()
    const matchesEmail = order.guest_email?.toLowerCase() === normalizedContact
    const matchesPhone = order.guest_phone?.replace(/\D/g, '').endsWith(contact.replace(/\D/g, ''))
    const shippingContact = order.shipping_address as { phone?: string }
    const matchesShippingPhone = shippingContact?.phone?.replace(/\D/g, '').endsWith(contact.replace(/\D/g, ''))

    if (!matchesEmail && !matchesPhone && !matchesShippingPhone) {
      return jsonResponse({ error: 'Order not found. Check your order number and contact details.' }, 404)
    }

    return jsonResponse({ order })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
