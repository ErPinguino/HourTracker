import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { addMonths, subMonths, format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { getWorkLogsByMonth } from '@/services/workLogs'
import { getProfile } from '@/services/profile'
import { calculatePayroll } from '@/utils/calculatePayroll'
import { Calendar } from '@/components/calendar/Calendar'
import { TodayCard } from '@/components/home/TodayCard'
import { Settings, LogOut, ChevronRight, Clock, CalendarDays, Activity } from 'lucide-react'
import { shareMonthlyPdf } from '@/utils/shareMonthlyPdf'
import { formatWorkedMinutes } from '@/utils/formatWorkedMinutes'
import { useRef } from 'react'
import { ActionSheet } from '@/components/ui/ActionSheet'
import { MonthlyImageTemplate } from '@/components/share/MonthlyImageTemplate'
import { shareMonthlyImage } from '@/utils/shareMonthlyImage'

export function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: workLogs = [], isError: isLogsError } = useQuery({
    queryKey: ['workLogs', format(currentMonth, 'yyyy-MM')],
    queryFn: () => getWorkLogsByMonth(currentMonth),
    enabled: !!user,
  })

  const payroll = useMemo(() => {
    if (!profile) return null
    return calculatePayroll(workLogs, profile)
  }, [workLogs, profile])

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  const handleSelectDate = (date: Date) => {
    navigate(`/day/${format(date, 'yyyy-MM-dd')}`)
  }

  const handleSharePdf = async () => {
    if (!profile) return
    try {
      setIsGeneratingPdf(true)
      const freshLogs = await getWorkLogsByMonth(currentMonth)
      await shareMonthlyPdf(currentMonth, freshLogs, profile)
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message)
      }
    } finally {
      setIsGeneratingPdf(false)
      setIsActionSheetOpen(false)
    }
  }

  const handleShareImage = async () => {
    if (!profile || !imageRef.current) return
    try {
      setIsGeneratingPdf(true)
      await shareMonthlyImage(imageRef.current, currentMonth)
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message)
      }
    } finally {
      setIsGeneratingPdf(false)
      setIsActionSheetOpen(false)
    }
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const formatCurrency = (val: number) => {
    if (!profile) return ''
    return new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2 }).format(val) + ' ' + profile.currency
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLog = workLogs.find(log => log.date === todayStr)
  const googleName = user?.user_metadata?.full_name?.split(' ')[0]
  const userName = profile?.worker_name || googleName || 'Trabajador'
  const userAvatar = user?.user_metadata?.avatar_url
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex-1 flex flex-col items-center w-full pb-16">
      
      {/* Header Nativo */}
      <div className="w-full flex items-end justify-between px-6 pt-12 pb-6 bg-transparent shrink-0">
        <div className="flex flex-col">
          <span className="text-[15px] font-medium text-sec mb-0.5">
            {getGreeting()}
          </span>
          <h1 className="text-[34px] font-extrabold text-main leading-none tracking-tight">
            {userName}
          </h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-full bg-border flex items-center justify-center overflow-hidden focus:outline-none transition-transform active:scale-95 md:hidden"
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[14px] font-bold text-sec">{userInitial}</span>
            )}
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 md:hidden" 
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-3 w-56 bg-card/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border py-2 z-50 overflow-hidden md:hidden">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full px-4 py-3 text-left flex items-center space-x-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Settings size={20} className="text-sec" />
                  <span className="text-[17px] text-main">Ajustes</span>
                </button>
                <div className="h-[1px] bg-border my-1 mx-4" />
                <button
                  onClick={signOut}
                  className="w-full px-4 py-3 text-left flex items-center space-x-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <LogOut size={20} className="text-red-500" />
                  <span className="text-[17px] text-red-500">Cerrar sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isLogsError && (
        <div className="w-full px-6 mb-4">
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-[16px] text-[15px] font-medium flex items-center justify-center">
            Problema de conexión. Algunos datos podrían no estar actualizados.
          </div>
        </div>
      )}

      {/* Bloque 1: Hoy */}
      <div className="w-full px-6 mb-8">
        <TodayCard 
          log={todayLog} 
          profile={profile}
          onClick={() => handleSelectDate(new Date())}
        />
      </div>

      {/* Bloque 2: Calendario */}
      <div className="w-full px-4 mb-10">
        <Calendar
          month={currentMonth}
          workLogs={workLogs}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={handleSelectDate}
        />
      </div>

      {/* Bloque 3: Resumen del mes (Wallet Style) */}
      {payroll && (
        <div className="w-full px-6 mb-8">
          <div className="premium-card overflow-hidden">
            {/* Header del Ticket */}
            <div className="px-5 pt-6 pb-5 border-b border-border/60">
              <span className="text-[13px] font-medium text-sec uppercase tracking-widest block mb-1">
                Ganado este mes
              </span>
              <span className="text-[34px] font-extrabold text-main tracking-tight leading-none">
                {formatCurrency(payroll.totalPay)}
              </span>
            </div>
            
            {/* Desglose */}
            <div className="px-5 py-2 flex flex-col">
              {payroll.paymentType === 'daily' ? (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
                    <div className="flex items-center space-x-3">
                      <CalendarDays size={18} className="text-ter" />
                      <span className="text-[17px] text-sec">Jornales registrados</span>
                    </div>
                    <span className="text-[17px] text-main font-medium">{payroll.totalJornales}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
                    <div className="flex items-center space-x-3">
                      <Activity size={18} className="text-ter" />
                      <span className="text-[17px] text-sec">Horas extra</span>
                    </div>
                    <span className="text-[17px] text-main font-medium">{payroll.totalExtraHours > 0 ? `${payroll.totalExtraHours}h` : '—'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
                    <div className="flex items-center space-x-3">
                      <Clock size={18} className="text-ter" />
                      <span className="text-[17px] text-sec">Horas trabajadas</span>
                    </div>
                    <span className="text-[17px] text-main font-medium">{formatWorkedMinutes(payroll.totalWorkedMinutes)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
                    <div className="flex items-center space-x-3">
                      <CalendarDays size={18} className="text-ter" />
                      <span className="text-[17px] text-sec">Días registrados</span>
                    </div>
                    <span className="text-[17px] text-main font-medium">{payroll.workedDays}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
                    <div className="flex items-center space-x-3">
                      <Activity size={18} className="text-ter" />
                      <span className="text-[17px] text-sec">Horas extra</span>
                    </div>
                    <span className="text-[17px] text-main font-medium">{formatWorkedMinutes(payroll.overtimeMinutes)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bloque 4: Acción (Compartir) - iOS Settings Row Style */}
      <div className="w-full px-6">
        <button
          onClick={() => setIsActionSheetOpen(true)}
          disabled={isGeneratingPdf || workLogs.length === 0}
          className="w-full bg-card border border-border rounded-[16px] px-4 py-3.5 flex items-center justify-between active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
        >
          <span className="text-[17px] text-accent">
            {isGeneratingPdf ? 'Generando...' : 'Compartir'}
          </span>
          <ChevronRight size={20} className="text-ter" />
        </button>
      </div>

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onShareImage={handleShareImage}
        onSharePdf={handleSharePdf}
      />
      
      {profile && (
        <MonthlyImageTemplate
          ref={imageRef}
          month={currentMonth}
          workLogs={workLogs}
          profile={profile}
        />
      )}

      {/* Error Toast */}
      <div className={`fixed top-6 right-4 z-50 flex items-center space-x-2 bg-red-500/95 backdrop-blur text-white px-4 py-3 rounded-full text-[15px] font-medium shadow-lg transition-all duration-200 ease-out transform ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <span>{toastMessage}</span>
      </div>

    </div>
  )
}
