import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { FullPageSpinner } from '@/components/ui/Misc'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { ready, isAdmin, isAnonymous } = useAuthStore()

  if (!ready) return <FullPageSpinner />
  if (isAnonymous || !isAdmin) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
