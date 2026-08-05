import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WorkLog } from '@/types'

interface CalendarProps {
  month: Date
  workLogs: WorkLog[]
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDate: (date: Date) => void
}

export function Calendar({ month, workLogs, onPrevMonth, onNextMonth, onSelectDate }: CalendarProps) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const getWorkLogForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return workLogs.find(log => log.date === dateStr)
  }

  return (
    <div className="w-full bg-transparent px-2">
      {/* Cabecera */}
      <div className="flex justify-between items-center py-4 mb-6">
        <h2 className="text-[22px] font-bold text-main capitalize tracking-tight">
          {format(month, 'MMMM yyyy', { locale: es })}
        </h2>
        
        <div className="flex space-x-6">
          <button
            onClick={onPrevMonth}
            className="text-accent hover:opacity-60 transition-opacity active:scale-90"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <button
            onClick={onNextMonth}
            className="text-accent hover:opacity-60 transition-opacity active:scale-90"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {/* Grid del Calendario con Animación de Fade */}
      <div className="pb-4 animate-fade-in" key={month.toString()}>
        <div className="grid grid-cols-7 mb-6">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[13px] font-medium text-ter">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-y-6">
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, month)
            const isCurrentDay = isToday(day)
            const dayStr = format(day, 'yyyy-MM-dd')
            const isFuture = dayStr > todayStr
            const log = getWorkLogForDate(day)
            const showDot = log && !isCurrentDay // HIG: No dot if selected (today)
            
            return (
              <div key={day.toString()} className="flex flex-col items-center justify-start h-12">
                <button
                  onClick={() => !isFuture && onSelectDate(day)}
                  disabled={isFuture}
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center text-[17px] leading-none
                    transition-all
                    ${isFuture ? 'text-ter opacity-20 cursor-default' : 'active:scale-[0.90] cursor-pointer'}
                    ${!isCurrentMonth && !isFuture ? 'text-ter opacity-50' : ''}
                    ${isCurrentMonth && !isFuture ? 'text-main' : ''}
                    ${isCurrentDay ? 'bg-accent text-white font-semibold' : ''}
                    ${!isCurrentDay && !isFuture ? 'hover:bg-black/5 dark:hover:bg-white/10' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
                {/* Punto indicador VERDE si hay registro y no es el día actual */}
                <div className="h-2 flex items-center justify-center mt-1">
                  {showDot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
