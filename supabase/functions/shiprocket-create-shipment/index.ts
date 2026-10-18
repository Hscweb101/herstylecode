// Admin-only. Creates a Shiprocket order for one of our orders, assigns the
// recommended courier (AWB) and saves tracking details on the order.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { shiprocket, shiprocketToken } from '../_shared/shiprocket.ts'

Deno.serve(async (req) => {
  const opt = handleOptions(req)
  if (opt) return opt

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: isAdmin } = await caller.rpc('is_admin')
    if (!isAdmin) return jsonResponse({ error: 'Admins only' }, 403)

    const { order_id, weight, length, breadth, height } = await req.json()
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order } = await admin.from('orders').select('*, items:order_items(*)').eq('id', order_id).single()
    if (!order) return jsonResponse({ error: 'Order not found' }, 404)
    if (order.tracking_number) return jsonResponse({ error: 'This order already has a shipment' }, 400)

    const a = order.shipping_address as Record<string, string>
    const isCod = order.payment_method === 'cod'
    const collect = isCod ? Math.max(0, Number(order.total_amount) - (order.advance_paid ? Number(order.advance_amount) : 0)) : 0
    const [first, ...rest] = String(a.full_name ?? order.guest_name ?? '').trim().split(' ')

    const token = await shiprocketToken()
    const created = await shiprocket(token, '/orders/create/adhoc', {
      order_id: order.order_number,
      order_date: new Date(order.placed_at).toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: Deno.env.get('SHIPROCKET_PICKUP_LOCATION'),
      billing_customer_name: first,
      billing_last_name: rest.join(' '),
      billing_address: a.line1,
      billing_address_2: a.line2 ?? '',
      billing_city: a.city,
      billing_pincode: a.pincode,
      billing_state: a.state,
      billing_country: a.country || 'India',
      billing_email: order.guest_email ?? '',
      billing_phone: a.phone,
      shipping_is_billing: true,
      order_items: order.items.map((i: Record<string, unknown>) => ({
        name: i.product_name, sku: i.sku, units: i.quantity, selling_price: i.unit_price,
      })),
      payment_method: isCod ? 'COD' : 'Prepaid',
      sub_total: isCod ? collect : order.total_amount,
      length: length ?? 15, breadth: breadth ?? 10, height: height ?? 5, weight: weight ?? 0.3,
    })

    const awbRes = await shiprocket(token, '/courier/assign/awb', { shipment_id: created.shipment_id })
    const awbData = awbRes.response?.data ?? {}
    const awb = awbData.awb_code as string | undefined
    if (!awb) {
      await admin.from('orders').update({
        shiprocket_order_id: String(created.order_id), shiprocket_shipment_id: String(created.shipment_id),
      }).eq('id', order.id)
      return jsonResponse({ error: 'Shiprocket order created but no courier could be assigned (check wallet balance / serviceability in the Shiprocket panel).' }, 422)
    }

    let label: string | null = null
    try {
      const l = await shiprocket(token, '/courier/generate/label', { shipment_id: [created.shipment_id] })
      label = l.label_url ?? null
    } catch (e) {
      console.error('label failed', e)
    }

    await admin.from('orders').update({
      shiprocket_order_id: String(created.order_id),
      shiprocket_shipment_id: String(created.shipment_id),
      shipping_provider: awbData.courier_name ?? 'Shiprocket',
      tracking_number: awb,
      tracking_url: `https://shiprocket.co/tracking/${awb}`,
      shipping_label_url: label,
      status: ['new', 'paid', 'processing', 'packed'].includes(order.status) ? 'packed' : order.status,
    }).eq('id', order.id)
    await admin.from('order_status_history').insert({ order_id: order.id, status: 'packed', note: `Shiprocket shipment created, AWB ${awb}` })

    return jsonResponse({ awb, courier: awbData.courier_name, label_url: label })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
