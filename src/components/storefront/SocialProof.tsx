import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const AVATAR_COLORS = ['#e34c86', '#c2185b', '#be185d', '#ec4899', '#d6336c', '#a21caf']

/**
 * Round profile picture for a customer/reviewer.
 * Tries `imageUrl`, then `fallbackUrl`, then falls back to initials on a coloured circle
 * (colour is stable per name). For real customers pass their real photo as `imageUrl`.
 */
export function ReviewerAvatar({
  name,
  imageUrl,
  fallbackUrl,
  size = 'md',
}: {
  name: string
  imageUrl?: string | null
  fallbackUrl?: string | null
  size?: 'md' | 'proof'
}) {
  const sources = [imageUrl, fallbackUrl].filter((s): s is string => !!s)
  const [stage, setStage] = useState(0)
  const clean = name.trim() || 'Customer'
  const initials = clean.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  let hash = 0
  for (const ch of clean) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const box = size === 'proof' ? 'h-9 w-9 ring-2 ring-white shadow-sm' : 'h-9 w-9'

  if (stage < sources.length) {
    return (
      <img
        src={sources[stage]}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setStage((s) => s + 1)}
        className={`${box} shrink-0 rounded-full bg-blush-100 object-cover`}
      />
    )
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${box}`}
      style={{ backgroundColor: AVATAR_COLORS[hash % AVATAR_COLORS.length] }}
      aria-hidden
    >
      {initials}
    </div>
  )
}

/**
 * "N people are viewing this right now".
 * Real number of people on this product page, via Supabase Realtime presence: every open
 * product page joins a per-product channel and the count is the number of live connections.
 * When fewer than 2 real viewers are present, local dev preview shows a dummy number instead
 * (see DUMMY PLACEHOLDERS below); a production build shows nothing.
 */
export function LiveViewerCount({ productId }: { productId: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const channel = supabase.channel(`product-viewers:${productId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    })
    channel
      .on('presence', { event: 'sync' }, () => setCount(Object.keys(channel.presenceState()).length))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void channel.track({ joined_at: Date.now() })
      })
    return () => {
      setCount(0)
      void supabase.removeChannel(channel)
    }
  }, [productId])

  const placeholder = usePlaceholderViewers(productId)
  const isReal = count >= 2
  const shown = isReal ? count : DEV_PLACEHOLDERS ? placeholder : 0
  if (shown < 2) return null

  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full border border-brand-300/40 bg-gradient-to-r from-blush-50 via-white to-blush-50 py-1.5 pl-2 pr-4 text-[13px] text-ink-700 shadow-luxe-sm"
      title={isReal ? undefined : 'Dummy placeholder - visible in local dev preview only'}
    >
      <span className="flex items-center gap-1.5 rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        Live
      </span>
      <span className="whitespace-nowrap">
        <span key={shown} className="inline-block min-w-[1.5ch] animate-[livePop_.4s_ease-out] text-center font-semibold tabular-nums text-brand-700">
          {shown}
        </span>{' '}
        <span className="sm:hidden">people viewing this now</span>
        <span className="max-sm:hidden">people are viewing this right now</span>
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DUMMY PLACEHOLDERS - local dev preview only.
// These exist so the layout can be designed before real data exists. They render only when
// running `npm run dev` (import.meta.env.DEV) and are never included in what customers see
// on a production build. Replace with real data (orders / reviews) when available.
// ---------------------------------------------------------------------------
const DEV_PLACEHOLDERS = import.meta.env.DEV

function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

/** Dummy viewer number: nudges up/down by 1-2 every 2-3 seconds so it visibly "moves". */
function usePlaceholderViewers(productId: string) {
  const [n, setN] = useState(() => 12 + Math.floor(seededRandom(productId)() * 14))
  useEffect(() => {
    if (!DEV_PLACEHOLDERS) return
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setN((c) => {
        const step = 1 + Math.floor(Math.random() * 2)
        const next = c + (Math.random() > 0.5 ? step : -step)
        return Math.min(34, Math.max(8, next))
      })
      timer = setTimeout(tick, 2000 + Math.random() * 1000)
    }
    timer = setTimeout(tick, 2000 + Math.random() * 1000)
    return () => clearTimeout(timer)
  }, [])
  return n
}

const FEMALE_FIRST = [
  'Priya', 'Ananya', 'Aditi', 'Neha', 'Kavya', 'Isha', 'Pooja', 'Sneha', 'Divya', 'Meera',
  'Riya', 'Shreya', 'Ishita', 'Tanvi', 'Anjali', 'Nisha', 'Simran', 'Aarti', 'Swati', 'Pallavi',
  'Lakshmi', 'Deepika', 'Radhika', 'Sakshi', 'Kritika', 'Aishwarya', 'Harleen', 'Fatima', 'Zoya', 'Mansi',
]
const MALE_FIRST = ['Rahul', 'Arjun', 'Karan', 'Rohan', 'Aman', 'Vikram', 'Siddharth', 'Nikhil', 'Aditya', 'Mohit']
const LAST_NAMES = [
  'Sharma', 'Gupta', 'Verma', 'Singh', 'Reddy', 'Nair', 'Iyer', 'Patel', 'Kapoor', 'Joshi',
  'Mehta', 'Agarwal', 'Chopra', 'Bansal', 'Desai', 'Menon', 'Pillai', 'Banerjee', 'Das', 'Khan',
  'Malhotra', 'Saxena', 'Rao', 'Kulkarni', 'Bhatia', 'Chauhan', 'Yadav', 'Mishra', 'Tiwari', 'Kaur',
]

