import type { WorkLog, Profile } from '@/types'

export interface PayrollResult {
  workedDays: number
  regularMinutes: number
  overtimeMinutes: number
  totalWorkedMinutes: number
  regularPay: number
  overtimePay: number
  totalPay: number
  balanceMinutes: number
  longestDay: number
  shortestDay: number
  averageMinutes: number
}

export function calculatePayroll(workLogs: WorkLog[], profile: Profile): PayrollResult {
  if (!workLogs || workLogs.length === 0) {
    return {
      workedDays: 0,
      regularMinutes: 0,
      overtimeMinutes: 0,
      totalWorkedMinutes: 0,
      regularPay: 0,
      overtimePay: 0,
      totalPay: 0,
      balanceMinutes: 0,
      longestDay: 0,
      shortestDay: 0,
      averageMinutes: 0,
    }
  }

  const workedDays = workLogs.length
  
  let totalWorkedMinutes = 0
  let regularMinutes = 0
  let overtimeMinutes = 0
  
  let longestDay = workLogs[0].worked_minutes
  let shortestDay = workLogs[0].worked_minutes

  for (const log of workLogs) {
    const worked = log.worked_minutes
    totalWorkedMinutes += worked
    
    // Calcular regular vs extra
    const regular = Math.min(worked, profile.daily_goal_minutes)
    const extra = Math.max(0, worked - profile.daily_goal_minutes)
    
    regularMinutes += regular
    overtimeMinutes += extra
    
    if (worked > longestDay) longestDay = worked
    if (worked < shortestDay) shortestDay = worked
  }

  // Cálculos económicos (tarifas dadas en horas)
  const regularHours = regularMinutes / 60
  const overtimeHours = overtimeMinutes / 60
  
  const regularPay = regularHours * profile.hourly_rate
  const overtimePay = overtimeHours * profile.overtime_rate
  const totalPay = regularPay + overtimePay

  const balanceMinutes = totalWorkedMinutes - (workedDays * profile.daily_goal_minutes)
  const averageMinutes = Math.round(totalWorkedMinutes / workedDays)

  return {
    workedDays,
    regularMinutes,
    overtimeMinutes,
    totalWorkedMinutes,
    regularPay,
    overtimePay,
    totalPay,
    balanceMinutes,
    longestDay,
    shortestDay,
    averageMinutes
  }
}
