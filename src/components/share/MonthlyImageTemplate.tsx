import React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { WorkLog, Profile } from '@/types'
import { calculatePayroll } from '@/utils/calculatePayroll'
import { formatWorkedMinutes } from '@/utils/formatWorkedMinutes'

interface Props {
  month: Date
  workLogs: WorkLog[]
  profile: Profile
}

export const MonthlyImageTemplate = React.forwardRef<HTMLDivElement, Props>(({ month, workLogs, profile }, ref) => {
  const monthString = format(month, 'MMMM yyyy', { locale: es })
  const capitalizedMonth = monthString.charAt(0).toUpperCase() + monthString.slice(1)
  
  const sortedLogs = [...workLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const payroll = calculatePayroll(sortedLogs, profile)
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'decimal', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val) + ' ' + profile.currency
  }
  
  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1350 }}
      className="fixed top-0 left-0 -z-50 opacity-0 bg-[#F3F4F8] flex items-center justify-center pointer-events-none"
    >
      <div className="w-[920px] h-[1150px] bg-white rounded-[48px] shadow-[0_32px_64px_rgba(0,0,0,0.06)] flex flex-col items-center py-16 px-24">
        
        {/* Cabecera */}
        <h1 className="text-[#0A84FF] text-4xl font-bold mb-3 tracking-tight">HourTrack</h1>
        <div className="text-gray-500 text-3xl font-medium mb-3">{profile.worker_name || 'Trabajador'}</div>
        <h2 className="text-gray-900 text-[56px] font-bold mb-10">{capitalizedMonth}</h2>
        
        <div className="w-full h-px bg-gray-200 mb-10" />
        
        {/* Total Ganado */}
        <div className="text-[#0A84FF] text-[96px] font-bold leading-none tracking-tighter mb-6">
          {formatCurrency(payroll.totalPay)}
        </div>
        <p className="text-gray-500 text-3xl font-medium mb-14">Total ganado</p>
        
        <div className="w-full h-px bg-gray-200 mb-14" />
        
        {/* Indicadores */}
        <div className="flex w-full justify-between items-center mb-14 px-4">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-gray-900 mb-3">{formatWorkedMinutes(payroll.regularMinutes)}</span>
            <span className="text-2xl text-gray-500">normales</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-gray-900 mb-3">{formatWorkedMinutes(payroll.overtimeMinutes)}</span>
            <span className="text-2xl text-gray-500">extras</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-gray-900 mb-3">{payroll.workedDays}</span>
            <span className="text-2xl text-gray-500">días</span>
          </div>
        </div>
        
        <div className="w-full h-px bg-gray-200 mb-12" />
        
        {/* Listado de días (resumen limitado para no desbordar) */}
        <div className="flex-1 w-full flex flex-col gap-10 overflow-hidden">
          {sortedLogs.slice(0, 6).map(log => {
             const dateObj = new Date(`${log.date}T12:00:00`)
             const dayStr = format(dateObj, 'dd MMM', { locale: es })
             const capitalizedDay = dayStr.charAt(0).toUpperCase() + dayStr.slice(1)
             const dailyPay = calculatePayroll([log], profile)
             
             return (
               <div key={log.id} className="flex w-full justify-between items-center text-[28px]">
                 <span className="text-gray-900 font-semibold w-1/3">{capitalizedDay}</span>
                 <span className="text-gray-500 font-medium w-1/3 text-center">{formatWorkedMinutes(log.worked_minutes)}</span>
                 <span className="text-gray-900 font-bold w-1/3 text-right">{formatCurrency(dailyPay.totalPay)}</span>
               </div>
             )
          })}
          {sortedLogs.length > 6 && (
            <div className="text-center text-gray-400 text-[26px] font-medium mt-6">
              ... y {sortedLogs.length - 6} días más
            </div>
          )}
        </div>
        
        {/* Pie */}
        <div className="mt-auto flex flex-col items-center justify-end w-full">
           <div className="w-full h-px bg-gray-200 mb-10" />
           <p className="text-gray-400 text-2xl font-medium tracking-wide">
             Generado por HourTrack
           </p>
        </div>
      </div>
    </div>
  )
})
