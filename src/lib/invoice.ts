import logoUrl from '@/assets/invoice-logo.png'
import type { Order, OrderItem, ShippingAddressJson } from '@/types'

/**
 * Tax invoice PDF laid out to match todaycontent/HerStyleCode_Invoice_Template_6.pdf: A4, Helvetica, same
 * colours and coordinates (all numbers below are points taken from that template). Fields that the template
 * leaves blank are filled from the order; the items table grows (and paginates) with the order.
 */

const BURGUNDY: [number, number, number] = [94, 10, 27]
const TEXT: [number, number, number] = [51, 51, 51]
const DARK: [number, number, number] = [17, 17, 17]
const GREY: [number, number, number] = [119, 119, 119]
const ROSE: [number, number, number] = [248, 237, 239]
const ROW_ALT: [number, number, number] = [251, 248, 249]
const BORDER: [number, number, number] = [230, 211, 215]
const TAGLINE: [number, number, number] = [212, 128, 138]

const LEFT = 42
const RIGHT = 553.28
const PAGE_H = 841.89

// Static brand details that the template prints as-is.
const HEADER_EMAIL = 'support.herstylecode@gmail.com'
const HEADER_PHONE = '+91 97736 72643'
const SELLER_NAME = 'HER STYLE CODE'
const SELLER_UDYAM = 'UDYAM-UK-05-0141903'
const SELLER_STATE = 'Uttarakhand / 05'

const LINE_H = 12.5
const ROW_H = 38
const MIN_ROWS = 4
const FOOTER_SPAN = 234 // table bottom -> end of the thank-you box in the template (582 -> 816)

/** jsPDF's built-in Helvetica has no rupee glyph or non-Latin scripts: keep text it can draw. */
const clean = (v: unknown) =>
  String(v ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/₹/g, 'Rs.')
    .replace(/[^\x20-\x7E -ÿ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const money = (n: number) => `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function below1000(n: number): string {
  const parts: string[] = []
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`)
    n %= 100
    if (n) parts.push('and')
  }
  if (n >= 20) parts.push(`${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`)
  else if (n > 0) parts.push(ONES[n])
  return parts.join(' ')
}

/** 12345.5 -> "Rupees Twelve Thousand Three Hundred and Forty Five and Fifty Paise Only" (Indian numbering). */
export function amountInWords(amount: number): string {
  const total = Math.round(Math.max(0, amount) * 100)
  const rupees = Math.floor(total / 100)
  const paise = total % 100
  const groups: [number, string][] = [[Math.floor(rupees / 10000000), 'Crore'], [Math.floor(rupees / 100000) % 100, 'Lakh'], [Math.floor(rupees / 1000) % 100, 'Thousand']]
  const words: string[] = []
  for (const [n, label] of groups) if (n) words.push(`${below1000(n)} ${label}`)
  const rest = rupees % 1000
  if (rest) words.push(below1000(rest))
  let out = `Rupees ${words.length ? words.join(' ') : 'Zero'}`
  if (paise) out += ` and ${below1000(paise)} Paise`
  return `${out} Only`
}

/** The invoice logo as a compact JPEG data URL (the artwork has no transparency). */
async function loadLogo(): Promise<{ data: string; ratio: number }> {
  const img = new Image()
  img.src = logoUrl
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  return { data: canvas.toDataURL('image/jpeg', 0.92), ratio: canvas.height / canvas.width }
}

