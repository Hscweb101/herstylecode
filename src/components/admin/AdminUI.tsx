import { cn } from '@/lib/utils'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl text-ink-900">{title}</h1>
        {description && <p className="text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-luxe-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-300">{label}</p>
      <p className="mt-2 font-serif text-2xl text-ink-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-emerald-600">{sub}</p>}
    </div>
  )
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-2xl bg-white p-5 shadow-luxe-sm', className)}>{children}</div>
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-luxe-sm">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-blush-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{children}</th>
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('border-b border-blush-50 px-4 py-3 align-middle', className)}>{children}</td>
}

export function IconButton({ onClick, children, className, title }: { onClick?: () => void; children: React.ReactNode; className?: string; title?: string }) {
  return (
    <button onClick={onClick} title={title} className={cn('rounded-lg p-2 text-ink-500 hover:bg-blush-50 hover:text-brand-600', className)}>
      {children}
    </button>
  )
}

export function ConfirmModal({
  open, title, description, onConfirm, onCancel, confirmLabel = 'Delete',
}: {
  open: boolean
  title: string
  description?: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-serif text-lg text-ink-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-ink-500">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-ink-700 hover:bg-blush-50">Cancel</button>
          <button onClick={onConfirm} className="rounded-full bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export { Pagination } from '@/components/ui/Pagination'
