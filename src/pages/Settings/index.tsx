import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, upsertProfile } from '@/services/profile'
import { SettingsForm } from '@/components/settings/SettingsForm'
import type { FormValues } from '@/components/settings/SettingsForm'
import type { Profile } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function Settings() {
  const queryClient = useQueryClient()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const mutation = useMutation({
    mutationFn: (newProfile: Profile) => upsertProfile(newProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : 'Error al guardar preferencias')
    }
  })

  const handleSubmit = (data: FormValues) => {
    console.log("FIRST LINE OF onSubmit (Settings/index.tsx)", data)
    console.log("STEP 3 (Objeto recibido por onSubmit)", data)
    
    const mutationPayload = {
      worker_name: data.worker_name,
      payment_type: data.payment_type ?? 'hourly',
      daily_rate: data.daily_rate ?? 0,
      daily_goal_minutes: data.daily_goal_hours * 60,
      default_break_minutes: data.default_break_minutes,
      hourly_rate: data.hourly_rate ?? 0,
      overtime_rate: data.overtime_rate ?? 0,
      currency: data.currency,
      theme: data.theme,
    }

    console.log("STEP 4 (Objeto recibido por la mutación)", mutationPayload)
    mutation.mutate(mutationPayload)
  }

  return (
    <div className="flex-1 flex flex-col items-center w-full pb-8">
      <TopBar title="Ajustes" />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      ) : isError ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <p className="text-red-500 text-center px-4">Ocurrió un error al cargar el perfil.<br/><span className="text-sm text-gray-400">Asegúrate de haber ejecutado los scripts de base de datos.</span></p>
          <button 
            onClick={() => refetch()}
            className="text-blue-500 font-medium active:opacity-70"
          >
            Reintentar
          </button>
        </div>
      ) : !profile ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No hay datos de perfil.</p>
        </div>
      ) : (
        <div className="w-full mt-4 flex flex-col space-y-6">
          <SettingsForm 
            initialData={profile} 
            onSubmit={handleSubmit} 
            isPending={mutation.isPending} 
            onSignOut={signOut}
            onNavigateNotifications={() => navigate('/settings/notifications')}
          />
        </div>
      )}
    </div>
  )
}
