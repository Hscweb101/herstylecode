import { CalendarRange } from 'lucide-react'

export type RangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'month' | 'lastmonth' | 'all' | 'custom'

export interface DateRangeValue {
  preset: RangePreset
  /** yyyy-mm-dd, only used for the custom preset */
  from: string
  to: string
}

const LABELS: Record<RangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  month: 'This month',
  lastmonth: 'Last month',
  all: 'All time',
  custom: 'Custom range',
}

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const toInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromInput = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function defaultRange(preset: RangePreset = '30d'): DateRangeValue {
  const today = toInput(new Date())
  return { preset, from: today, to: today }
}

/** Resolves a range to [start, end) timestamps in the browser's local time. `null` start/end = unbounded. */
export function resolveRange(v: DateRangeValue): { start: Date | null; end: Date | null; label: string } {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  switch (v.preset) {
    case 'today':
      return { start: today, end: tomorrow, label: 'Today' }
    case 'yesterday':
      return { start: addDays(today, -1), end: today, label: 'Yesterday' }
    case '7d':
      return { start: addDays(today, -6), end: tomorrow, label: 'Last 7 days' }
    case '30d':
      return { start: addDays(today, -29), end: tomorrow, label: 'Last 30 days' }
    case '90d':
      return { start: addDays(today, -89), end: tomorrow, label: 'Last 90 days' }
    case 'month':
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: tomorrow, label: 'This month' }
    case 'lastmonth':
      return { start: new Date(today.getFullYear(), today.getMonth() - 1, 1), end: new Date(today.getFullYear(), today.getMonth(), 1), label: 'Last month' }
    case 'custom': {
      let a = v.from ? fromInput(v.from) : today
      let b = v.to ? fromInput(v.to) : today
      if (a > b) [a, b] = [b, a]
      return { start: a, end: addDays(b, 1), label: v.from === v.to ? a.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Custom range' }
    }
    default:
      return { start: null, end: null, label: 'All time' }
  }
}

export function inRange(iso: string, range: { start: Date | null; end: Date | null }) {
  const t = new Date(iso).getTime()
  return (!range.start || t >= range.start.getTime()) && (!range.end || t < range.end.getTime())
}

const selectCls = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export function DateRangeFilter({
  value, onChange, presets,
}: {
  value: DateRangeValue
  onChange: (v: DateRangeValue) => void
  presets?: RangePreset[]
}) {
  const options = presets ?? (['today', 'yesterday', '7d', '30d', '90d', 'month', 'lastmonth', 'all', 'custom'] as RangePreset[])
  const max = toInput(new Date())
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <CalendarRange size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <select
          aria-label="Date range"
          value={value.preset}
          onChange={(e) => onChange({ ...value, preset: e.target.value as RangePreset })}
          className={`${selectCls} appearance-none pl-9 pr-8`}
        >
          {options.map((p) => (
            <option key={p} value={p}>{LABELS[p]}</option>
          ))}
        </select>
      </div>
      {value.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" aria-label="From date" max={max} value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className={selectCls} />
          <span className="text-sm text-gray-400">to</span>
          <input type="date" aria-label="To date" max={max} value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className={selectCls} />
        </div>
      )}
    </div>
  )
}
