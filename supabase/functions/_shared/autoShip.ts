// Fire-and-forget: asks shiprocket-create-shipment to ship an order that has just been confirmed
// (COD placed, or online payment / COD advance captured). The function itself checks the
// "auto ship" store setting and makes sure the order is only shipped once.
export function triggerAutoShip(orderId: string): void {
  const call = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/shiprocket-create-shipment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    body: JSON.stringify({ order_id: orderId, auto: true }),
  }).catch((e) => console.error('auto-ship call failed', e))
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime
  if (rt?.waitUntil) rt.waitUntil(call)
}