const IST = 'Asia/Kolkata'
function invoiceDate(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: IST, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('day')} / ${get('month')} / ${get('year')}`
}

function paymentStatus(order: Order): string {
  if (order.payment_status === 'refunded') return 'Refunded'
  if (order.payment_status === 'partially_refunded') return 'Partially Refunded'
  if (order.payment_status === 'failed') return 'Failed'
  if (order.payment_status === 'paid') return 'Paid'
  if (order.payment_method === 'cod') return order.advance_paid && Number(order.advance_amount) > 0 ? 'Partially Paid (COD)' : 'Pending (COD)'
  return 'Pending'
}

function amountPaid(order: Order): number {
  if (order.payment_status === 'paid') return Number(order.total_amount)
  if (order.payment_method === 'cod' && order.advance_paid) return Math.min(Number(order.advance_amount) || 0, Number(order.total_amount))
  return 0
}

/** Share the order-level discount across the lines in proportion to their value (last line takes the rounding). */
function lineDiscounts(order: Order): number[] {
  const items = order.items ?? []
  const subtotal = items.reduce((s, i) => s + Number(i.line_total), 0)
  const discount = Number(order.discount_amount) || 0
  if (!discount || !subtotal) return items.map(() => 0)
  let left = discount
  return items.map((i, idx) => {
    const d = idx === items.length - 1 ? left : Math.min(left, Math.round(((discount * Number(i.line_total)) / subtotal) * 100) / 100)
    left = Math.round((left - d) * 100) / 100
    return d
  })
}

export async function downloadInvoice(order: Order, settings?: { address?: string }) {
  const [{ jsPDF }, logo] = await Promise.all([import('jspdf'), loadLogo()])
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  const set = (font: 'normal' | 'bold', size: number, color: [number, number, number]) => {
    doc.setFont('helvetica', font).setFontSize(size).setTextColor(...color)
  }
  const width = (text: string, font: 'normal' | 'bold', size: number) => {
    doc.setFont('helvetica', font).setFontSize(size)
    return doc.getTextWidth(text)
  }
  /** Greedy wrap where the first line has less room (it follows a label on the same row). */
  const wrap = (text: string, firstW: number, restW: number, size = 8): string[] => {
    doc.setFont('helvetica', 'normal').setFontSize(size)
    const lines: string[] = []
    let cur = ''
    for (const word of text.split(' ').filter(Boolean)) {
      const limit = lines.length === 0 ? firstW : restW
      const next = cur ? `${cur} ${word}` : word
      if (doc.getTextWidth(next) <= limit || !cur) cur = next
      else {
        lines.push(cur)
        cur = word
      }
    }
    if (cur) lines.push(cur)
    return lines
  }

  const items = order.items ?? []
  const ship = (order.shipping_address ?? {}) as Partial<ShippingAddressJson>
  const bill = ((order.billing_address as Partial<ShippingAddressJson> | null) ?? ship) as Partial<ShippingAddressJson>
  const email = clean(order.guest_email)
  const subtotal = items.reduce((s, i) => s + Number(i.line_total), 0) || Number(order.subtotal)
  const discount = Number(order.discount_amount) || 0
  const shipping = Number(order.shipping_amount) || 0
  const total = Number(order.total_amount)
  const paid = amountPaid(order)
  const balance = Math.max(0, total - paid)
  const invoiceNo = clean(order.invoice_number || order.order_number)

  // ---- Page 1 header frame: logo, contact row
  doc.setDrawColor(...BURGUNDY).setLineWidth(1.2).rect(LEFT, 30, RIGHT - LEFT, 118)
  const logoW = 138.3
  doc.addImage(logo.data, 'JPEG', 228.49, 36, logoW, logoW * logo.ratio)
  set('normal', 9, TEXT)
  doc.text(HEADER_EMAIL, 54, 138)
  doc.text(HEADER_PHONE, 541.3, 138, { align: 'right' })

  // ---- Title + invoice meta (label right-aligned against its value)
  set('bold', 22, BURGUNDY)
  doc.text('INVOICE', LEFT, 182)
  const meta: [string, string, number][] = [
    ['Invoice No.:', invoiceNo, 172],
    ['Invoice Date:', invoiceDate(order.placed_at), 185],
    ['Payment Status:', paymentStatus(order), 198],
  ]
  for (const [label, value, y] of meta) {
    set('normal', 9, TEXT)
    doc.text(value, RIGHT, y, { align: 'right' })
    const vw = width(value, 'normal', 9)
    set('bold', 9, TEXT)
    doc.text(label, RIGHT - vw - 5, y, { align: 'right' })
  }

  // ---- Place of supply / order id
  doc.setDrawColor(...BURGUNDY).setLineWidth(0.6).line(LEFT, 249, RIGHT, 249)
  set('bold', 8.5, BURGUNDY)
  doc.text('Place of Supply:', LEFT, 240)
  doc.text('Order ID:', 207, 240)
  const fit = (text: string, maxW: number, size = 9) => {
    let s = size
    while (s > 6.5 && width(text, 'normal', s) > maxW) s -= 0.5
    return s
  }
  const place = clean(ship.state)
  set('normal', fit(place, 82), TEXT)
  doc.text(place, 120, 240)
  const orderIdText = clean(order.order_number)
  set('normal', fit(orderIdText, RIGHT - 254), TEXT)
  doc.text(orderIdText, 254, 240)

  // ---- Bill to / Ship to / Seller details
  // Each column is a list of "Label: value" rows laid out top-down on the template's 12.5pt rhythm. A value that is
  // too long wraps onto the next line(s), and the address row always reserves two lines like the template does.
  type Col = { x: number; w: number }
  type Row = { label: string; text: string; minLines: number; bold?: boolean }
  const cols: Record<'bill' | 'ship' | 'seller', Col> = { bill: { x: 52, w: 160 }, ship: { x: 222.4, w: 160 }, seller: { x: 392.9, w: 152 } }
  const fullAddress = (a: Partial<ShippingAddressJson>) => [a.line1, a.line2].filter(Boolean).join(', ')
  const cityLine = (a: Partial<ShippingAddressJson>) => `${[a.city, a.state].filter(Boolean).join(', ')}${a.pincode ? ` - ${a.pincode}` : ''}`
  const partyRows = (a: Partial<ShippingAddressJson>, nameLabel: string, addressLabel: string): Row[] => [
    { label: nameLabel, text: a.full_name ?? order.guest_name ?? '', minLines: 1 },
    { label: addressLabel, text: fullAddress(a), minLines: 2 },
    { label: 'City / State / PIN:', text: cityLine(a), minLines: 1 },
    { label: 'Phone:', text: a.phone ?? order.guest_phone ?? '', minLines: 1 },
    { label: 'Email:', text: email, minLines: 1 },
  ]
  const layout = (col: Col, rows: Row[], startY: number) => {
    let y = startY
    const placed = rows.map((r) => {
      const lines = wrap(clean(r.text), col.w - (width(r.label, 'normal', 8) + 3), col.w)
      const item = { ...r, lines, y }
      y += Math.max(lines.length, r.minLines) * LINE_H
      return item
    })
    return { placed, end: y }
  }
  const billCol = layout(cols.bill, partyRows(bill, 'Customer Name:', 'Billing Address:'), 293)
  const shipCol = layout(cols.ship, partyRows(ship, 'Recipient Name:', 'Shipping Address:'), 293)
  const sellerCol = layout(
    cols.seller,
    [
      { label: 'Udyam Reg. No.:', text: SELLER_UDYAM, minLines: 1 },
      { label: 'Phone:', text: HEADER_PHONE, minLines: 1 },
      { label: 'Address:', text: settings?.address ?? '', minLines: 2 },
      { label: 'State / Code:', text: SELLER_STATE, minLines: 1 },
    ],
    305,
  )
  // Template: last row baseline 355.5 -> panel bottom 384 (28.5pt below it).
  const extra = Math.max(0, Math.max(billCol.end, shipCol.end, sellerCol.end) - 368)
  const boxBottom = 384 + extra
  doc.setFillColor(...ROSE).setDrawColor(...BORDER).setLineWidth(0.6).rect(LEFT, 262, RIGHT - LEFT, boxBottom - 262, 'FD')

  set('bold', 9.5, BURGUNDY)
  doc.text('BILL TO', cols.bill.x, 280)
  doc.text('SHIP TO', cols.ship.x, 280)
  doc.text('SELLER DETAILS', cols.seller.x, 280)
  set('bold', 8.5, BURGUNDY)
  doc.text(SELLER_NAME, cols.seller.x, 293)
  for (const [col, placed] of [[cols.bill, billCol.placed], [cols.ship, shipCol.placed], [cols.seller, sellerCol.placed]] as const) {
    for (const r of placed) {
      set('normal', 8, TEXT)
      doc.text(r.label, col.x, r.y)
      doc.text(r.lines[0] ?? '', col.x + width(r.label, 'normal', 8) + 3, r.y)
      for (let i = 1; i < r.lines.length; i++) doc.text(r.lines[i], col.x, r.y + i * LINE_H)
    }
  }

  // ---- Items table
  const tableTop = 406 + extra
  const COLS = [257, 327, 402, 472]
  const CENTERS = [292, 364.5, 437, 512.65]
  const drawHeader = (y: number) => {
    doc.setFillColor(...BURGUNDY).rect(LEFT, y, RIGHT - LEFT, 24, 'F')
    set('bold', 8.5, [255, 255, 255])
    doc.text('ITEM DESCRIPTION', 52, y + 15)
    doc.text('QTY', CENTERS[0], y + 15, { align: 'center' })
    doc.text('RATE', CENTERS[1], y + 15, { align: 'center' })
    doc.text('DISCOUNT', CENTERS[2], y + 15, { align: 'center' })
    doc.text('AMOUNT', CENTERS[3], y + 15, { align: 'center' })
  }
  const drawRow = (y: number, h: number, idx: number, item?: OrderItem, disc = 0) => {
    doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : ROW_ALT) as [number, number, number]).setDrawColor(...BORDER).setLineWidth(0.6).rect(LEFT, y, RIGHT - LEFT, h, 'FD')
    for (const x of COLS) doc.line(x, y, x, y + h)
    if (!item) return
    const name = clean(item.product_name)
    const subLines = [clean(item.variant_name), `SKU: ${clean(item.sku)}`].filter(Boolean)
    const nameLines = doc.setFont('helvetica', 'normal').setFontSize(8).splitTextToSize(name, 195) as string[]
    const textH = (nameLines.length + subLines.length) * 11
    const ty = y + (h - textH) / 2 + 8.5
    set('normal', 8, TEXT)
    doc.text(nameLines, 52, ty, { lineHeightFactor: 1.375 })
    set('normal', 8, GREY)
    doc.text(subLines, 52, ty + nameLines.length * 11, { lineHeightFactor: 1.375 })
    const vy = y + h / 2 + 3
    set('normal', 8, TEXT)
    doc.text(String(item.quantity), CENTERS[0], vy, { align: 'center' })
    doc.text(money(item.unit_price), CENTERS[1], vy, { align: 'center' })
    doc.text(disc ? money(disc) : '-', CENTERS[2], vy, { align: 'center' })
    doc.text(money(item.line_total), CENTERS[3], vy, { align: 'center' })
  }

  const discounts = lineDiscounts(order)
  // Blank filler rows keep the template's 4-row look, but never push the totals block onto another page.
  const fillerRows = Math.max(0, Math.min(MIN_ROWS, Math.floor((PAGE_H - 16 - FOOTER_SPAN - tableTop - 24) / ROW_H)))
  const rowCount = Math.max(items.length, fillerRows)
  let y = tableTop
  drawHeader(y)
  y += 24
  for (let i = 0; i < rowCount; i++) {
    const item = items[i]
    let h = ROW_H
    if (item) {
      const lines = (doc.setFont('helvetica', 'normal').setFontSize(8).splitTextToSize(clean(item.product_name), 195) as string[]).length
      h = Math.max(ROW_H, (lines + (clean(item.variant_name) ? 2 : 1)) * 11 + 16)
    }
    if (y + h > PAGE_H - 36) {
      doc.addPage()
      y = 42
      drawHeader(y)
      y += 24
    }
    drawRow(y, h, i, item, discounts[i])
    y += h
  }

  // ---- Totals block: positions are the template's, shifted to sit under the last row
  let s = y - 582
  if (y + FOOTER_SPAN > PAGE_H - 16) {
    doc.addPage()
    s = 42 - 582
  }
  set('bold', 9, DARK)
  doc.text('Terms and Conditions apply', LEFT, 610 + s)
  doc.setDrawColor(...DARK).setLineWidth(1)
  doc.line(LEFT, 616 + s, 327, 616 + s)
  set('bold', 9, DARK)
  doc.text('Amount in words', LEFT, 631 + s)
  const words = doc.setFont('helvetica', 'normal').setFontSize(8.5).splitTextToSize(amountInWords(total), 285) as string[]
  set('normal', 8.5, DARK)
  doc.text(words.slice(0, 2), LEFT, 645 + s, { lineHeightFactor: 12 / 8.5 })
  doc.line(LEFT, 663 + s, 327, 663 + s)
  set('bold', 9, DARK)
  doc.text('E. & O.E', LEFT, 677 + s)

  const VAL_X = 547.3
  const sumRow = (label: string, value: string, base: number) => {
    set('normal', 9, TEXT)
    doc.text(label, 360, base + s)
    doc.text(value, VAL_X, base + s, { align: 'right' })
  }
  sumRow('Subtotal', money(subtotal), 614)
  sumRow('Discount', discount ? `- ${money(discount)}` : money(0), 634)
  sumRow('Shipping', shipping ? money(shipping) : 'Free', 654)
  doc.setFillColor(...ROSE).rect(352, 659 + s, RIGHT - 352, 24, 'F')
  doc.setDrawColor(...BURGUNDY).setLineWidth(1.2).line(352, 659 + s, RIGHT, 659 + s)
  set('bold', 9, BURGUNDY)
  doc.text('GRAND TOTAL', 360, 678 + s)
  doc.text(money(total), VAL_X, 678 + s, { align: 'right' })
  sumRow('Amount Paid', money(paid), 700)
  set('bold', 9, BURGUNDY)
  doc.text('Balance Due', 360, 720 + s)
  doc.text(money(balance), VAL_X, 720 + s, { align: 'right' })

  // ---- Thank-you panel
  doc.setFillColor(...ROSE).setDrawColor(...BORDER).setLineWidth(0.6).rect(LEFT, 746 + s, RIGHT - LEFT, 70, 'FD')
  const cx = (LEFT + RIGHT) / 2
  set('bold', 11, BURGUNDY)
  doc.text('Thank you for shopping with HerStyleCode!', cx, 772 + s, { align: 'center' })
  set('bold', 8, TAGLINE)
  doc.text('YOUR STYLE. YOUR RULES.', cx, 789 + s, { align: 'center' })
  set('normal', 7.5, GREY)
  doc.text('This is computer generated invoice and hence no signature is required', cx, 806 + s, { align: 'center' })

  doc.save(`Invoice-${invoiceNo}.pdf`)
}
