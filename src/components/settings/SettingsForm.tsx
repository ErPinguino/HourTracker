import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Profile } from '@/types'
import { SettingsRow } from './SettingsRow'
import { FormSection } from '@/components/ui/FormSection'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Check } from 'lucide-react'
import { currencySetValueAs } from '@/utils/currencyInput'

const currencyField = z
  .number()
  .min(0, 'No puede ser negativo')
  .refine(v => Math.round(v * 100) / 100 === v, { message: 'Máximo 2 decimales' })

const formSchema = z.object({
  worker_name: z.string().min(2, 'Requerido'),
  payment_type: z.enum(['hourly', 'daily']),
  daily_goal_hours: z.number().min(1, 'Mínimo 1h').max(24, 'Máximo 24h'),
  default_break_minutes: z.number().min(0, 'No puede ser negativo').max(180, 'Máximo 180 min (3h)'),
  hourly_rate: currencyField,
  daily_rate: currencyField,
  overtime_rate: currencyField,
  currency: z.string().min(1, 'Requerida'),
  theme: z.enum(['light', 'dark', 'system']),
})

export type FormValues = z.infer<typeof formSchema>

interface SettingsFormProps {
  initialData: Profile
  onSubmit: (data: FormValues) => void
  isPending: boolean
  onSignOut?: () => void
}

export function SettingsForm({ initialData, onSubmit, isPending, onSignOut }: SettingsFormProps) {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const [showSuccess, setShowSuccess] = useState(false)
  const [prevPending, setPrevPending] = useState(isPending)
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      payment_type: initialData.payment_type ?? 'hourly',
      // Show empty (placeholder) when value is 0, real value otherwise
      hourly_rate: initialData.hourly_rate || undefined,
      daily_rate: initialData.daily_rate || undefined,
      overtime_rate: initialData.overtime_rate || undefined,
      daily_goal_hours: initialData.daily_goal_minutes / 60,
    },
    mode: 'onBlur',
  })

  const selectedTheme = useWatch({ control, name: 'theme' })
  const paymentType = useWatch({ control, name: 'payment_type' }) || 'hourly'

  // Tema instantáneo
  useEffect(() => {
    if (selectedTheme) {
      setTheme(selectedTheme)
    }
  }, [selectedTheme, setTheme])

  // Toast de guardado exitoso
  useEffect(() => {
    if (prevPending && !isPending) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
    setPrevPending(isPending)
  }, [isPending, prevPending])

  const handleBlur = () => {
    if (isDirty) {
      handleSubmit(onSubmit)()
    }
  }

  useEffect(() => {
    reset({
      ...initialData,
      payment_type: initialData.payment_type ?? 'hourly',
      hourly_rate: initialData.hourly_rate || undefined,
      daily_rate: initialData.daily_rate || undefined,
      overtime_rate: initialData.overtime_rate || undefined,
      daily_goal_hours: initialData.daily_goal_minutes / 60,
    })
  }, [initialData, reset])

  const userName = user?.user_metadata?.full_name || 'Usuario'
  const userEmail = user?.email || ''
  const userAvatar = user?.user_metadata?.avatar_url
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <form className="w-full flex flex-col space-y-6 px-4 pb-12">
      
      <FormSection title="Perfil">
        <div className="grouped-list-item flex items-center p-4 bg-transparent">
          {userAvatar ? (
            <img src={userAvatar} alt="Avatar" className="w-16 h-16 rounded-full mr-4 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-border mr-4 flex items-center justify-center">
              <span className="text-[24px] font-bold text-sec">{userInitial}</span>
            </div>
          )}
          <div className="flex flex-col flex-1 justify-center">
            <span className="text-[24px] font-bold text-main tracking-tight">{userName}</span>
            <span className="text-[15px] text-sec mt-0.5">{userEmail}</span>
          </div>
        </div>
        <SettingsRow
          label="Nombre del trabajador"
          type="text"
          {...register('worker_name', { onBlur: handleBlur })}
          error={errors.worker_name?.message}
          placeholder="Tu nombre completo"
        />
      </FormSection>

      <FormSection title="Tipo de Trabajador">
        <SettingsRow
          label="Forma de pago"
          isSelect
          {...register('payment_type', { onChange: handleBlur })}
          error={errors.payment_type?.message}
        >
          <option value="hourly">Pago por horas</option>
          <option value="daily">Pago por jornal (fijo diario)</option>
        </SettingsRow>
      </FormSection>

      {paymentType === 'hourly' && (
        <FormSection title="Jornada">
          <SettingsRow
            label="Objetivo diario (h)"
            type="number"
            step="0.5"
            {...register('daily_goal_hours', { valueAsNumber: true, onBlur: handleBlur })}
            error={errors.daily_goal_hours?.message}
            placeholder="8"
          />
          <SettingsRow
            label="Descanso (min)"
            type="number"
            {...register('default_break_minutes', { valueAsNumber: true, onBlur: handleBlur })}
            error={errors.default_break_minutes?.message}
            placeholder="30"
          />
        </FormSection>
      )}

      <FormSection title="Salario">
        {paymentType === 'daily' ? (
          <SettingsRow
            label="Jornal diario"
            type="text"
            inputMode="decimal"
            {...register('daily_rate', { setValueAs: currencySetValueAs, onBlur: handleBlur })}
            error={errors.daily_rate?.message}
            placeholder="85,50"
          />
        ) : (
          <SettingsRow
            label="Precio hora normal"
            type="text"
            inputMode="decimal"
            {...register('hourly_rate', { setValueAs: currencySetValueAs, onBlur: handleBlur })}
            error={errors.hourly_rate?.message}
            placeholder="12,50"
          />
        )}
        <SettingsRow
          label="Precio extra"
          type="text"
          inputMode="decimal"
          {...register('overtime_rate', { setValueAs: currencySetValueAs, onBlur: handleBlur })}
          error={errors.overtime_rate?.message}
          placeholder="14,75"
        />
      </FormSection>

      <FormSection title="General">
        <SettingsRow
          label="Moneda"
          isSelect
          {...register('currency', { onChange: handleBlur })}
          error={errors.currency?.message}
        >
          <option value="€">€ (Euro)</option>
          <option value="$">$ (Dólar)</option>
          <option value="£">£ (Libra)</option>
        </SettingsRow>
        
        <SettingsRow
          label="Tema"
          isSelect
          {...register('theme', { onChange: handleBlur })}
          error={errors.theme?.message}
        >
          <option value="system">Sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </SettingsRow>
      </FormSection>

      {onSignOut && (
        <FormSection title="Cuenta">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full text-left px-4 h-[56px] flex items-center bg-transparent text-[17px] text-red-500 font-medium active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            Cerrar sesión
          </button>
        </FormSection>
      )}

      {/* Saving Indicator / Toast */}
      <div className={`fixed top-6 right-4 flex items-center space-x-2 bg-main/90 backdrop-blur text-card px-4 py-2.5 rounded-full text-[15px] font-medium shadow-lg transition-all duration-200 ease-out transform ${isPending || showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {isPending ? (
          <span>Guardando...</span>
        ) : showSuccess ? (
          <>
            <Check size={16} className="text-[#34C759]" />
            <span>Guardado</span>
          </>
        ) : null}
      </div>
    </form>
  )
}
