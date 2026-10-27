import { useState } from 'react'
import { BadgeCheck, Tag, X } from 'lucide-react'
import { formatINR } from '@/lib/utils'
import type { AppliedCoupon } from '@/hooks/useCoupon'

interface Props {
  coupon: AppliedCoupon | null
  applying: boolean
  error: string
  onApply: (code: string) => Promise<boolean>
  onRemove: () => void
  disabled?: boolean
}

/** "Have a coupon code?" box shared by the checkout page and the quick-checkout form. */
export function CouponField({ coupon, applying, error, onApply, onRemove, disabled }: Props) {
  const [code, setCode] = useState('')
  const submit = async () => {
    if (await onApply(code)) setCode('')
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-emerald-700">
          <BadgeCheck size={16} className="shrink-0" />
          <span className="truncate">
            <strong>{coupon.code}</strong> applied, you save {formatINR(coupon.discount)}
          </span>
        </span>
        <button type="button" onClick={onRemove} disabled={disabled} aria-label="Remove coupon" className="shrink-0 text-emerald-700 hover:text-red-500">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Not a <form>: on the checkout page this sits inside the order form. */}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            aria-label="Coupon code"
            autoCapitalize="characters"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void submit()
              }
            }}
            className="h-10 w-full rounded-lg border border-blush-200 bg-white pl-9 pr-3 text-sm uppercase placeholder:normal-case placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={disabled || applying || !code.trim()}
          className="h-10 shrink-0 rounded-lg border border-brand-500 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-blush-50 disabled:opacity-50"
        >
          {applying ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
