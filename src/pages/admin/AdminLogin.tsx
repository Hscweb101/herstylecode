import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import logo from '@/assets/logo.png'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminLogin() {
  const navigate = useNavigate()
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setLoading(false)
      toast.error(error?.message ?? 'Sign in failed')
      return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      await supabase.auth.signOut()
      setLoading(false)
      toast.error('This account does not have admin access')
      return
    }
    await refreshProfile()
    setLoading(false)
    navigate('/admin')
  }

  return (
    <div className="admin-ui flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <img src={logo} alt="HerStyleCode" className="mx-auto mb-4 h-16 w-auto object-contain" />
        <h1 className="mb-1 text-center text-xl font-semibold">Admin Panel</h1>
        <p className="mb-6 text-center text-sm text-ink-300">Sign in to manage HerStyleCode</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={loading}>Sign In</Button>
        </form>
      </div>
    </div>
  )
}
