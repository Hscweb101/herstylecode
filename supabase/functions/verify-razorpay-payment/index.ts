// Verifies a Razorpay checkout signature and finalizes the order.
// This is the "fast path" for immediate UI feedback; the razorpay-webhook
// function is the durable source of truth in case this call never lands
// (browser closed mid-redirect, network drop, etc).
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions, jsonResponse } from '../_shared/cors.ts'

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const admin = createClient(supabaseUrl, serviceKey)

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json()
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    const expectedSignature = await hmacHex(razorpayKeySecret, `${razorpayOrderId}|${razorpayPaymentId}`)
    const isValid = expectedSignature === razorpaySignature

    const { data: payment } = await admin.from('payments').select('*').eq('razorpay_order_id', razorpayOrderId).maybeSingle()

    if (!isValid) {
      if (payment) await admin.from('payments').update({ status: 'failed', razorpay_payment_id: razorpayPaymentId }).eq('id', payment.id)
      await admin.from('orders').update({ payment_status: 'failed' }).eq('id', orderId)
      return jsonResponse({ error: 'Signature verification failed' }, 400)
    }

    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single()
    if (!order) return jsonResponse({ error: 'Order not found' }, 404)

    // Partial COD: the online payment is only the advance. The rest is collected on delivery.
    const isCodAdvance = order.payment_method === 'cod' && Number(order.advance_amount) > 0
    const alreadyDone = isCodAdvance ? order.advance_paid : order.payment_status === 'paid'

    // Idempotent: if already handled (e.g. webhook beat us to it), just return success.
    if (!alreadyDone) {
      const { data: items } = await admin.from('order_items').select('product_id, variant_id, quantity').eq('order_id', orderId)
      for (const item of items ?? []) {
        const { error: stockError } = await admin.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_variant_id: item.variant_id,
          p_qty: item.quantity,
          p_reference_type: 'order_placed',
          p_reference_id: orderId,
        })
        if (stockError) console.error('Stock decrement failed', stockError.message)
      }

      if (isCodAdvance) {
        const balance = Number(order.total_amount) - Number(order.advance_amount)
        await admin.from('orders').update({ status: 'new', payment_status: 'partially_paid', advance_paid: true }).eq('id', orderId)
        await admin.from('order_status_history').insert({
          order_id: orderId,
          status: 'new',
          note: `COD advance of Rs ${order.advance_amount} paid via Razorpay. Rs ${balance} to collect on delivery`,
        })
      } else {
        await admin.from('orders').update({ status: 'paid', payment_status: 'paid' }).eq('id', orderId)
        await admin.from('order_status_history').insert({ order_id: orderId, status: 'paid', note: 'Payment verified via Razorpay' })
      }

      if (order.customer_id) {
        const { data: cart } = await admin.from('carts').select('id').eq('customer_id', order.customer_id).maybeSingle()
        if (cart) await admin.from('cart_items').delete().eq('cart_id', cart.id)
      }
    }

    if (payment) {
      await admin
        .from('payments')
        .update({ razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature, status: 'captured' })
        .eq('id', payment.id)
    }

    return jsonResponse({ success: true, orderId, orderNumber: order.order_number })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
