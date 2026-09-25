import { useEffect, useRef, useState } from 'react'

/** Open on hover after a short delay, close after a short grace period so the pointer can travel into the panel. */
export function useHoverMenu<T = boolean>() {
  const [active, setActive] = useState<T | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = (value: T) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setActive(value), 70)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setActive(null), 160)
  }
  const keep = () => window.clearTimeout(timer.current)
  const close = () => {
    window.clearTimeout(timer.current)
    setActive(null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer.current)
    }
  }, [])

  return { active, show, hide, keep, close }
}
