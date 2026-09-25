import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (mode === 'signup') {
      const { error } = isAnonymous
        ? await supabase.auth.updateUser({
            email: form.email,
            password: form.password,
            data: { full_name: form.name, phone: form.phone },
          })
        : await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.name, phone: form.phone } },
          })

      setLoading(false)
      if (error) {
        toast.error(error.message)
        return
      }
      await supabase.from('profiles').update({ full_name: form.name, phone: form.phone }).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      await refreshProfile()
      toast.success('Account created! Check your email if confirmation is required.')
      navigate('/account')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    await refreshProfile()
    toast.success('Welcome back!')
    navigate('/account')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-center font-serif text-3xl">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
      <p className="mb-8 text-center text-sm text-ink-500">
        {mode === 'signup' ? 'Join HerStyleCode for faster checkout & order tracking.' : 'Sign in to view your orders and wishlist.'}
      </p>

      <div className="mb-6 flex rounded-full bg-blush-50 p-1">
        <button onClick={() => setMode('signup')} className={cn('flex-1 rounded-full py-2 text-sm font-medium', mode === 'signup' ? 'bg-white shadow-luxe-sm text-brand-600' : 'text-ink-500')}>
          Sign Up
        </button>
        <button onClick={() => setMode('signin')} className={cn('flex-1 rounded-full py-2 text-sm font-medium', mode === 'signin' ? 'bg-white shadow-luxe-sm text-brand-600' : 'text-ink-500')}>
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
        <Input label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}
