let scriptPromise: Promise<void> | null = null

export function loadRazorpayScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-checkout-js'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.body.appendChild(script)
  })
  return scriptPromise
}

export interface RazorpayCheckoutOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void
  modal?: { ondismiss?: () => void }
  config?: Record<string, unknown>
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void }
  }
}

/**
 * Show every payment method (UPI, Cards, Net Banking, Wallets) up front instead of
 * Razorpay's collapsed "Google Pay + More" view.
 */
const PAYMENT_METHOD_CONFIG = {
  display: {
    blocks: {
      upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
      card: { name: 'Cards', instruments: [{ method: 'card' }] },
      netbanking: { name: 'Net Banking', instruments: [{ method: 'netbanking' }] },
      wallet: { name: 'Wallets', instruments: [{ method: 'wallet' }] },
    },
    sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
    preferences: { show_default_blocks: false },
  },
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  await loadRazorpayScript()
  const rzp = new window.Razorpay({ ...options, config: options.config ?? PAYMENT_METHOD_CONFIG })
  rzp.open()
}
