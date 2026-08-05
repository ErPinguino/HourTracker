import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MonthSelectorProps {
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function MonthSelector({ currentMonth, onPrevMonth, onNextMonth }: MonthSelectorProps) {
  const monthString = format(currentMonth, 'MMMM yyyy', { locale: es })
  const capitalizedMonth = monthString.charAt(0).toUpperCase() + monthString.slice(1)

  return (
    <div className="flex justify-between items-center w-full px-2 mb-6">
      <button
        onClick={onPrevMonth}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronLeft size={24} className="text-gray-600" />
      </button>
      <h2 className="text-xl font-semibold text-gray-800">
        {capitalizedMonth}
      </h2>
      <button
        onClick={onNextMonth}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronRight size={24} className="text-gray-600" />
      </button>
    </div>
  )
}
