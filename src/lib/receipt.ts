import type { Order } from '@/types'
import { formatINR, formatDate } from '@/lib/utils'

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Opens a clean, printable receipt in a new tab; the customer can print it or "Save as PDF". */
export function downloadReceipt(order: Order, supportEmail?: string) {
  const a = order.shipping_address
  const rows = (order.items ?? [])
    .map(
      (i) => `<tr><td>${esc(i.product_name)}${i.variant_name ? `<br><small>${esc(i.variant_name)}</small>` : ''}</td><td class="r">${i.quantity}</td><td class="r">${formatINR(i.unit_price)}</td><td class="r">${formatINR(i.line_total)}</td></tr>`,
    )
    .join('')
  const line = (label: string, v: number, minus = false) => (v ? `<tr><td colspan="3" class="r">${label}</td><td class="r">${minus ? '-' : ''}${formatINR(v)}</td></tr>` : '')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(order.order_number)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#222;max-width:720px;margin:24px auto;padding:0 16px;font-size:14px}
h1{margin:0;font-size:22px;color:#c2185b}.top{display:flex;justify-content:space-between;border-bottom:2px solid #e34c86;padding-bottom:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}th{background:#fdf2f6;font-size:12px;text-transform:uppercase}
.r{text-align:right}small{color:#777}.tot td{font-weight:bold;font-size:15px;border-top:2px solid #222}.foot{margin-top:24px;font-size:12px;color:#666;text-align:center}
@media print{button{display:none}}
</style></head><body>
<div class="top"><div><h1>HerStyleCode</h1><div>Order Receipt</div></div>
<div class="r"><strong>Order No: ${esc(order.order_number)}</strong><br>Date: ${esc(formatDate(order.placed_at))}<br>Payment: ${esc(String(order.payment_method).toUpperCase())} (${esc(order.payment_status)})</div></div>
<div><strong>Ship to</strong><br>${esc(a?.full_name ?? order.guest_name)}<br>${esc(a?.line1)}${a?.line2 ? ', ' + esc(a.line2) : ''}<br>${esc(a?.city)}, ${esc(a?.state)} - ${esc(a?.pincode)}<br>Phone: ${esc(a?.phone ?? order.guest_phone)}</div>
<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>${rows}
${line('Subtotal', order.subtotal)}${line('Discount', order.discount_amount, true)}${line('Shipping', order.shipping_amount)}${line('Tax', order.tax_amount)}
<tr class="tot"><td colspan="3" class="r">Total</td><td class="r">${formatINR(order.total_amount)}</td></tr></tbody></table>
<p class="foot">Keep your order number <strong>${esc(order.order_number)}</strong> to track your order at herstylecode.in/track-order.${supportEmail ? `<br>Questions? ${esc(supportEmail)}` : ''}<br>Thank you for shopping with HerStyleCode!</p>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}
