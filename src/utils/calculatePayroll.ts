import type { WorkLog, Profile } from '@/types'

export interface PayrollResult {
  paymentType: 'hourly' | 'daily'
  workedDays: number
  // Hourly mode
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
  // Daily mode
  totalJornales: number
  totalExtraHours: number
  jornadaPay: number
}

function emptyResult(paymentType: 'hourly' | 'daily' = 'hourly'): PayrollResult {
  return {
    paymentType,
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
    totalJornales: 0,
    totalExtraHours: 0,
    jornadaPay: 0,
  }
}

function calculateHourly(workLogs: WorkLog[], profile: Profile): PayrollResult {
  const workedDays = workLogs.length
  let totalWorkedMinutes = 0
  let regularMinutes = 0
  let overtimeMinutes = 0
  let longestDay = workLogs[0].worked_minutes
  let shortestDay = workLogs[0].worked_minutes

  for (const log of workLogs) {
    const worked = log.worked_minutes
    totalWorkedMinutes += worked

    const regular = Math.min(worked, profile.daily_goal_minutes)
    const extra = Math.max(0, worked - profile.daily_goal_minutes)

    regularMinutes += regular
    overtimeMinutes += extra

    if (worked > longestDay) longestDay = worked
    if (worked < shortestDay) shortestDay = worked
  }

  const regularHours = regularMinutes / 60
  const overtimeHours = overtimeMinutes / 60

  const regularPay = regularHours * profile.hourly_rate
  const overtimePay = overtimeHours * profile.overtime_rate
  const totalPay = regularPay + overtimePay

  const balanceMinutes = totalWorkedMinutes - workedDays * profile.daily_goal_minutes
  const averageMinutes = Math.round(totalWorkedMinutes / workedDays)

  return {
    paymentType: 'hourly',
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
    averageMinutes,
    totalJornales: workedDays,
    totalExtraHours: overtimeMinutes / 60,
    jornadaPay: regularPay,
  }
}

function calculateDaily(workLogs: WorkLog[], profile: Profile): PayrollResult {
  const dailyRate = profile.daily_rate ?? 0
  const overtimeRate = profile.overtime_rate ?? 0

  const workedDays = workLogs.length
  // totalJornales = days with a log entry (every log = 1 jornada)
  const totalJornales = workedDays

  let totalExtraHours = 0
  for (const log of workLogs) {
    if (log.worked_extra) {
      totalExtraHours += log.extra_hours ?? 0
    }
  }

  const jornadaPay = totalJornales * dailyRate
  const overtimePay = totalExtraHours * overtimeRate
  const totalPay = jornadaPay + overtimePay

  return {
    paymentType: 'daily',
    workedDays,
    regularMinutes: 0,
    overtimeMinutes: 0,
    totalWorkedMinutes: 0,
    regularPay: jornadaPay,
    overtimePay,
    totalPay,
    balanceMinutes: 0,
    longestDay: 0,
    shortestDay: 0,
    averageMinutes: 0,
    totalJornales,
    totalExtraHours,
    jornadaPay,
  }
}

export function calculatePayroll(workLogs: WorkLog[], profile: Profile): PayrollResult {
  const paymentType = profile.payment_type ?? 'hourly'

  if (!workLogs || workLogs.length === 0) {
    return emptyResult(paymentType)
  }

  if (paymentType === 'daily') {
    return calculateDaily(workLogs, profile)
  }
  return calculateHourly(workLogs, profile)
}
