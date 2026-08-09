import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, createSupabaseClient, sendWebPush } from '../_shared/webpush.ts'

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
    const { endpoint } = body

    if (!endpoint) {
      throw new Error('Missing endpoint')
    }

    // Fetch the specific subscription to ensure it belongs to this user
    const { data: sub, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .eq('is_active', true)
      .single()

    if (subError || !sub) {
      throw new Error('Subscription not found or inactive for this user')
    }

    // Send the push notification
    const payload = {
      title: 'Notificación de prueba',
      body: '¡Web Push configurado correctamente!',
      url: '/'
    }

    const { success, error } = await sendWebPush(sub, payload)

    if (!success) {
      throw new Error('Failed to send push: ' + (error?.message || 'Unknown error'))
    }

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
