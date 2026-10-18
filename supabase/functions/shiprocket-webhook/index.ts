// Shiprocket > Settings > API > Webhooks: set this function's URL and put the
// same value as SHIPROCKET_WEBHOOK_TOKEN in the "x-api-key" header field.
// Deploy with --no-verify-jwt (Shiprocket cannot send a Supabase JWT).
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { jsonResponse } from '../_shared/cors.ts'

const STATUS_MAP: Record<string, string> = {
  'PICKED UP': 'shipped', 'IN TRANSIT': 'shipped', 'SHIPPED': 'shipped',
  'OUT FOR DELIVERY': 'out_for_delivery', 'DELIVERED': 'delivered',
  'RTO DELIVERED': 'returned', 'CANCELED': 'cancelled', 'CANCELLED': 'cancelled',
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  if (req.headers.get('x-api-key') !== Deno.env.get('SHIPROCKET_WEBHOOK_TOKEN')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    const p = await req.json()
    const awb = p.awb as string | undefined
    const next = STATUS_MAP[String(p.current_status ?? '').toUpperCase()]
    if (!awb || !next) return jsonResponse({ ok: true, ignored: true })

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order } = await admin.from('orders').select('id, status').eq('tracking_number', awb).maybeSingle()
    if (order && order.status !== next) {
      await admin.from('orders').update({ status: next }).eq('id', order.id)
      await admin.from('order_status_history').insert({ order_id: order.id, status: next, note: `Shiprocket: ${p.current_status}` })
    }
    return jsonResponse({ ok: true })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as Error).message }, 500)
  }
})
