import { useEffect, useRef, useState } from 'react'

function HandDrawnHeart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 90" fill="none" className={className}>
      <path
        d="M50 82C28 66 6 50 6 29C6 14 17 4 30 5C40 6 47 15 50 22C53 15 60 6 70 5C83 4 94 14 94 29C94 50 72 66 50 82Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="draw-path"
      />
    </svg>
  )
}

function HandDrawnFlower({ className }: { className?: string }) {
  const petal = (rotate: number, delay: string) => (
    <ellipse
      key={rotate}
      cx="50"
      cy="30"
      rx="11"
      ry="17"
      transform={`rotate(${rotate} 50 50)`}
      className={`draw-path ${delay}`}
      pathLength={1}
    />
  )
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        {petal(0, 'draw-delay-1')}
        {petal(72, 'draw-delay-2')}
        {petal(144, 'draw-delay-3')}
        {petal(216, 'draw-delay-4')}
        {petal(288, 'draw-delay-5')}
        <circle cx="50" cy="50" r="6" className="draw-path draw-delay-6" pathLength={1} fill="currentColor" stroke="none" />
      </g>
    </svg>
  )
}

export function QuoteSeparator() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className={`overflow-hidden bg-blush-100/70 py-10 md:py-14 ${visible ? 'is-visible' : ''}`}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center md:flex-row md:justify-center md:gap-8">
        <HandDrawnHeart className="h-10 w-10 shrink-0 text-brand-500 md:h-12 md:w-12" />
        <p className="text-xl leading-snug text-ink-900 md:text-2xl">
          Jewellery isn&apos;t just an accessory,
          <br className="hidden md:block" /> <span className="font-script italic text-brand-500">it&apos;s a feeling.</span>
        </p>
        <HandDrawnFlower className="h-10 w-10 shrink-0 text-gold-500 md:h-12 md:w-12" />
      </div>

      <style>{`
        .draw-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          transition: stroke-dashoffset 1.1s ease;
        }
        .is-visible .draw-path { stroke-dashoffset: 0; }
        .draw-delay-1 { transition-delay: 0s; }
        .draw-delay-2 { transition-delay: 0.12s; }
        .draw-delay-3 { transition-delay: 0.24s; }
        .draw-delay-4 { transition-delay: 0.36s; }
        .draw-delay-5 { transition-delay: 0.48s; }
        .draw-delay-6 { transition-delay: 0.6s; }
      `}</style>
    </section>
  )
}
