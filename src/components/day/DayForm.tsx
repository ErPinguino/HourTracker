import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { WorkLog } from '@/types'
import { calculateWorkedMinutes } from '@/utils/calculateWorkedMinutes'
import { formatWorkedMinutes } from '@/utils/formatWorkedMinutes'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const timeRegex = /^([01]\\d|2[0-3]):([0-5]\\d)$/

const hourlySchema = z.object({
  start_time: z.string().regex(timeRegex, 'Formato inválido (HH:mm)'),
  end_time: z.string().regex(timeRegex, 'Formato inválido (HH:mm)'),
  break_minutes: z.number().min(0, 'El descanso no puede ser negativo'),
  notes: z.string().optional(),
}).refine(data => {
  if (!timeRegex.test(data.start_time) || !timeRegex.test(data.end_time)) return true
  return data.end_time > data.start_time
}, {
  message: 'La salida debe ser posterior a la entrada',
  path: ['end_time'],
}).refine(data => {
  if (!timeRegex.test(data.start_time) || !timeRegex.test(data.end_time) || data.end_time <= data.start_time) return true
  const [sh, sm] = data.start_time.split(':').map(Number)
  const [eh, em] = data.end_time.split(':').map(Number)
  const diffMins = (eh * 60 + em) - (sh * 60 + sm)
  return data.break_minutes < diffMins
}, {
  message: 'El descanso no puede superar la jornada',
  path: ['break_minutes'],
})

const dailySchema = z.object({
  worked_extra: z.boolean(),
  extra_hours: z.number().optional(),
  notes: z.string().optional(),
}).refine(data => {
  if (!data.worked_extra) return true
  return (data.extra_hours ?? 0) > 0
}, {
  message: 'Indica las horas extra (mayor que 0)',
  path: ['extra_hours'],
})

export type HourlyFormValues = z.infer<typeof hourlySchema>
export type DailyFormValues = z.infer<typeof dailySchema>
// Union exported for the Day page handler
export type FormValues =
  | ({ payment_type: 'hourly' } & HourlyFormValues)
  | ({ payment_type: 'daily' } & DailyFormValues)

// ─── Props ────────────────────────────────────────────────────────────────────

interface DayFormProps {
  initialData: Partial<WorkLog>
  paymentType: 'hourly' | 'daily'
  onSubmit: (data: FormValues, workedMinutes: number) => void
  isPending: boolean
  isSuccess?: boolean
  isError?: boolean
}

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function HourlyForm({
  initialData,
  onSubmit,
  isPending,
  isSuccess,
  isError,
}: {
  initialData: Partial<WorkLog>
  onSubmit: (data: HourlyFormValues, workedMinutes: number) => void
  isPending: boolean
  isSuccess?: boolean
  isError?: boolean
}) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [prevPending, setPrevPending] = useState(isPending)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<HourlyFormValues>({
    resolver: zodResolver(hourlySchema),
    mode: 'onSubmit',
    defaultValues: {
      start_time: initialData.start_time?.slice(0, 5) || '',
      end_time: initialData.end_time?.slice(0, 5) || '',
      break_minutes: initialData.break_minutes ?? 0,
      notes: initialData.notes || '',
    },
  })

  useEffect(() => {
    if (prevPending && !isPending) {
      if (isSuccess) {
        setShowSuccess(true)
        const t = setTimeout(() => setShowSuccess(false), 2000)
        return () => clearTimeout(t)
      } else if (isError) {
        setShowError(true)
        const t = setTimeout(() => setShowError(false), 3000)
        return () => clearTimeout(t)
      }
    }
    setPrevPending(isPending)
  }, [isPending, prevPending, isSuccess, isError])

  useEffect(() => {
    reset({
      start_time: initialData.start_time?.slice(0, 5) || '',
      end_time: initialData.end_time?.slice(0, 5) || '',
      break_minutes: initialData.break_minutes ?? 0,
      notes: initialData.notes || '',
    })
  }, [initialData, reset])

  const startTime = useWatch({ control, name: 'start_time' })
  const endTime = useWatch({ control, name: 'end_time' })
  const breakMinutes = useWatch({ control, name: 'break_minutes' })

  let liveWorkedMinutes = 0
  if (timeRegex.test(startTime || '') && timeRegex.test(endTime || '') && (endTime || '') > (startTime || '')) {
    liveWorkedMinutes = calculateWorkedMinutes(startTime!, endTime!, breakMinutes || 0)
  }

  const handleFormSubmit = (data: HourlyFormValues) => {
    const workedMinutes = calculateWorkedMinutes(data.start_time, data.end_time, data.break_minutes)
    onSubmit(data, workedMinutes)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full flex-1 w-full relative">
      <div className="space-y-4 flex-1 pb-20">

        <div className="flex flex-col items-center justify-center pt-2 pb-1">
          <span className="text-[13px] font-semibold tracking-wider uppercase text-ter mb-1">
            Horas trabajadas
          </span>
          <span className="text-[56px] leading-none font-bold text-main tracking-tight">
            {liveWorkedMinutes > 0 ? formatWorkedMinutes(liveWorkedMinutes) : '0 h'}
          </span>
        </div>

        <div className="premium-card overflow-hidden">
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-b border-border/40">
            <span className="text-[17px] text-main">Entrada</span>
            <div className="flex flex-col items-end">
              <input
                type="time"
                {...register('start_time')}
                className="text-[17px] text-right text-accent w-32 focus:outline-none bg-transparent"
              />
              {errors.start_time && <span className="text-xs text-red-500 mt-1">{errors.start_time.message}</span>}
            </div>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-b border-border/40">
            <span className="text-[17px] text-main">Salida</span>
            <div className="flex flex-col items-end">
              <input
                type="time"
                {...register('end_time')}
                className="text-[17px] text-right text-accent w-32 focus:outline-none bg-transparent"
              />
              {errors.end_time && <span className="text-xs text-red-500 mt-1">{errors.end_time.message}</span>}
            </div>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-b border-border/40">
            <span className="text-[17px] text-main">Descanso (min)</span>
            <div className="flex flex-col items-end">
              <input
                type="number"
                {...register('break_minutes', { valueAsNumber: true })}
                className="text-[17px] text-right text-sec w-24 focus:outline-none bg-transparent"
              />
              {errors.break_minutes && <span className="text-xs text-red-500 mt-1">{errors.break_minutes.message}</span>}
            </div>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between">
            <span className="text-[17px] text-main whitespace-nowrap mr-4">Notas</span>
            <div className="flex flex-col items-end flex-1">
              <input
                type="text"
                placeholder="Opcional..."
                {...register('notes')}
                className="text-[17px] text-right text-sec w-full focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card/80 backdrop-blur-xl border-t border-border flex justify-center z-40">
        <Button
          type="submit"
          disabled={isPending}
          fullWidth
          className="max-w-md shadow-sm h-[56px] rounded-[16px] text-[17px] font-semibold"
        >
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className={`fixed top-6 right-4 z-50 flex items-center space-x-2 bg-main/90 backdrop-blur text-card px-4 py-2.5 rounded-full text-[14px] font-medium shadow-lg transition-all duration-300 transform ${isPending || showSuccess || showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${showError ? 'bg-red-500 text-white' : ''}`}>
        {isPending ? <span>Guardando...</span> : showSuccess ? <><Check size={16} className="text-[#34C759]" /><span>Guardado</span></> : showError ? <span>Error al guardar</span> : null}
      </div>
    </form>
  )
}

