import { format } from 'date-fns'

interface CalendarDayProps {
  date: Date
  isCurrentMonth: boolean
  hasWorkLog: boolean
  onSelectDate: (date: Date) => void
}

export function CalendarDay({ date, isCurrentMonth, hasWorkLog, onSelectDate }: CalendarDayProps) {
  const dayNumber = format(date, 'd')

  return (
    <button
      onClick={() => onSelectDate(date)}
      className="flex flex-col items-center justify-center py-3 px-1 rounded-xl hover:bg-gray-100 transition-colors"
    >
      <span
        className={`text-lg mb-1 ${
          isCurrentMonth ? 'text-gray-900 font-medium' : 'text-gray-300 font-normal'
        }`}
      >
        {dayNumber}
      </span>
      <div className="h-1.5 w-1.5 rounded-full">
        {hasWorkLog && <div className="h-full w-full bg-green-500 rounded-full" />}
      </div>
    </button>
  )
}
