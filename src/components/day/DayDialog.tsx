import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { Dialog } from '@animate-ui/react/primitives/base-ui/dialog'
import { DayForm, type FormValues } from './DayForm'
import { getProfile } from '@/services/profile'
import { deleteWorkLog, getWorkLogByDate, upsertWorkLog } from '@/services/workLogs'

export function DayDialog({ date, onClose }: { date: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile })
  const { data: initialData, isLoading } = useQuery({ queryKey: ['workLog', date], queryFn: () => getWorkLogByDate(date!), enabled: !!date })
  const mutation = useMutation({
    mutationFn: ({ data, workedMinutes }: { data: FormValues; workedMinutes: number }) => upsertWorkLog({ ...initialData, date: date!, start_time: data.payment_type === 'hourly' ? data.start_time : null, end_time: data.payment_type === 'hourly' ? data.end_time : null, break_minutes: data.payment_type === 'hourly' ? data.break_minutes : null, worked_day: data.payment_type === 'daily' ? data.worked_day : true, worked_extra: data.payment_type === 'daily' ? (data.worked_extra ?? false) : false, extra_hours: data.payment_type === 'daily' ? (data.extra_hours ?? 0) : 0, worked_minutes: workedMinutes, notes: data.notes || '', work_location: data.work_location?.trim() || null }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['workLogs'] }); await queryClient.invalidateQueries({ queryKey: ['workLog', date] }); onClose() },
  })
  const remove = useMutation({ mutationFn: () => deleteWorkLog(date!), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['workLogs'] }); onClose() } })

  if (!date) return null
  const title = format(parseISO(date), 'EEEE d MMMM', { locale: es })
  return <Dialog.Root open={!!date} onOpenChange={(nextOpen: boolean) => { if (!nextOpen) onClose() }}>
    <Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]" /><Dialog.Popup from="bottom" className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-card text-main shadow-2xl outline-none sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[28px]" aria-describedby="day-dialog-description">
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-4 backdrop-blur"><Dialog.Title className="text-xl font-bold capitalize">{title}</Dialog.Title><Dialog.Description id="day-dialog-description" className="text-xs uppercase tracking-widest text-ter">{initialData ? 'Editar jornada' : 'Añadir jornada'}</Dialog.Description><Dialog.Close aria-label="Cerrar" className="absolute right-4 top-4 rounded-full p-2 text-sec hover:bg-black/5 dark:hover:bg-white/10">Cerrar</Dialog.Close></div>
      {isLoading || !profile ? <div className="p-8 text-center text-sec">Cargando…</div> : <div className="p-4"><DayForm initialData={initialData || { break_minutes: profile.default_break_minutes || 30 }} paymentType={profile.payment_type} onSubmit={(data, workedMinutes) => mutation.mutate({ data, workedMinutes })} isPending={mutation.isPending} isSuccess={mutation.isSuccess} isError={mutation.isError} />{initialData && <button onClick={() => remove.mutate()} disabled={remove.isPending} className="mt-4 w-full h-12 rounded-2xl text-red-500 bg-red-500/10 font-semibold flex items-center justify-center gap-2"><Trash2 size={18} />Eliminar jornada</button>}</div>}
    </Dialog.Popup></Dialog.Portal>
  </Dialog.Root>
}
