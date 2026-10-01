import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function Login() {
  const navigate = useNavigate()
  const isAnonymous = useAuthStore((s) => s.isAnonymous)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(params.get('mode') === 'forgot' ? 'forgot' : 'signup')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  // Set when Supabase email confirmation is on: the account exists but the email link is not clicked yet.
  const [pending, setPending] = useState<{ email: string; kind: 'signup' | 'email_change' } | null>(null)

  const resend = async () => {
    if (!pending) return
    const { error } = await supabase.auth.resend({ type: pending.kind, email: pending.email, options: { emailRedirectTo: `${window.location.origin}/account` } })
    if (error) toast.error(error.message)
    else toast.success('Confirmation email sent again')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` })
      setLoading(false)
      if (error) toast.error(error.message)
      else toast.success('If an account exists for that email, a reset link is on its way.')
      return
    }

    if (mode === 'signup') {
      const redirect = `${window.location.origin}/account`
      const meta = { full_name: form.name, phone: form.phone }
      // A guest who already ordered keeps the same user, so their orders carry over to the new account.
      const { data, error } = isAnonymous
        ? await supabase.auth.updateUser({ email: form.email, password: form.password, data: meta }, { emailRedirectTo: redirect })
        : await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: meta, emailRedirectTo: redirect } })

      setLoading(false)
      if (error) {
        toast.error(error.message)
        return
      }
      const session = (data as { session?: unknown }).session
      const stillPending = isAnonymous ? true : !session
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (userId) await supabase.from('profiles').update({ full_name: form.name, phone: form.phone }).eq('id', userId)

      if (stillPending) {
        // Email confirmation is required: the email is not usable for sign-in until the link is clicked.
        setPending({ email: form.email, kind: isAnonymous ? 'email_change' : 'signup' })
        return
      }
      await refreshProfile()
      toast.success('Account created! You are signed in.')
      navigate('/account')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    setLoading(false)
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        setPending({ email: form.email, kind: 'signup' })
      } else if (/invalid login/i.test(error.message)) {
        toast.error('Wrong email or password. If you just signed up, confirm your email first (check inbox and spam), or use "Forgot password?".')
      } else {
        toast.error(error.message)
      }
      return
    }
    await refreshProfile()
    toast.success('Welcome back!')
    navigate('/account')
  }

  if (pending) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-3 font-serif text-3xl">Confirm Your Email</h1>
        <p className="text-sm text-ink-500">
          We sent a confirmation link to <strong className="text-ink-900">{pending.email}</strong>. Open the email (check spam too) and tap the link — you will be signed in automatically and any order you placed as a guest will show in My Orders.
        </p>
        <p className="mt-3 text-xs text-ink-300">Please open the link in this same browser. You can sign in with your email and password only after confirming.</p>
        <Button className="mt-6 w-full" variant="outline" onClick={resend}>Resend confirmation email</Button>
        <button onClick={() => { setPending(null); setMode('signin') }} className="mt-4 text-sm text-brand-600 hover:underline">Already confirmed? Sign in</button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-center font-serif text-3xl">{mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}</h1>
      <p className="mb-8 text-center text-sm text-ink-500">
        {mode === 'signup' ? 'Join HerStyleCode for faster checkout & order tracking.' : mode === 'forgot' ? "Enter your email and we'll send you a link to set a new password." : 'Sign in to view your orders and wishlist.'}
      </p>

      <div className="mb-6 flex rounded-full bg-blush-50 p-1">
        <button onClick={() => setMode('signup')} className={cn('flex-1 rounded-full py-2 text-sm font-medium', mode === 'signup' ? 'bg-white shadow-luxe-sm text-brand-600' : 'text-ink-500')}>
          Sign Up
        </button>
        <button onClick={() => setMode('signin')} className={cn('flex-1 rounded-full py-2 text-sm font-medium', mode !== 'signup' ? 'bg-white shadow-luxe-sm text-brand-600' : 'text-ink-500')}>
          Sign In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </>
        )}
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        {mode !== 'forgot' && (
          <Input label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        )}
        {mode === 'signin' && (
          <button type="button" onClick={() => setMode('forgot')} className="block text-sm text-brand-600 hover:underline">
            Forgot password?
          </button>
        )}
        {mode === 'forgot' && (
          <button type="button" onClick={() => setMode('signin')} className="block text-sm text-brand-600 hover:underline">
            Back to sign in
          </button>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}
