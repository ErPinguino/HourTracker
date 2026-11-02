import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { Dialog } from '@animate-ui/react/primitives/base-ui/dialog'
import { DayForm, type FormValues } from './DayForm'
import { getProfile } from '@/services/profile'
import { deleteWorkLog, getWorkLogByDate, upsertWorkLog } from '@/services/workLogs'

export function DayDialog({ date, onClose }: { date: string | null; onClose: () => void }) {
  const [displayDate, setDisplayDate] = useState(date)
  if (date && date !== displayDate) setDisplayDate(date)
  const [viewport, setViewport] = useState({ height: window.visualViewport?.height ?? window.innerHeight, top: window.visualViewport?.offsetTop ?? 0 })
  useEffect(() => {
    const update = () => setViewport({ height: window.visualViewport?.height ?? window.innerHeight, top: window.visualViewport?.offsetTop ?? 0 })
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => { window.visualViewport?.removeEventListener('resize', update); window.visualViewport?.removeEventListener('scroll', update) }
  }, [])
  const queryClient = useQueryClient()
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile })
  const { data: initialData, isLoading, isError: loadError, refetch } = useQuery({ queryKey: ['workLog', displayDate], queryFn: () => getWorkLogByDate(displayDate!), enabled: !!date })
  const mutation = useMutation({
    mutationFn: ({ data, workedMinutes }: { data: FormValues; workedMinutes: number }) => upsertWorkLog({ ...initialData, date: displayDate!, start_time: data.payment_type === 'hourly' ? data.start_time : null, end_time: data.payment_type === 'hourly' ? data.end_time : null, break_minutes: data.payment_type === 'hourly' ? data.break_minutes : null, worked_day: data.payment_type === 'daily' ? data.worked_day : true, worked_extra: data.payment_type === 'daily' ? (data.worked_extra ?? false) : false, extra_hours: data.payment_type === 'daily' ? (data.extra_hours ?? 0) : 0, worked_minutes: workedMinutes, notes: data.notes || '', work_location: data.work_location?.trim() || null }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['workLogs'] }); await queryClient.invalidateQueries({ queryKey: ['workLog', displayDate] }); await queryClient.invalidateQueries({ queryKey: ['recentWorkLocations'] }); onClose() },
  })
  const remove = useMutation({ mutationFn: () => deleteWorkLog(displayDate!), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['workLogs'] }); await queryClient.invalidateQueries({ queryKey: ['workLog', displayDate] }); onClose() } })

  const defaults = useMemo(() => initialData || { break_minutes: profile?.default_break_minutes ?? 30 }, [initialData, profile?.default_break_minutes])
  const busy = mutation.isPending || remove.isPending
  if (!displayDate) return null
  const title = format(parseISO(displayDate), 'EEEE d MMMM', { locale: es })
  return <Dialog.Root open={!!date} onOpenChange={(nextOpen: boolean) => { if (!nextOpen && !busy) onClose() }}>
    <Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]" /><Dialog.Viewport style={{ height: viewport.height, top: viewport.top }} className="day-dialog-viewport fixed inset-x-0 z-50 flex items-center justify-center"><Dialog.Popup transition={{ duration: 0.18 }} exitTransition={{ duration: 0.14 }} className="day-dialog relative w-full max-w-lg min-w-0 overflow-y-auto overscroll-contain rounded-[24px] bg-card text-main shadow-2xl outline-none" aria-describedby="day-dialog-description">
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-4 pr-20 backdrop-blur"><Dialog.Title className="text-lg leading-snug font-bold capitalize break-words">{title}</Dialog.Title><Dialog.Description id="day-dialog-description" className="mt-1 text-xs uppercase tracking-widest text-sec">{initialData ? 'Editar jornada' : 'Añadir jornada'}</Dialog.Description><Dialog.Close aria-label="Cerrar" disabled={busy} className="absolute right-2 top-3 min-h-11 rounded-full px-3 text-sec hover:bg-black/5 dark:hover:bg-white/10">Cerrar</Dialog.Close></div>
      {loadError ? <div role="alert" className="p-5 text-red-500">No se pudo cargar la jornada. <button onClick={() => refetch()} className="underline">Reintentar</button></div> : isLoading || !profile ? <div className="p-8 text-center text-sec">Cargando…</div> : <div className="p-4"><DayForm key={displayDate} initialData={defaults} paymentType={profile.payment_type} onSubmit={(data, workedMinutes) => mutation.mutate({ data, workedMinutes })} isPending={busy} isSuccess={mutation.isSuccess} isError={mutation.isError} />{remove.isError && <p role="alert" className="mt-3 text-red-500">No se pudo eliminar la jornada. Inténtalo de nuevo.</p>}{initialData && <button onClick={() => remove.mutate()} disabled={busy} className="mt-4 w-full h-12 rounded-2xl text-red-500 bg-red-500/10 font-semibold flex items-center justify-center gap-2"><Trash2 size={18} />Eliminar jornada</button>}</div>}
    </Dialog.Popup></Dialog.Viewport></Dialog.Portal>
  </Dialog.Root>
}
