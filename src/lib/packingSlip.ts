import logoUrl from '@/assets/logo.png'
import { SITE_URL } from '@/lib/seo'
import type { Order, ShippingAddressJson } from '@/types'

const BURGUNDY: [number, number, number] = [114, 47, 55]
const CREAM: [number, number, number] = [248, 244, 231]
const INK: [number, number, number] = [42, 26, 28]
const MUTED: [number, number, number] = [122, 101, 104]

// jsPDF's built-in fonts have no rupee glyph, so amounts are written as "Rs".
const rs = (n: number) => `Rs ${Math.round(Number(n)).toLocaleString('en-IN')}`

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** The brand logo as a compact PNG data URL (the source file is large; the slip only needs ~600px). */
async function loadLogo(): Promise<{ data: string; ratio: number }> {
  const img = new Image()
  img.src = logoUrl
  await img.decode()
  const w = 600
  const h = Math.round((img.naturalHeight / img.naturalWidth) * w)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return { data: canvas.toDataURL('image/png'), ratio: h / w }
}

/** The page a shopper lands on after scanning the QR code on the slip. */
export function trackingLink(orderNumber: string) {
  return `${SITE_URL}/track-order?order=${encodeURIComponent(orderNumber)}`
}

/**
 * Builds an A5 packing slip for one order and downloads it as a PDF: logo, ship-to address, payment/COD
 * collection amount, item list with SKUs, and a QR code that opens order tracking when scanned.
 */
