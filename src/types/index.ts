export interface WorkLog {
  id?: string
  user_id?: string
  date: string // YYYY-MM-DD
  start_time: string | null // HH:mm
  end_time: string | null // HH:mm
  break_minutes: number | null
  worked_minutes: number
  worked_day?: boolean
  worked_extra?: boolean
  extra_hours?: number
  notes?: string
  work_location?: string | null
}

export interface Profile {
  worker_name: string
  payment_type: 'hourly' | 'daily'
  daily_rate?: number
  daily_goal_minutes: number
  default_break_minutes: number
  hourly_rate: number
  overtime_rate: number
  currency: string
  theme: 'light' | 'dark' | 'system'
  notifications_enabled?: boolean
  daily_reminder_enabled?: boolean
  daily_reminder_time?: string
  daily_reminder_days?: number[]
  missing_days_enabled?: boolean
  month_end_enabled?: boolean
}
