import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, upsertProfile } from '@/services/profile'
import { SettingsForm } from '@/components/settings/SettingsForm'
import type { FormValues } from '@/components/settings/SettingsForm'
import type { Profile } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import { FormSection } from '@/components/ui/FormSection'

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
    mutation.mutate({
      worker_name: data.worker_name,
      payment_type: data.payment_type ?? 'hourly',
      daily_rate: data.daily_rate ?? 0,
      daily_goal_minutes: data.daily_goal_hours * 60,
      default_break_minutes: data.default_break_minutes,
      hourly_rate: data.hourly_rate,
      overtime_rate: data.overtime_rate,
      currency: data.currency,
      theme: data.theme,
    })
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
          />
          <FormSection title="Notificaciones">
            <button
              onClick={() => navigate('/settings/notifications')}
              className="grouped-list-item px-4 h-[56px] flex items-center justify-between w-full text-left active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Bell className="text-gray-400" size={20} />
                <span className="text-[17px] text-main">Notificaciones</span>
              </div>
              <ChevronRight size={20} className="text-gray-400 opacity-50" />
            </button>
          </FormSection>
        </div>
      )}
    </div>
  )
}
