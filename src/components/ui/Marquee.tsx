import { cn } from '@/lib/utils'

export function Marquee({
  children,
  direction = 'rtl',
  speedSeconds = 22,
  className,
}: {
  children: React.ReactNode
  direction?: 'rtl' | 'ltr'
  speedSeconds?: number
  className?: string
}) {
  return (
    <div className={cn('marquee-pause overflow-hidden', className)}>
      <div
        className={cn('flex w-max', direction === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee-ltr')}
        style={{ animationDuration: `${speedSeconds}s` }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">{children}</div>
      </div>
    </div>
  )
}