export async function downloadPackingSlip(order: Order, supportEmail?: string) {
  const [{ jsPDF }, QRCode, logo] = await Promise.all([import('jspdf'), import('qrcode'), loadLogo()])

  const qr = await QRCode.toDataURL(trackingLink(order.order_number), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 360,
    color: { dark: '#600619', light: '#ffffff' },
  })

  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 10
  const addr = order.shipping_address as ShippingAddressJson | null

  // ---- Header
  const logoW = 34
  doc.addImage(logo.data, 'PNG', M, M - 2, logoW, logoW * logo.ratio)
  doc.setTextColor(...MUTED).setFont('helvetica', 'bold').setFontSize(8)
  doc.text('PACKING SLIP', W - M, M + 3, { align: 'right', charSpace: 0.8 })
  doc.setTextColor(...BURGUNDY).setFontSize(19)
  doc.text(order.order_number, W - M, M + 12, { align: 'right' })
  doc.setTextColor(...MUTED).setFont('helvetica', 'normal').setFontSize(8.5)
  doc.text(`Placed ${fmtDate(order.placed_at)}`, W - M, M + 17.5, { align: 'right' })

  let y = M + logoW * logo.ratio + 2
  doc.setDrawColor(...BURGUNDY).setLineWidth(0.6).line(M, y, W - M, y)
  y += 7

  // ---- Ship to
  doc.setTextColor(...BURGUNDY).setFont('helvetica', 'bold').setFontSize(8)
  doc.text('SHIP TO', M, y, { charSpace: 0.8 })
  y += 5.5
  doc.setTextColor(...INK).setFontSize(12.5)
  doc.text(String(addr?.full_name ?? order.guest_name ?? ''), M, y)
  y += 5.5
  doc.setFont('helvetica', 'normal').setFontSize(10)
  const addressLines = doc.splitTextToSize(
    [addr?.line1, addr?.line2, [addr?.city, addr?.state].filter(Boolean).join(', '), `${addr?.pincode ?? ''}${addr?.country ? `, ${addr.country}` : ''}`]
      .filter(Boolean)
      .join('\n'),
    W - 2 * M,
  ) as string[]
  doc.text(addressLines, M, y, { lineHeightFactor: 1.35 })
  y += addressLines.length * 4.9 + 1
  doc.setFont('helvetica', 'bold')
  doc.text(`Phone: ${addr?.phone ?? order.guest_phone ?? ''}`, M, y)
  y += 6

  // ---- Payment strip
  const isCod = order.payment_method === 'cod'
  const advance = Number(order.advance_amount) || 0
  const balance = Math.max(0, Number(order.total_amount) - advance)
  let payText = 'PREPAID - NO PAYMENT TO COLLECT'
  if (isCod) payText = advance > 0 ? `COD - ADVANCE ${rs(advance)} PAID - COLLECT ${rs(balance)}` : `CASH ON DELIVERY - COLLECT ${rs(order.total_amount)}`
  doc.setFillColor(...BURGUNDY).roundedRect(M, y, W - 2 * M, 9, 1.5, 1.5, 'F')
  doc.setTextColor(...CREAM).setFont('helvetica', 'bold').setFontSize(isCod ? 9.5 : 9)
  doc.text(payText, W / 2, y + 5.9, { align: 'center' })
  y += 14

  // ---- Items
  const colSku = M + 2
  const colItem = M + 40
  const colQty = W - M - 2
  const header = () => {
    doc.setFillColor(...CREAM).rect(M, y, W - 2 * M, 7, 'F')
    doc.setTextColor(...BURGUNDY).setFont('helvetica', 'bold').setFontSize(8)
    doc.text('SKU', colSku, y + 4.8)
    doc.text('ITEM', colItem, y + 4.8)
    doc.text('QTY', colQty, y + 4.8, { align: 'right' })
    y += 7
  }
  header()

  const FOOTER_TOP = H - 46
  for (const item of order.items ?? []) {
    const title = item.variant_name && !item.product_name.includes(item.variant_name) ? `${item.product_name} (${item.variant_name})` : item.product_name
    doc.setFont('helvetica', 'normal').setFontSize(9)
    const lines = doc.splitTextToSize(title, colQty - colItem - 12) as string[]
    const skuLines = doc.splitTextToSize(item.sku, colItem - colSku - 3) as string[]
    const rowH = Math.max(lines.length, skuLines.length) * 4.2 + 3.2
    if (y + rowH > FOOTER_TOP) {
      doc.addPage()
      y = M
      header()
    }
    doc.setTextColor(...MUTED).setFontSize(8)
    doc.text(skuLines, colSku, y + 4.6)
    doc.setTextColor(...INK).setFontSize(9)
    doc.text(lines, colItem, y + 4.6)
    doc.setFont('helvetica', 'bold').setFontSize(11)
    doc.text(String(item.quantity), colQty, y + 4.8, { align: 'right' })
    y += rowH
    doc.setDrawColor(226, 216, 190).setLineWidth(0.2).line(M, y, W - M, y)
  }
  const units = (order.items ?? []).reduce((n, i) => n + i.quantity, 0)
  y += 5
  doc.setTextColor(...MUTED).setFont('helvetica', 'normal').setFontSize(8.5)
  doc.text(`${units} item${units === 1 ? '' : 's'} in this parcel`, M, y)

  // ---- Footer: QR + thank you (always at the bottom of the last page)
  const qrSize = 30
  const fy = H - M - qrSize
  doc.setDrawColor(...BURGUNDY).setLineWidth(0.3).line(M, fy - 4, W - M, fy - 4)
  doc.addImage(qr, 'PNG', W - M - qrSize, fy, qrSize, qrSize)
  doc.setTextColor(...BURGUNDY).setFont('helvetica', 'bold').setFontSize(11)
  doc.text('Scan to track your order', M, fy + 6)
  doc.setTextColor(...MUTED).setFont('helvetica', 'normal').setFontSize(8)
  doc.text(doc.splitTextToSize(`Point your phone camera at the QR code, or visit ${SITE_URL.replace(/^https?:\/\//, '')}/track-order and enter ${order.order_number}.`, W - 2 * M - qrSize - 6) as string[], M, fy + 11, { lineHeightFactor: 1.4 })
  doc.setTextColor(...BURGUNDY).setFont('helvetica', 'bold').setFontSize(9)
  doc.text('Thank you for shopping with HerStyleCode!', M, fy + qrSize - 8)
  doc.setTextColor(...MUTED).setFont('helvetica', 'italic').setFontSize(8)
  doc.text(`Your style. Your rules.${supportEmail ? `   ${supportEmail}` : ''}`, M, fy + qrSize - 3.5)

  doc.save(`packing-slip-${order.order_number}.pdf`)
}
