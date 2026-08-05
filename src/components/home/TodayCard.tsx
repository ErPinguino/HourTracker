import { ChevronRight } from 'lucide-react'
import type { WorkLog } from '@/types'
import { calculateWorkedMinutes } from '@/utils/calculateWorkedMinutes'
import { formatWorkedMinutes } from '@/utils/formatWorkedMinutes'

interface TodayCardProps {
  log?: WorkLog
  onClick: () => void
}

export function TodayCard({ log, onClick }: TodayCardProps) {
  const isRegistered = !!log && !!log.start_time && !!log.end_time

  let workedMinutes = 0
  if (isRegistered) {
    workedMinutes = calculateWorkedMinutes(log.start_time, log.end_time, log.break_minutes)
  }

  return (
    <div 
      onClick={onClick}
      className="w-full bg-card border border-border rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] cursor-pointer active:scale-[0.98] transition-all duration-300 overflow-hidden relative"
    >
      {!isRegistered ? (
        <div className="p-6 flex items-center justify-between">
          <span className="text-[17px] text-sec font-medium">No has registrado hoy</span>
          <div className="flex items-center space-x-1 text-accent">
            <span className="text-[17px] font-medium">Añadir</span>
            <ChevronRight size={18} />
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[13px] font-medium text-sec uppercase tracking-widest">
              Hoy has trabajado
            </span>
            <ChevronRight size={20} className="text-ter" />
          </div>
          
          <div className="flex flex-col mb-1">
            <span className="text-[54px] font-extrabold text-main leading-none tracking-tight">
              {formatWorkedMinutes(workedMinutes)}
            </span>
          </div>

          <div className="mt-3 text-[15px] text-sec font-medium">
            Entrada {log.start_time} — Salida {log.end_time}
          </div>
        </div>
      )}
    </div>
  )
}
