import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertProfile } from '@/services/profile'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  worker_name: z.string().min(2, 'Introduce tu nombre'),
  daily_goal_hours: z.number().min(1, 'Mínimo 1h').max(24, 'Máximo 24h'),
  default_break_minutes: z.number().min(0, 'No puede ser negativo'),
  hourly_rate: z.number().min(0),
  overtime_rate: z.number().min(0),
  currency: z.string().min(1, 'Elige moneda'),
})

type OnboardingFormValues = z.infer<typeof schema>

export function Onboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  // Usar el nombre de Google como punto de partida sugerido, si existe
  const defaultName = user?.user_metadata?.full_name || ''

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      worker_name: defaultName,
      daily_goal_hours: 8,
      default_break_minutes: 30,
      hourly_rate: 0,
      overtime_rate: 0,
      currency: '€'
    }
  })

  const mutation = useMutation({
    mutationFn: (data: OnboardingFormValues) => {
      return upsertProfile({
        worker_name: data.worker_name,
        daily_goal_minutes: data.daily_goal_hours * 60,
        default_break_minutes: data.default_break_minutes,
        hourly_rate: data.hourly_rate,
        overtime_rate: data.overtime_rate,
        currency: data.currency,
        theme: 'system' // Por defecto
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      navigate('/', { replace: true })
    }
  })

  const onSubmit = (data: OnboardingFormValues) => {
    mutation.mutate(data)
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-background pb-12 overflow-y-auto">
      
      {/* Header (Apple Style) */}
      <div className="px-6 pt-16 pb-8">
        <h1 className="text-[34px] font-extrabold text-main leading-tight tracking-tight mb-2">
          Bienvenido a HourTrack
        </h1>
        <p className="text-[17px] text-sec leading-relaxed">
          Vamos a configurar tu espacio de trabajo. Solo tardarás un minuto.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-full px-6 space-y-10">
        
        {/* SECCIÓN: Perfil */}
        <section>
          <h2 className="text-[13px] font-bold text-sec uppercase tracking-widest mb-2 ml-4">Perfil</h2>
          <div className="premium-card overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3.5">
              <label className="text-[17px] text-main">Nombre</label>
              <input 
                {...register('worker_name')}
                placeholder="María Pérez"
                className="text-[17px] text-sec text-right bg-transparent outline-none w-1/2 placeholder-gray-300"
              />
            </div>
            {errors.worker_name && <p className="text-red-500 text-xs text-right px-4 pb-2">{errors.worker_name.message}</p>}
          </div>
        </section>

        {/* SECCIÓN: Jornada */}
        <section>
          <h2 className="text-[13px] font-bold text-sec uppercase tracking-widest mb-2 ml-4">Jornada</h2>
          <div className="premium-card overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center px-4 py-3.5 border-b border-border/40">
              <label className="text-[17px] text-main">Objetivo diario <span className="text-sec text-[15px] ml-1">(horas)</span></label>
              <input 
                type="number" step="0.5"
                {...register('daily_goal_hours', { valueAsNumber: true })}
                className="text-[17px] text-sec text-right bg-transparent outline-none w-20"
              />
            </div>

            <div className="flex justify-between items-center px-4 py-3.5">
              <label className="text-[17px] text-main">Descanso habitual <span className="text-sec text-[15px] ml-1">(min)</span></label>
              <input 
                type="number"
                {...register('default_break_minutes', { valueAsNumber: true })}
                className="text-[17px] text-sec text-right bg-transparent outline-none w-20"
              />
            </div>

          </div>
        </section>

        {/* SECCIÓN: Salario */}
        <section>
          <h2 className="text-[13px] font-bold text-sec uppercase tracking-widest mb-2 ml-4">Salario</h2>
          <div className="premium-card overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center px-4 py-3.5 border-b border-border/40">
              <label className="text-[17px] text-main">Hora normal</label>
              <input 
                type="number" step="0.1"
                {...register('hourly_rate', { valueAsNumber: true })}
                className="text-[17px] text-sec text-right bg-transparent outline-none w-20"
              />
            </div>

            <div className="flex justify-between items-center px-4 py-3.5 border-b border-border/40">
              <label className="text-[17px] text-main">Hora extra</label>
              <input 
                type="number" step="0.1"
                {...register('overtime_rate', { valueAsNumber: true })}
                className="text-[17px] text-sec text-right bg-transparent outline-none w-20"
              />
            </div>
            
            <div className="flex justify-between items-center px-4 py-3.5">
              <label className="text-[17px] text-main">Moneda</label>
              <input 
                {...register('currency')}
                className="text-[17px] text-sec text-right bg-transparent outline-none w-20 uppercase"
              />
            </div>

          </div>
        </section>

        {/* Botón Final */}
        <div className="pt-6">
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[#0A84FF] text-white h-[56px] rounded-[16px] text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm"
          >
            {mutation.isPending ? 'Guardando...' : 'Comenzar'}
          </button>
        </div>

      </form>
    </div>
  )
}
