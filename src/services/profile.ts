import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

// Omitimos el DEFAULT_PROFILE por completo ya que retornaremos null para forzar Onboarding

export async function getProfile(): Promise<Profile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('No authenticado')

  const { data, error } = await supabase
    .from('profiles')
    .select('worker_name, payment_type, daily_rate, daily_goal_minutes, default_break_minutes, hourly_rate, overtime_rate, currency, theme, notifications_enabled, daily_reminder_enabled, daily_reminder_time, daily_reminder_days, missing_days_enabled, month_end_enabled')
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
  console.log("STEP 5 (Objeto recibido por upsertProfile)", profile)
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('No authenticado')

  const payload = {
    id: userData.user.id,
    ...profile,
    updated_at: new Date().toISOString()
  }

  console.log("STEP 6 (Objeto que realmente se pasa a .upsert)", payload)

  // Monkey-patch fetch to intercept the HTTP payload sent by Supabase
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    if (init?.body && typeof init.body === 'string') {
      try {
        console.log("STEP 7 (Payload HTTP que sale hacia Supabase)", JSON.parse(init.body))
      } catch (e) {
        console.log("STEP 7 (Payload HTTP que sale hacia Supabase) - Raw body:", init.body)
      }
    }
    return originalFetch(input, init)
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(payload)

  // Restore fetch
  globalThis.fetch = originalFetch

  if (error) throw error

  // Query DB to see final stored value
  const { data: finalData } = await supabase.from('profiles').select('theme').eq('id', userData.user.id).single()
  console.log("STEP 8 (Valor almacenado finalmente)", finalData)
}
