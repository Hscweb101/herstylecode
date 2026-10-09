// Creates an order from server-verified cart/product data (never trusts
// client-supplied prices), then either creates a Razorpay order (online
// payment) or confirms it immediately (Cash on Delivery).
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions, jsonResponse } from '../_shared/cors.ts'

interface CheckoutItem {
  productId: string
  variantId: string | null
  quantity: number
}

interface ShippingAddress {
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
}

interface CheckoutBody {
  items: CheckoutItem[]
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress | null
  couponCode?: string | null
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  paymentMethod: 'razorpay' | 'cod'
}

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') ?? ''

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const admin = createClient(supabaseUrl, serviceKey)

    const {
      data: { user },
    } = await userClient.auth.getUser()

    if (!user) return jsonResponse({ error: 'Not authenticated' }, 401)

    const body = (await req.json()) as CheckoutBody
    if (!body.items?.length) return jsonResponse({ error: 'Cart is empty' }, 400)
    if (!body.shippingAddress) return jsonResponse({ error: 'Shipping address is required' }, 400)

    // ---- Price everything server-side from the DB (never trust the client) ----
    const productIds = [...new Set(body.items.map((i) => i.productId))]
    const variantIds = [...new Set(body.items.map((i) => i.variantId).filter(Boolean))] as string[]

    const { data: products, error: productsError } = await admin
      .from('products')
      .select('id, name, sku, price, stock_quantity, track_inventory, is_active, return_eligible, cod_available')
      .in('id', productIds)
    if (productsError) throw productsError

    const { data: variants } = variantIds.length
      ? await admin.from('product_variants').select('*').in('id', variantIds)
      : { data: [] as Record<string, unknown>[] }

    const { data: images } = await admin.from('product_images').select('product_id, url, is_primary').in('product_id', productIds)

    let subtotal = 0
    const orderItemsPayload: Record<string, unknown>[] = []
    const stockOps: { productId: string; variantId: string | null; qty: number }[] = []

    for (const item of body.items) {
      const product = products?.find((p) => p.id === item.productId)
      if (!product || !product.is_active) return jsonResponse({ error: `Product unavailable: ${item.productId}` }, 400)
      if (body.paymentMethod === 'cod' && product.cod_available === false) {
        return jsonResponse({ error: `Cash on Delivery is not available for ${product.name}` }, 400)
      }

      const variant = item.variantId ? (variants as Array<Record<string, unknown>>)?.find((v) => v.id === item.variantId) : null
      if (item.variantId && !variant) return jsonResponse({ error: 'Invalid product variant' }, 400)

      const unitPrice = Number((variant?.price as number | undefined) ?? product.price)
      const stock = Number((variant?.stock_quantity as number | undefined) ?? product.stock_quantity)

      if (product.track_inventory !== false && stock < item.quantity) {
        return jsonResponse({ error: `Insufficient stock for ${product.name}` }, 400)
      }

      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal

      const image =
        (variant?.image_url as string | undefined) ??
        images?.find((i) => i.product_id === item.productId && i.is_primary)?.url ??
        images?.find((i) => i.product_id === item.productId)?.url

      orderItemsPayload.push({
        product_id: product.id,
        variant_id: item.variantId,
        product_name: product.name,
        variant_name: (variant?.variant_name as string | undefined) ?? null,
        sku: (variant?.sku as string | undefined) ?? product.sku,
        image_url: image ?? null,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
      })

      stockOps.push({ productId: product.id, variantId: item.variantId, qty: item.quantity })
    }

    // Site-wide offers from Admin > Settings: a discount for paying online, and an advance payment for COD.
    const { data: offersRow } = await admin.from('store_settings').select('value').eq('key', 'payment_offers').maybeSingle()
    const offers = (offersRow?.value ?? {}) as { online_discount_type?: string; online_discount_value?: number; cod_advance_type?: string; cod_advance_value?: number }
    const offerValue = (type: string | undefined, value: unknown, base: number) => {
      const v = Number(value) || 0
      if (v <= 0 || base <= 0 || type === 'none' || !type) return 0
      return Math.min(base, type === 'percent' ? Math.round((base * Math.min(v, 100)) / 100) : Math.round(v))
    }
    const onlineDiscount = body.paymentMethod === 'razorpay' ? offerValue(offers.online_discount_type, offers.online_discount_value, subtotal) : 0

    // ---- Coupon ----
    let discountAmount = 0
    let couponId: string | null = null
    if (body.couponCode) {
      const { data: couponResult } = await admin.rpc('validate_coupon', {
        p_code: body.couponCode,
        p_subtotal: subtotal,
        p_customer_id: user.id,
        p_guest_email: body.guestEmail ?? null,
      })
      const result = Array.isArray(couponResult) ? couponResult[0] : couponResult
      if (result?.is_valid) {
        couponId = result.coupon_id
        if (result.discount_type === 'percentage') {
          discountAmount = (subtotal * result.discount_value) / 100
          if (result.max_discount_amount) discountAmount = Math.min(discountAmount, result.max_discount_amount)
        } else {
          discountAmount = result.discount_value
        }
      }
    }

    // ---- Shipping & tax from store settings ----
    const { data: shippingSettingsRow } = await admin.from('store_settings').select('value').eq('key', 'shipping').maybeSingle()
    const shippingSettings = (shippingSettingsRow?.value as { free_shipping_threshold: number; standard_shipping_fee: number; cod_available: boolean }) ?? {
      free_shipping_threshold: 999,
      standard_shipping_fee: 59,
      cod_available: true,
    }
    if (body.paymentMethod === 'cod' && !shippingSettings.cod_available) {
      return jsonResponse({ error: 'Cash on Delivery is not available' }, 400)
    }

    // Free shipping is judged before the "Pay Now" discount, so paying online never makes shipping paid.
    const shippingAmount = subtotal - discountAmount >= shippingSettings.free_shipping_threshold ? 0 : shippingSettings.standard_shipping_fee

    // "Pay Now" discount for paying online (stacks with a coupon, never takes the order below zero).
    discountAmount = Math.min(subtotal, discountAmount + onlineDiscount)
    const netAfterDiscount = subtotal - discountAmount

    const { data: taxSettingsRow } = await admin.from('store_settings').select('value').eq('key', 'tax').maybeSingle()
    const taxSettings = (taxSettingsRow?.value as { gst_percentage: number; prices_include_tax: boolean }) ?? { gst_percentage: 0, prices_include_tax: true }
    const taxAmount = taxSettings.prices_include_tax ? 0 : Math.round(netAfterDiscount * (taxSettings.gst_percentage / 100))

    const totalAmount = Math.round(netAfterDiscount + shippingAmount + taxAmount)

    // Partial COD: part of the total is paid online now, the rest on delivery. Needs at least Rs 1 left to collect.
    const advanceAmount = body.paymentMethod === 'cod' ? Math.min(offerValue(offers.cod_advance_type, offers.cod_advance_value, totalAmount), Math.max(0, totalAmount - 1)) : 0

    // ---- Create the order ----
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        customer_id: user.id,
        guest_name: body.guestName ?? body.shippingAddress.full_name,
        guest_email: body.guestEmail ?? null,
        guest_phone: body.guestPhone ?? body.shippingAddress.phone,
        status: 'new',
        payment_status: 'pending',
        payment_method: body.paymentMethod,
        subtotal,
        discount_amount: discountAmount,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        advance_paid: false,
        coupon_id: couponId,
        coupon_code: body.couponCode ?? null,
        shipping_address: body.shippingAddress,
        billing_address: body.billingAddress ?? body.shippingAddress,
      })
      .select()
      .single()
    if (orderError) throw orderError

    await admin.from('order_items').insert(orderItemsPayload.map((i) => ({ ...i, order_id: order.id })))
    await admin.from('order_status_history').insert({ order_id: order.id, status: 'new', note: 'Order created' })

    if (couponId) {
      await admin.from('coupon_usages').insert({ coupon_id: couponId, order_id: order.id, customer_id: user.id, guest_email: body.guestEmail ?? null })
      const { data: couponRow } = await admin.from('coupons').select('used_count').eq('id', couponId).single()
      if (couponRow) await admin.from('coupons').update({ used_count: couponRow.used_count + 1 }).eq('id', couponId)
    }

    if (body.paymentMethod === 'cod' && advanceAmount === 0) {
      // Decrement stock immediately for COD orders (no online payment gate).
      for (const op of stockOps) {
        const { error: stockError } = await admin.rpc('decrement_stock', {
          p_product_id: op.productId,
          p_variant_id: op.variantId,
          p_qty: op.qty,
          p_reference_type: 'order_placed',
          p_reference_id: order.id,
        })
        if (stockError) console.error('Stock decrement failed', stockError.message)
      }
      await admin.from('orders').update({ status: 'new', payment_status: 'pending' }).eq('id', order.id)

      // Clear the customer's cart
      const { data: cart } = await admin.from('carts').select('id').eq('customer_id', user.id).maybeSingle()
      if (cart) await admin.from('cart_items').delete().eq('cart_id', cart.id)

      return jsonResponse({ orderId: order.id, orderNumber: order.order_number, codConfirmed: true })
    }

    // ---- Razorpay order ----
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!razorpayKeyId || !razorpayKeySecret || razorpayKeyId.includes('REPLACE_ME')) {
      await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      return jsonResponse({ error: 'Razorpay is not configured yet. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET as Edge Function secrets.' }, 503)
    }
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)

    // Online payment charges the full total, or just the advance for a partial-COD order.
    const chargeAmount = body.paymentMethod === 'cod' ? advanceAmount : totalAmount

    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(chargeAmount * 100),
        currency: 'INR',
        receipt: order.order_number,
        notes: { order_id: order.id },
      }),
    })
    const rpData = await rpRes.json()
    if (!rpRes.ok) {
      await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      return jsonResponse({ error: rpData?.error?.description ?? 'Failed to create payment order' }, 502)
    }

    await admin.from('payments').insert({
      order_id: order.id,
      provider: 'razorpay',
      razorpay_order_id: rpData.id,
      amount: chargeAmount,
      status: 'created',
      raw_response: rpData,
    })

    return jsonResponse({
      orderId: order.id,
      orderNumber: order.order_number,
      razorpayOrderId: rpData.id,
      amount: rpData.amount,
      currency: rpData.currency,
      keyId: razorpayKeyId,
      advanceAmount: body.paymentMethod === 'cod' ? advanceAmount : 0,
      balanceDue: body.paymentMethod === 'cod' ? totalAmount - advanceAmount : 0,
    })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: (err as Error).message ?? 'Unexpected error' }, 500)
  }
})
