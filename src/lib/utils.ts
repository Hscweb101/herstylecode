import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const SESSION_KEY = 'hsc_guest_session_id'

export function getGuestSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function clearGuestSessionId() {
  localStorage.removeItem(SESSION_KEY)
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

const RECENTLY_VIEWED_KEY = 'hsc_recently_viewed'
const RECENTLY_VIEWED_MAX = 10

export function pushRecentlyViewed(slug: string) {
  const existing = getRecentlyViewed().filter((s) => s !== slug)
  existing.unshift(slug)
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(existing.slice(0, RECENTLY_VIEWED_MAX)))
}

export function getRecentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? '[]')
  } catch {
    return []
  }
}
