import { format, endOfMonth, isSameDay } from 'date-fns'
import type { Profile, WorkLog } from '@/types'

const STORAGE_KEY = 'hourtrack_notifications_log'

interface NotificationLog {
  lastDailyReminder?: string // YYYY-MM-DD
  lastMissingDays?: string // YYYY-MM-DD
  lastMonthEnd?: string // YYYY-MM
}

function getLog(): NotificationLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // Ignore error
  }
  return {}
}

function saveLog(log: NotificationLog) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
}

async function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, {
          ...options,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        })
        return
      }
    } catch (error) {
      console.error('Error showing sw notification:', error)
    }
    // Fallback
    new Notification(title, {
      ...options,
      icon: '/icon-192.png',
    })
  }
}

function parseTime(timeStr: string): number {
  // timeStr e.g. "20:00" -> minutes since midnight
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

function hasLogForToday(workLogs: WorkLog[], todayStr: string) {
  return workLogs.some(log => log.date === todayStr)
}

function hasMissingDays(workLogs: WorkLog[], today: Date) {
  // Simple check: how many days in the month up to today?
  const daysInMonthSoFar = today.getDate()
  // How many logs in this month?
  const currentMonthPrefix = format(today, 'yyyy-MM')
  const logsThisMonth = workLogs.filter(log => log.date.startsWith(currentMonthPrefix))
  
  return logsThisMonth.length < daysInMonthSoFar - 1 // allow up to 1 day missing without nagging immediately
}

export async function evaluateNotifications(profile: Profile, workLogs: WorkLog[]) {
  if (!profile.notifications_enabled) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  const currentMonthStr = format(now, 'yyyy-MM')
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const log = getLog()
  let hasChanges = false

  // 1. Daily Reminder
  if (profile.daily_reminder_enabled && profile.daily_reminder_time) {
    const reminderMinutes = parseTime(profile.daily_reminder_time)
    if (currentMinutes >= reminderMinutes) {
      if (log.lastDailyReminder !== todayStr) {
        if (!hasLogForToday(workLogs, todayStr)) {
          await sendLocalNotification('⏰ No olvides registrar la jornada', {
            body: 'Todavía no has registrado la jornada de hoy.'
          })
          log.lastDailyReminder = todayStr
          hasChanges = true
        }
      }
    }
  }

  // 2. Missing Days
  if (profile.missing_days_enabled) {
    if (log.lastMissingDays !== todayStr) {
      // Evaluate only if it's afternoon to not annoy in the morning
      if (currentMinutes >= 14 * 60) {
        if (hasMissingDays(workLogs, now)) {
          await sendLocalNotification('📅 Tienes días pendientes', {
            body: 'Todavía quedan días de este mes sin registrar.'
          })
          log.lastMissingDays = todayStr
          hasChanges = true
        }
      }
    }
  }

  // 3. Month End
  if (profile.month_end_enabled) {
    if (log.lastMonthEnd !== currentMonthStr) {
      const isLastDay = isSameDay(now, endOfMonth(now))
      // Alert on last day at 20:00
      if (isLastDay && currentMinutes >= 20 * 60) {
        await sendLocalNotification('📄 Resumen mensual', {
          body: 'Ya puedes generar el resumen mensual.'
        })
        log.lastMonthEnd = currentMonthStr
        hasChanges = true
      }
    }
  }

  if (hasChanges) {
    saveLog(log)
  }
}
