import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

/** Landing page for the link in the "reset your password" email. */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [state, setState] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // The Supabase client exchanges the token in the URL for a recovery session on load.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (hash.get('error') || new URLSearchParams(window.location.search).get('error')) {
      setState('invalid')
      return
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session && !session.user.is_anonymous)) setState('ready')
    })
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      setState(data.session && !data.session.user.is_anonymous ? 'ready' : 'invalid')
    }, 2500)
    return () => {
      sub.subscription.unsubscribe()
      window.clearTimeout(timer)
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Password updated!')
    navigate('/account')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-center font-serif text-3xl">Set a New Password</h1>
      {state === 'checking' && <p className="mt-8 text-center text-sm text-ink-500">Verifying your link…</p>}
      {state === 'invalid' && (
        <div className="mt-8 text-center">
          <p className="text-sm text-ink-500">This reset link is invalid or has expired. Please request a new one.</p>
          <Link to="/login?mode=forgot" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
            Request a new link
          </Link>
        </div>
      )}
      {state === 'ready' && (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Input label="New Password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirm Password" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Update Password
          </Button>
        </form>
      )}
    </div>
  )
}
