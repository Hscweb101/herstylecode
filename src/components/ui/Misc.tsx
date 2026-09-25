import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Badge({
  children,
  tone = 'brand',
  className,
}: {
  children: React.ReactNode
  tone?: 'brand' | 'ink' | 'gold' | 'success' | 'danger' | 'neutral'
  className?: string
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-500 text-white',
    ink: 'bg-ink-900 text-white',
    gold: 'bg-gold-500 text-white',
    success: 'bg-emerald-600 text-white',
    danger: 'bg-red-600 text-white',
    neutral: 'bg-blush-100 text-ink-700',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide', tones[tone], className)}>
      {children}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600', className)} />
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(rating) ? 'fill-gold-500 text-gold-500' : 'fill-blush-100 text-blush-200'}
        />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <h3 className="font-serif text-xl text-ink-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  className,
}: {
  eyebrow?: string
  title: string
  className?: string
}) {
  return (
    <div className={cn('mb-8 text-center', className)}>
      {eyebrow && <p className="font-script mb-1 text-lg text-brand-500">{eyebrow}</p>}
      <h2 className="text-3xl text-ink-900 md:text-4xl">{title}</h2>
    </div>
  )
}
