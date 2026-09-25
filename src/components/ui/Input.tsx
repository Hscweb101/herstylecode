import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
  className?: string
}

const baseFieldClass =
  'w-full rounded-xl border border-blush-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors'

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">{children}</label>
)

export const FieldError = ({ children }: { children?: string }) =>
  children ? <p className="mt-1 text-xs text-red-600">{children}</p> : null

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input ref={ref} className={cn(baseFieldClass, error && 'border-red-400')} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-ink-300">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  ),
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea ref={ref} className={cn(baseFieldClass, 'min-h-[100px] resize-y', error && 'border-red-400')} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-ink-300">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  ),
)
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, children, ...props }, ref) => (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <select ref={ref} className={cn(baseFieldClass, 'appearance-none bg-white', error && 'border-red-400')} {...props}>
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-ink-300">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  ),
)
Select.displayName = 'Select'
