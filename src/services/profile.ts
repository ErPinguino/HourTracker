import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

// Omitimos el DEFAULT_PROFILE por completo ya que retornaremos null para forzar Onboarding

export async function getProfile(): Promise<Profile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('No authenticado')

  const { data, error } = await supabase
    .from('profiles')
    .select('worker_name, daily_goal_minutes, default_break_minutes, hourly_rate, overtime_rate, currency, theme')
    .eq('id', userData.user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found, return null to trigger Onboarding
      return null
    }
    throw error
  }

  return data
}

export async function upsertProfile(profile: Profile): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('No authenticado')

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userData.user.id,
      ...profile,
      updated_at: new Date().toISOString()
    })

  if (error) throw error
}
