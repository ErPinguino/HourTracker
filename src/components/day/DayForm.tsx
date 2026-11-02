import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { hourlySchema, dailySchema } from '@/utils/dayValidation'
import type { WorkLog } from '@/types'
import { calculateWorkedMinutes } from '@/utils/calculateWorkedMinutes'
import { formatWorkedMinutes } from '@/utils/formatWorkedMinutes'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'
import { WorkLocationInput } from './WorkLocationInput'
import { useQuery } from '@tanstack/react-query'
import { getRecentWorkLocations } from '@/services/workLogs'

// ─── Schemas ─────────────────────────────────────────────────────────────────

import { normalizeTime, timeRegex } from '@/utils/time'

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
  const { data: recentLocations = [] } = useQuery({ queryKey: ['recentWorkLocations'], queryFn: getRecentWorkLocations })
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
    mode: 'onChange',
    defaultValues: {
      start_time: initialData.start_time?.slice(0, 5) || '',
      end_time: initialData.end_time?.slice(0, 5) || '',
      break_minutes: initialData.break_minutes ?? 0,
      notes: initialData.notes || '',
      work_location: initialData.work_location || '',
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
      work_location: initialData.work_location || '',
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="day-form flex flex-col min-w-0 w-full relative">
      <div className="space-y-4 flex-1 pb-4">
        {errors.work_location && <p role="alert" className="text-sm text-red-500">{errors.work_location.message}</p>}

        <div className="flex flex-col items-center justify-center pt-2 pb-1">
          <span className="text-[13px] font-semibold tracking-wider uppercase text-ter mb-1">
            Horas trabajadas
          </span>
          <span className="text-[40px] sm:text-[48px] leading-none font-bold text-main tracking-tight">
            {liveWorkedMinutes > 0 ? formatWorkedMinutes(liveWorkedMinutes) : '0 h'}
          </span>
        </div>

        <div className="premium-card overflow-hidden">
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-b border-border/40">
            <span className="text-[17px] text-main">Entrada</span>
            <div className="flex flex-col items-end">
              <input
                type="time"
                aria-label="Entrada" aria-invalid={!!errors.start_time} step={60} {...register('start_time', { setValueAs: normalizeTime })}
                className="text-[17px] text-right text-accent w-32 focus:outline-none bg-transparent"
              />
              {errors.start_time && <span role="alert" className="text-xs text-red-500 mt-1 max-w-[12rem] text-right">{errors.start_time.message}</span>}
            </div>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-b border-border/40">
            <span className="text-[17px] text-main">Salida</span>
            <div className="flex flex-col items-end">
              <input
                type="time"
                aria-label="Salida" aria-invalid={!!errors.end_time} step={60} {...register('end_time', { setValueAs: normalizeTime })}
                className="text-[17px] text-right text-accent w-32 focus:outline-none bg-transparent"
              />
              {errors.end_time && <span role="alert" className="text-xs text-red-500 mt-1 max-w-[12rem] text-right">{errors.end_time.message}</span>}
            </div>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-b border-border/40">
            <span className="text-[17px] text-main">Descanso (min)</span>
            <div className="flex flex-col items-end">
              <input
                type="number"
                aria-label="Descanso en minutos" min={0} step={1} aria-invalid={!!errors.break_minutes} {...register('break_minutes', { valueAsNumber: true })}
                className="text-[17px] text-right text-sec w-24 focus:outline-none bg-transparent"
              />
              {errors.break_minutes && <span role="alert" className="text-xs text-red-500 mt-1 max-w-[12rem] text-right">{errors.break_minutes.message}</span>}
            </div>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between">
            <span className="text-[17px] text-main whitespace-nowrap mr-4">Notas</span>
            <div className="flex flex-col items-end flex-1">
              <input
                type="text"
                placeholder="Opcional..."
                aria-label="Notas" {...register('notes')}
                className="text-[17px] text-right text-sec w-full focus:outline-none bg-transparent"
              />
            </div>
          </div>
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between">
            <label htmlFor="hourly-work-location" className="text-[17px] text-main">Lugar</label>
            <div className="min-w-0 w-2/3"><Controller name="work_location" control={control} render={({ field, fieldState }) => <WorkLocationInput id="hourly-work-location" value={field.value || ''} locations={recentLocations} onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref} disabled={isPending} invalid={!!fieldState.error} />} /></div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] bg-card border-t border-border flex justify-center z-10">
        <Button
          type="submit"
          disabled={isPending}
          fullWidth
          className="max-w-md shadow-sm h-[56px] rounded-[16px] text-[17px] font-semibold"
        >
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div role="status" className={`absolute bottom-full right-0 z-20 flex items-center space-x-2 bg-main/90 backdrop-blur text-card px-4 py-2.5 rounded-full text-[14px] font-medium shadow-lg transition-all duration-300 transform ${isPending || showSuccess || showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${showError ? 'bg-red-500 text-white' : ''}`}>
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
  const { data: recentLocations = [] } = useQuery({ queryKey: ['recentWorkLocations'], queryFn: getRecentWorkLocations })
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [prevPending, setPrevPending] = useState(isPending)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<DailyFormValues>({
    resolver: zodResolver(dailySchema),
    mode: 'onChange',
    defaultValues: {
      worked_day: initialData.worked_day ?? true,
      worked_extra: initialData.worked_extra ?? false,
      extra_hours: initialData.extra_hours || undefined,
      notes: initialData.notes || '',
      work_location: initialData.work_location || '',
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
      worked_day: initialData.worked_day ?? true,
      worked_extra: initialData.worked_extra ?? false,
      extra_hours: initialData.extra_hours || undefined,
      notes: initialData.notes || '',
      work_location: initialData.work_location || '',
    })
  }, [initialData, reset])

  const workedDay = useWatch({ control, name: 'worked_day' })
  const workedExtra = useWatch({ control, name: 'worked_extra' })

  useEffect(() => {
    if (!workedDay) {
      setValue('worked_extra', false)
      setValue('extra_hours', undefined)
    } else if (!workedExtra) {
      setValue('extra_hours', undefined)
    }
  }, [workedDay, workedExtra, setValue])

  const handleFormSubmit = (data: DailyFormValues) => {
    onSubmit(data, 0)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="day-form flex flex-col min-w-0 w-full relative">
      <div className="space-y-4 flex-1 pb-4">
        {errors.work_location && <p role="alert" className="text-sm text-red-500">{errors.work_location.message}</p>}

        <div className="premium-card overflow-hidden">
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between">
            <span className="text-[17px] text-main">¿Ha trabajado hoy?</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                aria-label="Ha trabajado hoy" {...register('worked_day')}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-t border-border/40">
            <label htmlFor="daily-work-location" className="text-[17px] text-main">Lugar</label>
            <div className="min-w-0 w-2/3"><Controller name="work_location" control={control} render={({ field, fieldState }) => <WorkLocationInput id="daily-work-location" value={field.value || ''} locations={recentLocations} onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref} disabled={isPending} invalid={!!fieldState.error} />} /></div>
          </div>
          
          {workedDay && (
            <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-t border-border/40">
              <span className="text-[17px] text-main">¿Horas extra hoy?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  aria-label="Horas extra hoy" {...register('worked_extra')}
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          )}

          {workedDay && workedExtra && (
            <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-t border-border/40">
              <span className="text-[17px] text-main">Cantidad (horas)</span>
              <div className="flex flex-col items-end">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  aria-label="Cantidad de horas extra" {...register('extra_hours', { setValueAs: value => value === '' ? undefined : Number(value) })}
                  className="text-[17px] text-right text-accent w-24 focus:outline-none bg-transparent"
                  placeholder="2.5"
                />
                {errors.extra_hours && <span role="alert" className="text-xs text-red-500 mt-1 max-w-[12rem] text-right">{errors.extra_hours.message}</span>}
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
                aria-label="Notas" {...register('notes')}
                className="text-[17px] text-right text-sec w-full focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] bg-card border-t border-border flex justify-center z-10">
        <Button
          type="submit"
          disabled={isPending}
          fullWidth
          className="max-w-md shadow-sm h-[56px] rounded-[16px] text-[17px] font-semibold"
        >
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div role="status" className={`absolute bottom-full right-0 z-20 flex items-center space-x-2 bg-main/90 backdrop-blur text-card px-4 py-2.5 rounded-full text-[14px] font-medium shadow-lg transition-all duration-300 transform ${isPending || showSuccess || showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${showError ? 'bg-red-500 text-white' : ''}`}>
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
