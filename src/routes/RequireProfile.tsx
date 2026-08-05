import { Navigate, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/services/profile'

export function RequireProfile() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Cargando tu espacio...</p>
      </div>
    )
  }

  if (profile === null) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
