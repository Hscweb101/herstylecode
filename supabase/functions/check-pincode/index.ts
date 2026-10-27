// Public pincode check for the product page: is the pincode serviceable, is COD possible, and when
// will it arrive. Asks Shiprocket's courier serviceability API (credentials never reach the browser).
// Needs the secret SHIPROCKET_PICKUP_POSTCODE (your warehouse pincode) next to the existing SHIPROCKET_* ones.
// Deploy with --no-verify-jwt (anonymous shoppers call it).
import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { shiprocketToken } from '../_shared/shiprocket.ts'

const PACK_DAYS = 1 // we take one day to pack before handing over to the courier
const DEFAULT_WEIGHT_KG = 0.3
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000
const RESULT_TTL_MS = 3 * 60 * 60 * 1000

// Kept per warm instance so most checks skip the Shiprocket login and the serviceability call.
let cachedToken: { value: string; at: number } | null = null
const results = new Map<string, { body: Record<string, unknown>; at: number }>()

async function getToken(force = false) {
  if (!force && cachedToken && Date.now() - cachedToken.at < TOKEN_TTL_MS) return cachedToken.value
  const value = await shiprocketToken()
  cachedToken = { value, at: Date.now() }
  return value
}

async function serviceability(params: URLSearchParams) {
  const call = async (token: string) =>
    fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  let res = await call(await getToken())
  if (res.status === 401) res = await call(await getToken(true))
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

// Adds whole days from today (India time), rolling a Sunday arrival to Monday.
function addDays(days: number) {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  d.setUTCDate(d.getUTCDate() + days)
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  const opt = handleOptions(req)
  if (opt) return opt

  try {
    const { pincode, weight_grams } = await req.json()
    const pin = String(pincode ?? '').trim()
    if (!/^[1-9]\d{5}$/.test(pin)) return jsonResponse({ error: 'Enter a valid 6-digit pincode' }, 400)
    const weight = Math.min(Math.max((Number(weight_grams) || DEFAULT_WEIGHT_KG * 1000) / 1000, 0.1), 5)

    const key = `${pin}:${weight}`
    const hit = results.get(key)
    if (hit && Date.now() - hit.at < RESULT_TTL_MS) return jsonResponse(hit.body)

    const { status, data } = await serviceability(
      new URLSearchParams({
        pickup_postcode: Deno.env.get('SHIPROCKET_PICKUP_POSTCODE')!,
        delivery_postcode: pin,
        weight: String(weight),
        cod: '0',
      }),
    )

    // Shiprocket answers 404 / status_code 404 when no courier reaches the pincode.
    const couriers: any[] = data?.data?.available_courier_companies ?? []
    if (!couriers.length) {
      if (status >= 500 || status === 401) return jsonResponse({ error: 'Could not check right now. Please try again.' }, 502)
      const body = { serviceable: false, pincode: pin }
      results.set(key, { body, at: Date.now() })
      return jsonResponse(body)
    }

    const days = Math.min(...couriers.map((c) => Number(c.estimated_delivery_days)).filter((n) => n > 0))
    const body = {
      serviceable: true,
      pincode: pin,
      cod: couriers.some((c) => Number(c.cod) === 1),
      days: days + PACK_DAYS,
      deliver_by: addDays(days + PACK_DAYS),
    }
    results.set(key, { body, at: Date.now() })
    return jsonResponse(body)
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Could not check right now' }, 500)
  }
})
