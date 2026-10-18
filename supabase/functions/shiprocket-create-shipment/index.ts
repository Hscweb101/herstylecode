// Two steps, chosen with `mode`:
//   'push' - creates the order inside Shiprocket only. No courier is booked, nothing is charged.
//   'ship' - (default) books a courier / AWB (this is what charges the Shiprocket wallet),
//            creating the Shiprocket order first if it was not pushed yet.
// Auto calls (from checkout/payment functions) are always 'push'.
// Callers: an admin (button / bulk action), or our own checkout/payment functions
// with the service-role key and { auto: true } right after an order is confirmed.
// Deploy with --no-verify-jwt: authorisation is checked below.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { shiprocket, shiprocketToken } from '../_shared/shiprocket.ts'

Deno.serve(async (req) => {
  const opt = handleOptions(req)
  if (opt) return opt

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey)
  let auto = false
  let claimedId: string | null = null
  let orderStatus = 'new'

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const isService = authHeader.replace(/^Bearer\s+/i, '') === serviceKey
    if (!isService) {
      const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
      const { data: isAdmin } = await caller.rpc('is_admin')
      if (!isAdmin) return jsonResponse({ error: 'Admins only' }, 403)
    }

    const { order_id, weight, length, breadth, height, auto: autoFlag, mode: modeIn } = await req.json()
    auto = isService && !!autoFlag
    const mode: 'push' | 'ship' = auto || modeIn === 'push' ? 'push' : 'ship'

    if (auto) {
      const { data: setting } = await admin.from('store_settings').select('value').eq('key', 'shiprocket').maybeSingle()
      if (!(setting?.value as { auto_ship?: boolean } | undefined)?.auto_ship) return jsonResponse({ skipped: 'auto shipping is off' })
      // Claim the order so the payment-verify call and the webhook cannot both create a shipment.
      const { data: claimed } = await admin
        .from('orders')
        .update({ shiprocket_order_id: 'creating' })
        .eq('id', order_id)
        .is('shiprocket_order_id', null)
        .is('tracking_number', null)
        .select('id')
      if (!claimed?.length) return jsonResponse({ skipped: 'already handled' })
      claimedId = order_id
    }

    const { data: order } = await admin.from('orders').select('*, items:order_items(*)').eq('id', order_id).single()
    if (!order) return jsonResponse({ error: 'Order not found' }, 404)
    orderStatus = order.status
    if (order.tracking_number) return jsonResponse({ error: 'This order already has a shipment' }, 400)
    if (mode === 'push' && order.shiprocket_shipment_id) {
      if (auto) await admin.from('orders').update({ shiprocket_order_id: order.shiprocket_order_id }).eq('id', order_id)
      return jsonResponse({ pushed: true, already: true })
    }
    if (auto && ['cancelled', 'returned', 'refunded', 'delivered'].includes(order.status)) {
      await admin.from('orders').update({ shiprocket_order_id: null }).eq('id', order_id)
      return jsonResponse({ skipped: 'order not shippable' })
    }

    const a = order.shipping_address as Record<string, string>
    const isCod = order.payment_method === 'cod'
    const collect = isCod ? Math.max(0, Number(order.total_amount) - (order.advance_paid ? Number(order.advance_amount) : 0)) : 0
    const [first, ...rest] = String(a.full_name ?? order.guest_name ?? '').trim().split(' ')

    const token = await shiprocketToken()
    let shipmentId: string | number | undefined = order.shiprocket_shipment_id ?? undefined
    let srOrderId: string | number | undefined = order.shiprocket_shipment_id ? order.shiprocket_order_id : undefined
    if (!shipmentId) {
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
      shipmentId = created.shipment_id
      srOrderId = created.order_id
      await admin.from('orders').update({
        shiprocket_order_id: String(srOrderId), shiprocket_shipment_id: String(shipmentId),
      }).eq('id', order.id)
    }

    if (mode === 'push') {
      return jsonResponse({ pushed: true, shiprocket_order_id: String(srOrderId) })
    }

    // Shiprocket's own auto-pick can fail (e.g. a courier out of AWB numbers), so try
    // the recommended courier first and then every other serviceable one.
    const svc = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?order_id=${srOrderId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ).then((r) => r.json()).catch(() => ({}))
    const couriers: { courier_company_id: number }[] = svc.data?.available_courier_companies ?? []
    const recommended = svc.data?.recommended_courier_company_id
    const ids = [...new Set([recommended, ...couriers.map((c) => c.courier_company_id)].filter(Boolean))]

    let awbData: Record<string, string> = {}
    let lastErr = ''
    for (const id of [undefined, ...ids].slice(0, 8)) {
      const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(id ? { shipment_id: shipmentId, courier_id: id } : { shipment_id: shipmentId }),
      }).then((r) => r.json()).catch(() => ({}))
      const d = res.response?.data
      if (d && typeof d === 'object' && d.awb_code) { awbData = d; break }
      lastErr = typeof d === 'string' ? d : (res.message ?? lastErr)
    }
    const awb = awbData.awb_code as string | undefined
    if (!awb) throw new Error(`No courier could be assigned. Shiprocket says: ${lastErr || 'check wallet balance / serviceability'}`)

    let label: string | null = null
    try {
      const l = await shiprocket(token, '/courier/generate/label', { shipment_id: [shipmentId] })
      label = l.label_url ?? null
    } catch (e) {
      console.error('label failed', e)
    }

    await admin.from('orders').update({
      shiprocket_order_id: String(srOrderId),
      shiprocket_shipment_id: String(shipmentId),
      shipping_provider: awbData.courier_name ?? 'Shiprocket',
      tracking_number: awb,
      tracking_url: `https://shiprocket.co/tracking/${awb}`,
      shipping_label_url: label,
      status: ['new', 'paid', 'processing', 'packed'].includes(order.status) ? 'packed' : order.status,
    }).eq('id', order.id)
    await admin.from('order_status_history').insert({
      order_id: order.id, status: 'packed', note: `Shiprocket shipment created, AWB ${awb}`,
    })

    return jsonResponse({ awb, courier: awbData.courier_name, label_url: label })
  } catch (err) {
    console.error(err)
    const message = (err as Error).message ?? 'Unexpected error'
    if (claimedId) {
      // Release the claim (unless a Shiprocket order now exists) and leave a visible note for the admin.
      const { data: o } = await admin.from('orders').select('shiprocket_order_id, shiprocket_shipment_id').eq('id', claimedId).single()
      if (o && !o.shiprocket_shipment_id) await admin.from('orders').update({ shiprocket_order_id: null }).eq('id', claimedId)
      await admin.from('order_status_history').insert({ order_id: claimedId, status: orderStatus, note: `Could not send to Shiprocket automatically: ${message}. Use "Send to Shiprocket" to retry.` })
    }
    return jsonResponse({ error: message }, auto ? 200 : 422)
  }
})