function DailyForm({
  initialData,
  onSubmit,
  isPending,
  isSuccess,
  isError,
}: {
  initialData: Partial<WorkLog>
  onSubmit: (data: DailyFormValues, workedMinutes: number) => void
  isPending: boolean
  isSuccess?: boolean
  isError?: boolean
}) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [prevPending, setPrevPending] = useState(isPending)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    mode: 'onSubmit',
    defaultValues: {
      worked_extra: initialData.worked_extra ?? false,
      extra_hours: initialData.extra_hours || undefined,
      notes: initialData.notes || '',
    },
  })

  useEffect(() => {
    if (prevPending && !isPending) {
      if (isSuccess) {
        setShowSuccess(true)
        const t = setTimeout(() => setShowSuccess(false), 2000)
        return () => clearTimeout(t)
      } else if (isError) {
        setShowError(true)
        const t = setTimeout(() => setShowError(false), 3000)
        return () => clearTimeout(t)
      }
    }
    setPrevPending(isPending)
  }, [isPending, prevPending, isSuccess, isError])

  useEffect(() => {
    reset({
      worked_extra: initialData.worked_extra ?? false,
      extra_hours: initialData.extra_hours || undefined,
      notes: initialData.notes || '',
    })
  }, [initialData, reset])

  const workedExtra = useWatch({ control, name: 'worked_extra' })

  const handleFormSubmit = (data: DailyFormValues) => {
    onSubmit(data, 0)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full flex-1 w-full relative">
      <div className="space-y-4 flex-1 pb-20">

        <div className="premium-card overflow-hidden">
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between">
            <span className="text-[17px] text-main">¿Horas extra hoy?</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register('worked_extra')}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {workedExtra && (
            <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-t border-border/40">
              <span className="text-[17px] text-main">Cantidad (horas)</span>
              <div className="flex flex-col items-end">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  {...register('extra_hours', { valueAsNumber: true })}
                  className="text-[17px] text-right text-accent w-24 focus:outline-none bg-transparent"
                  placeholder="2.5"
                />
                {errors.extra_hours && <span className="text-xs text-red-500 mt-1">{errors.extra_hours.message}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="premium-card overflow-hidden">
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between">
            <span className="text-[17px] text-main whitespace-nowrap mr-4">Notas</span>
            <div className="flex flex-col items-end flex-1">
              <input
                type="text"
                placeholder="Opcional..."
                {...register('notes')}
                className="text-[17px] text-right text-sec w-full focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-card/80 backdrop-blur-xl border-t border-border flex justify-center z-40">
        <Button
          type="submit"
          disabled={isPending}
          fullWidth
          className="max-w-md shadow-sm h-[56px] rounded-[16px] text-[17px] font-semibold"
        >
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className={`fixed top-6 right-4 z-50 flex items-center space-x-2 bg-main/90 backdrop-blur text-card px-4 py-2.5 rounded-full text-[14px] font-medium shadow-lg transition-all duration-300 transform ${isPending || showSuccess || showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${showError ? 'bg-red-500 text-white' : ''}`}>
        {isPending ? <span>Guardando...</span> : showSuccess ? <><Check size={16} className="text-[#34C759]" /><span>Guardado</span></> : showError ? <span>Error al guardar</span> : null}
      </div>
    </form>
  )
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export function DayForm({ initialData, paymentType, onSubmit, isPending, isSuccess, isError }: DayFormProps) {
  if (paymentType === 'daily') {
    return (
      <DailyForm
        initialData={initialData}
        isPending={isPending}
        isSuccess={isSuccess}
        isError={isError}
        onSubmit={(data, workedMinutes) =>
          onSubmit({ payment_type: 'daily', ...data }, workedMinutes)
        }
      />
    )
  }

  return (
    <HourlyForm
      initialData={initialData}
      isPending={isPending}
      isSuccess={isSuccess}
      isError={isError}
      onSubmit={(data, workedMinutes) =>
        onSubmit({ payment_type: 'hourly', ...data }, workedMinutes)
      }
    />
  )
}
