import webpush from 'npm:web-push'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Configuración perezosa para evitar fallos si la VAPID no está inyectada pero la función no la usa.
let configured = false
function ensureConfigured() {
  if (!configured) {
    webpush.setVapidDetails(
      Deno.env.get('WEB_PUSH_SUBJECT') || 'mailto:admin@hourtrack.app',
      Deno.env.get('WEB_PUSH_PUBLIC_KEY') || '',
      Deno.env.get('WEB_PUSH_PRIVATE_KEY') || ''
    )
    configured = true
  }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function createSupabaseClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
}

// Cliente con rol de administrador (Service Role) para poder desactivar suscripciones (is_active=false) si el usuario ya no está activo
export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

export async function sendWebPush(subscription: any, payload: any) {
  ensureConfigured()
  try {
    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      },
      JSON.stringify(payload)
    )
    return { success: true, result }
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Suscripción inválida / eliminada del proveedor
      console.log('Suscripción expirada/inválida. Desactivando endpoint:', subscription.endpoint)
      const adminClient = createAdminClient()
      await adminClient.from('push_subscriptions').update({ is_active: false }).eq('endpoint', subscription.endpoint)
    }
    console.error('Error enviando push:', error)
    return { success: false, error }
  }
}
