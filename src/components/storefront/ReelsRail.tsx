import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { Reel } from '@/types'
import { SectionHeading } from '@/components/ui/Misc'

export function ReelsRail({ reels }: { reels: Reel[] }) {
  if (reels.length === 0) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <SectionHeading eyebrow="Get The Look" title="Reels We Love" />
      <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
        {reels.map((r) => (
          <Link
            key={r.id}
            to={r.link_url ?? '#'}
            className="group relative aspect-[9/16] w-56 shrink-0 overflow-hidden rounded-2xl bg-ink-900 shadow-luxe-sm sm:w-64 md:w-72"
          >
            <video
              src={r.video_url}
              poster={r.poster_url ?? undefined}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />
            <div className="absolute right-2 top-2 rounded-full bg-white/25 p-1.5 backdrop-blur-sm">
              <Play size={12} className="fill-white text-white" />
            </div>
            {r.caption && (
              <p className="absolute inset-x-0 bottom-0 p-3 text-sm font-medium text-white">{r.caption}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
