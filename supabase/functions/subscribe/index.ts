import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient } from '../_shared/webpush.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req)
    // Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const body = await req.json()
    const { subscription, userAgent, platform, deviceName } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new Error('Invalid subscription object')
    }

    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
        platform: platform,
        device_name: deviceName,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,endpoint' })

    if (upsertError) throw upsertError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
