import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Compact page list like 1 ... 4 5 6 ... 12. */
function buildPages(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < pageCount - 1) pages.push('…')
  pages.push(pageCount)
  return pages
}

export function Pagination({
  page, pageSize, total, onPage, onPageSize, pageSizeOptions = [10, 20, 50],
}: {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  onPageSize?: (size: number) => void
  pageSizeOptions?: number[]
}) {
  if (total === 0) return null
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const btn = 'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-500">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing <strong className="text-ink-900">{from}-{to}</strong> of <strong className="text-ink-900">{total}</strong>
        </span>
        {onPageSize && (
          <label className="flex items-center gap-2">
            Rows
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="rounded-lg border border-blush-200 bg-white px-2 py-1.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button className={cn(btn, 'text-ink-700 hover:bg-blush-50')} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          {buildPages(page, pageCount).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1 text-ink-300">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(btn, p === page ? 'bg-brand-600 font-semibold text-white shadow-luxe-sm' : 'text-ink-700 hover:bg-blush-50')}
              >
                {p}
              </button>
            ),
          )}
          <button className={cn(btn, 'text-ink-700 hover:bg-blush-50')} disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  )
}
