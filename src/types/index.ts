export interface WorkLog {
  id?: string
  user_id?: string
  date: string // YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string // HH:mm
  break_minutes: number
  worked_minutes: number
  notes?: string
}

export interface Profile {
  worker_name: string
  daily_goal_minutes: number
  default_break_minutes: number
  hourly_rate: number
  overtime_rate: number
  currency: string
  theme: 'light' | 'dark' | 'system'
}
