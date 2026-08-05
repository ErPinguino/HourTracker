import { ChevronRight } from 'lucide-react'
import type { WorkLog, Profile } from '@/types'
import { calculateWorkedMinutes } from '@/utils/calculateWorkedMinutes'
import { formatWorkedMinutes } from '@/utils/formatWorkedMinutes'

interface TodayCardProps {
  log?: WorkLog
  profile?: Profile | null
  onClick: () => void
}

export function TodayCard({ log, profile, onClick }: TodayCardProps) {
  const paymentType = profile?.payment_type ?? 'hourly'
  const currency = profile?.currency ?? '€'

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2 }).format(val) + ' ' + currency

  // ── Hourly mode ──────────────────────────────────────────────────────────────
  const isRegisteredHourly = !!log && !!log.start_time && !!log.end_time

  let workedMinutes = 0
  if (paymentType === 'hourly' && isRegisteredHourly) {
    workedMinutes = calculateWorkedMinutes(log!.start_time!, log!.end_time!, log!.break_minutes ?? 0)
  }

  // ── Daily mode ───────────────────────────────────────────────────────────────
  const isRegisteredDaily = !!log

  const extraHours = log?.worked_extra ? (log?.extra_hours ?? 0) : 0
  const dailyTotal = paymentType === 'daily' && isRegisteredDaily
    ? (profile?.daily_rate ?? 0) + extraHours * (profile?.overtime_rate ?? 0)
    : 0

  // ── Shared ───────────────────────────────────────────────────────────────────
  const isRegistered = paymentType === 'hourly' ? isRegisteredHourly : isRegisteredDaily

  return (
    <div
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] cursor-pointer active:scale-[0.98] transition-all duration-300 overflow-hidden relative"
    >
      {!isRegistered ? (
        /* ── Empty state ──────────────────────────────────────────────────── */
        <div className="p-6 flex items-center justify-between">
          <span className="text-[17px] text-sec font-medium">No has registrado hoy</span>
          <div className="flex items-center space-x-1 text-accent">
            <span className="text-[17px] font-medium">Añadir</span>
            <ChevronRight size={18} />
          </div>
        </div>

      ) : paymentType === 'hourly' ? (
        /* ── Hourly registered ────────────────────────────────────────────── */
        <div className="p-6 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[13px] font-medium text-sec uppercase tracking-widest">
              Hoy has trabajado
            </span>
            <ChevronRight size={20} className="text-ter" />
          </div>
          <span className="text-[54px] font-extrabold text-main leading-none tracking-tight mb-3">
            {formatWorkedMinutes(workedMinutes)}
          </span>
          <div className="text-[15px] text-sec font-medium">
            Entrada {log!.start_time} — Salida {log!.end_time}
          </div>
        </div>

      ) : (
        /* ── Daily registered — importe como protagonista ─────────────────── */
        <div className="p-6 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[13px] font-medium text-sec uppercase tracking-widest">
              Hoy
            </span>
            <ChevronRight size={20} className="text-ter" />
          </div>
          <span className="text-[54px] font-extrabold text-main leading-none tracking-tight mb-3">
            {formatCurrency(dailyTotal)}
          </span>
          <div className="text-[15px] text-sec font-medium">
            {extraHours > 0
              ? `Incluye ${extraHours}${extraHours === 1 ? ' hora' : ' h'} extra`
              : 'Jornada registrada'}
          </div>
        </div>
      )}
    </div>
  )
}
