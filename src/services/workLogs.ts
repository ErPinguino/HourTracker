import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { WorkLog } from '@/types'

export async function getWorkLogsByMonth(date: Date): Promise<WorkLog[]> {
  // Extract year and month, then construct start and end dates for the entire month
  const year = date.getFullYear()
  const month = date.getMonth()
  
  // Format as YYYY-MM-DD for Supabase query
  const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd')
  // Go to next month, day 1
  const endDate = format(new Date(year, month + 1, 1), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('work_logs')
    .select('*')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    throw error
  }

  return data as WorkLog[]
}

export async function getWorkLogByDate(date: string): Promise<WorkLog | null> {
  const { data, error } = await supabase
    .from('work_logs')
    .select('*')
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is the "0 rows returned" error
    throw error
  }

  return data as WorkLog | null
}

export async function upsertWorkLog(workLog: WorkLog): Promise<WorkLog> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Usuario no autenticado')
  }

  const payload = {
    ...workLog,
    user_id: user.id
  }

  const { data, error } = await supabase
    .from('work_logs')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as WorkLog
}

export async function deleteWorkLog(date: string): Promise<void> {
  const { error } = await supabase.from('work_logs').delete().eq('date', date)
  if (error) throw error
}

export async function getRecentWorkLocations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('work_logs')
    .select('work_location, date')
    .not('work_location', 'is', null)
    .neq('work_location', '')
    .order('date', { ascending: false })
    .limit(100)
  if (error) throw error
  return [...new Set((data ?? []).map(row => row.work_location?.trim()).filter((value): value is string => !!value))].slice(0, 8)
}
