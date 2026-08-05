import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TopBar } from '@/components/layout/TopBar'
import { DayForm } from '@/components/day/DayForm'
import type { FormValues } from '@/components/day/DayForm'
import { getWorkLogByDate, upsertWorkLog } from '@/services/workLogs'
import { getProfile } from '@/services/profile'
import type { WorkLog } from '@/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function Day() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isFuture = date ? date > format(new Date(), 'yyyy-MM-dd') : false

  useEffect(() => {
    if (isFuture) {
      navigate('/', { replace: true })
    }
  }, [isFuture, navigate])

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: initialData, isLoading } = useQuery({
    queryKey: ['workLog', date],
    queryFn: () => getWorkLogByDate(date!),
    enabled: !!date && !isFuture,
  })

  const mutation = useMutation({
    mutationFn: (newLog: WorkLog) => upsertWorkLog(newLog),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['workLogs'] })
      await queryClient.refetchQueries({ queryKey: ['workLog', date] })
      setTimeout(() => {
        navigate(-1)
      }, 700)
    },
    onError: (error) => {
      console.error('Error al guardar el registro:', error)
    }
  })

  const handleSubmit = (data: FormValues, workedMinutes: number) => {
    mutation.mutate({
      ...initialData,
      date: date!,
      start_time: data.payment_type === 'hourly' ? data.start_time : null,
      end_time: data.payment_type === 'hourly' ? data.end_time : null,
      break_minutes: data.payment_type === 'hourly' ? data.break_minutes : null,
      worked_day: data.payment_type === 'daily' ? data.worked_day : true,
      worked_extra: data.payment_type === 'daily' ? (data.worked_extra ?? false) : false,
      extra_hours: data.payment_type === 'daily' ? (data.extra_hours ?? 0) : 0,
      worked_minutes: workedMinutes,
      notes: data.notes || '',
    })
  }

  const formattedDate = date ? format(parseISO(date), 'EEEE d MMMM', { locale: es }) : ''
  const displayTitle = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  if (isFuture) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center w-full pb-8">
        <TopBar title={displayTitle} showBack />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sec">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center w-full pb-8">
      <TopBar title={displayTitle} showBack />
      
      <div className="w-full px-4 mt-4 flex-1 flex flex-col">
        <DayForm 
          initialData={initialData || { break_minutes: profile?.default_break_minutes || 30 }} 
          paymentType={profile?.payment_type || 'hourly'}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
          isSuccess={mutation.isSuccess}
          isError={mutation.isError}
        />
      </div>
    </div>
  )
}
