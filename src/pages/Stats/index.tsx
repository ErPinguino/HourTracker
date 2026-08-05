import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subMonths, addMonths } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { getWorkLogsByMonth } from '@/services/workLogs'
import { getProfile } from '@/services/profile'
import { calculatePayroll } from '@/utils/calculatePayroll'
import { MonthSelector } from '@/components/stats/MonthSelector'
import { StatsGrid } from '@/components/stats/StatsGrid'
import { TopBar } from '@/components/layout/TopBar'

export function Stats() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { data: profile, isLoading: isLoadingProfile, isError: isErrorProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: workLogs = [], isLoading: isLoadingLogs, isError: isErrorLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['workLogs', format(currentMonth, 'yyyy-MM')],
    queryFn: () => getWorkLogsByMonth(currentMonth),
    enabled: !!user,
  })

  const stats = useMemo(() => {
    if (!profile) return null
    return calculatePayroll(workLogs, profile)
  }, [workLogs, profile])

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  const isLoading = isLoadingProfile || isLoadingLogs
  const isError = isErrorProfile || isErrorLogs

  return (
    <div className="flex-1 flex flex-col items-center w-full pb-8">
      <TopBar title="Estadísticas" />

      <div className="px-4 mt-2 w-full">
        <MonthSelector 
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        {isLoading ? (
          <div className="flex justify-center p-8">
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <p className="text-red-500 text-center">No se pudieron cargar los datos.</p>
            <button 
              onClick={() => { refetchProfile(); refetchLogs(); }}
              className="text-blue-500 font-medium active:opacity-70"
            >
              Reintentar
            </button>
          </div>
        ) : !profile || !stats ? (
          <div className="flex justify-center p-8">
            <p className="text-gray-500">No hay datos disponibles.</p>
          </div>
        ) : (
          <StatsGrid stats={stats} currency={profile.currency} />
        )}
      </div>
    </div>
  )
}