interface DummyPerson {
  name: string
  /** No profile picture: shows initials, like customers who never uploaded one. */
  noPhoto: boolean
  /** Your own photo: drop files at public/avatars/1.jpg, 2.jpg, ... (see public/avatars/README.txt). */
  imageUrl: string | null
  /** Generic stand-in portrait used until you add your own photos. */
  fallbackUrl: string | null
}

const POOL_SIZE = 12

/** A seeded pool of dummy buyers. Every 2nd/4th person has no photo, so any 3 shown in a row include 1-2 without one. */
function dummyPool(productId: string): DummyPerson[] {
  const rand = seededRandom(productId)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const pool: DummyPerson[] = []
  const usedNames = new Set<string>()
  const usedPhotos = new Set<number>()
  while (pool.length < POOL_SIZE) {
    const idx = pool.length
    // Mostly women (jewellery audience) with the occasional man, like real gift buyers.
    const male = rand() < 0.25
    const name = `${pick(male ? MALE_FIRST : FEMALE_FIRST)} ${pick(LAST_NAMES)}`
    const photo = 1 + Math.floor(rand() * 90)
    if (usedNames.has(name) || usedPhotos.has(photo)) continue
    usedNames.add(name)
    usedPhotos.add(photo)
    const noPhoto = idx % 4 === 1 || idx % 4 === 3
    pool.push({
      name,
      noPhoto,
      imageUrl: noPhoto ? null : `/avatars/${(idx % POOL_SIZE) + 1}.jpg`,
      fallbackUrl: noPhoto ? null : `https://randomuser.me/api/portraits/${male ? 'men' : 'women'}/${photo}.jpg`,
    })
  }
  return pool
}

/** Animates 0 -> target once on mount so the number "counts up". */
function useCountUp(target: number, durationMs = 1100) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}

/**
 * "Anjali Verma (verified) and 112 others purchased" pill with overlapping profile photos.
 * The people rotate every 2-3 seconds. Dummy data, local dev preview only; hidden on production
 * builds. For real data, render the same markup with real customer names + photos
 * (<ReviewerAvatar name imageUrl />) and a real count.
 */
export function PurchaseSocialProof({ productId }: { productId: string }) {
  const pool = useMemo(() => dummyPool(productId), [productId])
  const [tick, setTick] = useState(0)
  const target = 80 + Math.floor(seededRandom(productId + 'count')() * 71) // 80-150
  const count = useCountUp(target)

  useEffect(() => {
    if (!DEV_PLACEHOLDERS) return
    let timer: ReturnType<typeof setTimeout>
    const next = () => {
      setTick((t) => t + 1)
      timer = setTimeout(next, 2000 + Math.random() * 1000)
    }
    timer = setTimeout(next, 2000 + Math.random() * 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!DEV_PLACEHOLDERS) return null
  const visible = [0, 1, 2].map((k) => pool[(tick + k) % pool.length])
  const lead = visible[0]

  return (
    <div
      className="flex w-fit max-w-full animate-[proofIn_.5s_ease-out] items-center gap-3 rounded-full border border-emerald-100 bg-gradient-to-r from-white via-white to-emerald-50/70 py-1.5 pl-1.5 pr-4 text-xs text-ink-500 shadow-[0_2px_14px_-4px_rgba(16,120,80,0.18)] sm:pr-5 sm:text-[13px]"
      title="Dummy placeholder - visible in local dev preview only"
    >
      {/* Overlap is per-avatar (-ml on all but the first) so nothing depends on sibling order or hidden items. */}
      <div className="flex shrink-0 items-center">
        {visible.map((p, i) => (
          <span key={p.name} className={`animate-[livePop_.45s_ease-out] ${i > 0 ? '-ml-3' : ''}`}>
            <ReviewerAvatar name={p.name} imageUrl={p.imageUrl} fallbackUrl={p.fallbackUrl} size="proof" />
          </span>
        ))}
      </div>
      {/* Phones: name on line 1, "and N others purchased" on line 2. sm+: a single line. */}
      <div className="min-w-0 leading-snug sm:flex sm:items-center sm:gap-1 sm:whitespace-nowrap">
        <span className="flex min-w-0 items-center gap-1">
          <strong key={lead.name} className="min-w-0 animate-[livePop_.45s_ease-out] truncate font-semibold text-ink-900">
            {lead.name}
          </strong>
          <BadgeCheck size={16} className="shrink-0 fill-emerald-500 text-white" aria-label="Verified buyer" />
        </span>
        <span className="block whitespace-nowrap sm:inline">
          and <strong className="font-semibold tabular-nums text-ink-900">{count.toLocaleString('en-IN')}</strong> others purchased
        </span>
      </div>
    </div>
  )
}
