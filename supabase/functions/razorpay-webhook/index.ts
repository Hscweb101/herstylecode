// Durable source of truth for payment state. Configure this URL as a
// webhook in the Razorpay Dashboard (Settings > Webhooks) subscribed to:
// payment.captured, payment.failed, refund.created, refund.processed.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { jsonResponse } from '../_shared/cors.ts'

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature') ?? ''

    const expected = await hmacHex(webhookSecret, rawBody)
    if (expected !== signature) {
      return jsonResponse({ error: 'Invalid webhook signature' }, 400)
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event as string

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (event === 'payment.captured') {
      const entity = payload.payload.payment.entity
      const { data: payment } = await admin.from('payments').select('*').eq('razorpay_order_id', entity.order_id).maybeSingle()
      if (payment) {
        await admin.from('payments').update({ razorpay_payment_id: entity.id, status: 'captured', raw_response: entity }).eq('id', payment.id)

        const { data: order } = await admin.from('orders').select('*').eq('id', payment.order_id).single()
        if (order && order.payment_status !== 'paid') {
          const { data: items } = await admin.from('order_items').select('product_id, variant_id, quantity').eq('order_id', order.id)
          for (const item of items ?? []) {
            await admin.rpc('decrement_stock', {
              p_product_id: item.product_id,
              p_variant_id: item.variant_id,
              p_qty: item.quantity,
              p_reference_type: 'order_placed',
              p_reference_id: order.id,
            })
          }
          await admin.from('orders').update({ status: 'paid', payment_status: 'paid' }).eq('id', order.id)
          await admin.from('order_status_history').insert({ order_id: order.id, status: 'paid', note: 'Payment captured (webhook)' })
        }
      }
    }

    if (event === 'payment.failed') {
      const entity = payload.payload.payment.entity
      const { data: payment } = await admin.from('payments').select('*').eq('razorpay_order_id', entity.order_id).maybeSingle()
      if (payment) {
        await admin.from('payments').update({ status: 'failed', raw_response: entity }).eq('id', payment.id)
        await admin.from('orders').update({ payment_status: 'failed' }).eq('id', payment.order_id)
      }
    }

    if (event === 'refund.processed' || event === 'refund.created') {
      const entity = payload.payload.refund.entity
      const { data: payment } = await admin.from('payments').select('*').eq('razorpay_payment_id', entity.payment_id).maybeSingle()
      if (payment) {
        const { data: order } = await admin.from('orders').select('*').eq('id', payment.order_id).single()
        if (order) {
          const isFullRefund = entity.amount >= payment.amount * 100
          await admin
            .from('orders')
            .update({ payment_status: isFullRefund ? 'refunded' : 'partially_refunded', status: isFullRefund ? 'refunded' : order.status })
            .eq('id', order.id)
          await admin.from('order_status_history').insert({ order_id: order.id, status: 'refunded', note: `Refund processed via Razorpay (${entity.id})` })

          if (isFullRefund) {
            const { data: items } = await admin.from('order_items').select('product_id, variant_id, quantity').eq('order_id', order.id)
            for (const item of items ?? []) {
              await admin.rpc('restore_stock', {
                p_product_id: item.product_id,
                p_variant_id: item.variant_id,
                p_qty: item.quantity,
                p_reference_type: 'return_restock',
                p_reference_id: order.id,
              })
            }
          }
        }
      }
    }

    return jsonResponse({ received: true })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
