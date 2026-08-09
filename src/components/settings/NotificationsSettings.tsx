import { useState, useEffect } from 'react'
import { FormSection } from '@/components/ui/FormSection'
import type { Profile } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertProfile } from '@/services/profile'
import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationsSettings({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.pushManager.getSubscription().then(sub => {
            setIsSubscribed(!!sub)
          })
        })
      }
    }
  }, [])
  
  const mutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => upsertProfile({ ...profile, ...updates }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] })
  })

  const subscribePush = async () => {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    
    if (!sub) {
      const { data, error } = await supabase.functions.invoke('public-key')
      if (error || !data?.publicKey) {
        throw new Error('No se pudo obtener la clave VAPID del servidor.')
      }
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey)
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
    }

    const { error } = await supabase.functions.invoke('subscribe', {
      body: {
        subscription: sub,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        deviceName: 'Dispositivo Web'
      }
    })

    if (error) throw new Error('No se pudo guardar la suscripción en el servidor.')
    setIsSubscribed(true)
  }

  const unsubscribePush = async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.functions.invoke('unsubscribe', {
        body: { endpoint: sub.endpoint }
      })
      await sub.unsubscribe()
      setIsSubscribed(false)
    }
  }

  const toggleMain = async (enabled: boolean) => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones Web Push.')
      return
    }

    setIsProcessing(true)
    try {
      if (enabled) {
        const p = await Notification.requestPermission()
        setPermission(p)
        if (p !== 'granted') {
          alert('Para usar esta función, debes permitir las notificaciones en tu dispositivo/navegador.')
          setIsProcessing(false)
          return
        }
        await subscribePush()
        await mutation.mutateAsync({ notifications_enabled: true })
      } else {
        await unsubscribePush()
        await mutation.mutateAsync({ notifications_enabled: false })
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const sendTest = async () => {
    setIsProcessing(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) throw new Error('No estás suscrito a notificaciones.')

      const { error } = await supabase.functions.invoke('send-test-device', {
        body: { endpoint: sub.endpoint }
      })
      
      if (error) throw error
    } catch (err: any) {
      alert('Error enviando prueba: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const isEnabled = profile.notifications_enabled && permission === 'granted' && isSubscribed

  return (
    <FormSection title="Notificaciones Push (Beta)">
      
      {/* Diagnóstico (Opcional, pero muy útil para Web Push) */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-white/5 border-b border-border/40 text-[13px] text-gray-500">
        <p>Soporte: {'Notification' in window ? '✅' : '❌'}</p>
        <p>Permiso nativo: {permission}</p>
        <p>Suscripción Push: {isSubscribed ? '✅ Activa' : '❌ Inactiva'}</p>
      </div>

      <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between">
        <span className="text-[17px] text-main">🔔 Recibir en este dispositivo</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isEnabled || false}
            onChange={(e) => toggleMain(e.target.checked)}
            disabled={mutation.isPending || isProcessing}
          />
          <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
        </label>
      </div>

      {isEnabled && (
        <>
          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-t border-border/40">
            <span className="text-[17px] text-main">☑ Recordatorio diario</span>
            <div className="flex items-center gap-3">
              <input
                type="time"
                className="bg-transparent text-accent text-right focus:outline-none w-[70px]"
                value={profile.daily_reminder_time || '20:00'}
                onChange={(e) => mutation.mutate({ daily_reminder_time: e.target.value })}
                disabled={mutation.isPending || !profile.daily_reminder_enabled}
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={profile.daily_reminder_enabled || false}
                  onChange={(e) => mutation.mutate({ daily_reminder_enabled: e.target.checked })}
                  disabled={mutation.isPending}
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-t border-border/40">
            <span className="text-[17px] text-main">☑ Avisar de días sin registrar</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={profile.missing_days_enabled || false}
                onChange={(e) => mutation.mutate({ missing_days_enabled: e.target.checked })}
                disabled={mutation.isPending}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex items-center justify-between border-t border-border/40">
            <span className="text-[17px] text-main">☑ Recordatorio fin de mes</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={profile.month_end_enabled || false}
                onChange={(e) => mutation.mutate({ month_end_enabled: e.target.checked })}
                disabled={mutation.isPending}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="grouped-list-item px-4 py-3.5 flex justify-center border-t border-border/40">
            <button
              onClick={sendTest}
              disabled={isProcessing}
              className="text-blue-500 font-medium active:scale-95 transition-transform"
            >
              {isProcessing ? 'Enviando...' : 'Enviar prueba a ESTE dispositivo'}
            </button>
          </div>
        </>
      )}
    </FormSection>
  )
}
