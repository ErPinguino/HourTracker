import { useState, useEffect } from 'react'
import { FormSection } from '@/components/ui/FormSection'
import type { Profile } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertProfile } from '@/services/profile'
import { supabase } from '@/lib/supabase'
import { Bell, Smartphone, CalendarDays, Clock, FileText, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

const DAYS_OF_WEEK = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'X' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' },
]

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

function getDaysSummary(days: number[]): string {
  if (days.length === 0) return 'No recibirás recordatorios diarios'
  if (days.length === 7) return 'Todos los días'
  
  const isWeekdays = days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))
  if (isWeekdays) return 'De lunes a viernes'
  
  const isWeekend = days.length === 2 && days.includes(0) && days.includes(6)
  if (isWeekend) return 'Solo fines de semana'
  
  return `${days.length} día${days.length === 1 ? '' : 's'} seleccionado${days.length === 1 ? '' : 's'}`
}

function triggerHaptic(duration: number) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration)
    }
  } catch (e) {
    // Silencioso en caso de error o falta de soporte
  }
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

  const toggleDay = (dayId: number) => {
    triggerHaptic(10)
    const currentDays = profile.daily_reminder_days || [1,2,3,4,5]
    let newDays: number[]
    
    if (currentDays.includes(dayId)) {
      newDays = currentDays.filter(d => d !== dayId)
    } else {
      newDays = [...currentDays, dayId].sort((a, b) => a - b)
    }
    
    mutation.mutate({ daily_reminder_days: newDays })
  }

  const setQuickDays = (days: number[]) => {
    triggerHaptic(20)
    mutation.mutate({ daily_reminder_days: days })
  }

  const isSupported = 'Notification' in window
  const isEnabled = profile.notifications_enabled && permission === 'granted' && isSubscribed
  const activeDays = profile.daily_reminder_days || [1,2,3,4,5]

  return (
    <>
      <FormSection title="Notificaciones Push">
        {/* Status Section */}
        <div className="grouped-list-item flex flex-col justify-center py-3 bg-transparent px-4">
          <div className="flex items-center space-x-3 mb-3">
            <Smartphone className="text-gray-400" size={20} />
            <div className="flex flex-col flex-1">
              <span className="text-[17px] text-main">Estado del dispositivo</span>
              <span className="text-[13px] text-sec flex items-center space-x-1 mt-0.5">
                {isSupported ? (
                  <>
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span>Soportado</span>
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="text-red-500" />
                    <span>No soportado</span>
                  </>
                )}
                <span className="mx-1">•</span>
                <span>Permisos: {permission === 'granted' ? 'Concedido' : permission === 'denied' ? 'Denegado' : 'Pendiente'}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
            <div className="flex items-center space-x-3">
              <Bell className={isEnabled ? "text-blue-500" : "text-gray-400"} size={20} />
              <span className="text-[17px] text-main">Recibir notificaciones</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isEnabled || false}
                onChange={(e) => toggleMain(e.target.checked)}
                disabled={mutation.isPending || isProcessing || !isSupported}
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </FormSection>

      {isEnabled && (
        <FormSection title="Recordatorios">
          {/* Recordatorio Diario */}
          <div className="grouped-list-item flex flex-col py-3 bg-transparent px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className={profile.daily_reminder_enabled ? "text-blue-500" : "text-gray-400"} size={20} />
                <span className="text-[17px] text-main">Recordatorio diario</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={profile.daily_reminder_enabled || false}
                  onChange={(e) => {
                    if (!e.target.checked && document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur()
                    }
                    mutation.mutate({ daily_reminder_enabled: e.target.checked })
                  }}
                  disabled={mutation.isPending}
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div 
              aria-disabled={!profile.daily_reminder_enabled}
              className={`mt-4 transition-all duration-200 ease-out ${profile.daily_reminder_enabled ? 'opacity-100 translate-y-0' : 'opacity-50 -translate-y-1 pointer-events-none'}`}
            >
              <div className="flex items-center justify-between mb-4 border-t border-border/40 pt-3">
                <span className="text-[15px] text-sec">Hora de aviso</span>
                <input
                  type="time"
                  className="bg-transparent text-main text-right focus:outline-none text-[17px] min-w-[80px]"
                  value={profile.daily_reminder_time || '20:00'}
                  onChange={(e) => mutation.mutate({ daily_reminder_time: e.target.value })}
                  disabled={mutation.isPending}
                />
              </div>
              
              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <span className="text-[15px] text-sec mb-3 block w-full">Días activos</span>
              </div>
              <div className="flex items-center justify-between gap-1 mb-4">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = activeDays.includes(day.id)
                  return (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      disabled={mutation.isPending}
                      className={`flex-1 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-semibold transition-all duration-[150ms] ease-out active:scale-95
                        ${isActive 
                          ? 'bg-blue-500 text-white shadow-sm' 
                          : 'bg-black/5 dark:bg-white/5 text-sec hover:bg-black/10 dark:hover:bg-white/10'
                        }
                      `}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
              
              <div className="flex justify-center mb-5">
                <span className="text-[14px] text-sec">{getDaysSummary(activeDays)}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuickDays([1,2,3,4,5])}
                  disabled={mutation.isPending}
                  className="flex-1 h-10 bg-black/5 dark:bg-white/5 text-[15px] font-medium text-main rounded-xl active:scale-95 transition-all hover:bg-black/10 dark:hover:bg-white/10"
                >
                  Laborables
                </button>
                <button
                  onClick={() => setQuickDays([0,1,2,3,4,5,6])}
                  disabled={mutation.isPending}
                  className="flex-1 h-10 bg-black/5 dark:bg-white/5 text-[15px] font-medium text-main rounded-xl active:scale-95 transition-all hover:bg-black/10 dark:hover:bg-white/10"
                >
                  Todos
                </button>
              </div>
            </div>
          </div>

          <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CalendarDays className={profile.missing_days_enabled ? "text-blue-500" : "text-gray-400"} size={20} />
              <span className="text-[17px] text-main">Días sin registrar</span>
            </div>
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

          <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className={profile.month_end_enabled ? "text-blue-500" : "text-gray-400"} size={20} />
              <span className="text-[17px] text-main">Recordatorio fin de mes</span>
            </div>
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

          <div className="grouped-list-item px-4 h-[56px] flex items-center justify-center">
            <button
              onClick={sendTest}
              disabled={isProcessing}
              className="text-blue-500 font-medium active:scale-95 transition-transform flex items-center space-x-2 w-full justify-center"
            >
              <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
              <span>{isProcessing ? 'Enviando...' : 'Enviar prueba'}</span>
            </button>
          </div>
        </FormSection>
      )}
    </>
  )
}
