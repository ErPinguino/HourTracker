import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { upsertProfile } from "@/services/profile"
import { supabase } from "@/lib/supabase"
import { FormSection } from "@/components/ui/FormSection"
import type { Profile } from "@/types"
import { Bell, Smartphone, CalendarDays, Clock, FileText, CheckCircle2, XCircle, RefreshCw } from "lucide-react"

const DAYS_OF_WEEK = [
  { id: 1, label: "L" },
  { id: 2, label: "M" },
  { id: 3, label: "X" },
  { id: 4, label: "J" },
  { id: 5, label: "V" },
  { id: 6, label: "S" },
  { id: 0, label: "D" },
]

function urlBase64ToUint8Array(b: string) {
  const padding = "=".repeat((4 - (b.length % 4)) % 4)
  const base64 = (b + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i)
  return arr
}

function getDaysSummary(days: number[]): string {
  if (days.length === 7) return "Todos los dias"
  if (days.length === 0) return "Ninguno"
  if (days.length === 5 && [1,2,3,4,5].every(d => days.includes(d))) return "Laborables"
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Fines de semana"
  return [...days].sort((a,b) => (a===0?7:a)-(b===0?7:b)).map(d => DAYS_OF_WEEK.find(x=>x.id===d)?.label).join(" ")
}

function triggerHaptic(ms: number) {
  try { if (navigator.vibrate) navigator.vibrate(ms) } catch(_) {}
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
    </label>
  )
}

export function NotificationsSettings({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient()
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
      if (Notification.permission === "granted" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription().then(sub => setIsSubscribed(!!sub)))
      }
    }
  }, [])

  const mutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => upsertProfile({ ...profile, ...updates }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  })

  const subscribePush = async () => {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const { data, error } = await supabase.functions.invoke("public-key")
      if (error || !data?.publicKey) throw new Error("No se pudo obtener la clave VAPID.")
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(data.publicKey) })
    }
    const { error } = await supabase.functions.invoke("subscribe", { body: { subscription: sub, userAgent: navigator.userAgent, platform: navigator.platform, deviceName: "Dispositivo Web" } })
    if (error) throw new Error("No se pudo guardar la suscripcion.")
    setIsSubscribed(true)
  }

  const unsubscribePush = async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) { await supabase.functions.invoke("unsubscribe", { body: { endpoint: sub.endpoint } }); await sub.unsubscribe(); setIsSubscribed(false) }
  }

  const toggleMain = async (enabled: boolean) => {
    if (!("Notification" in window)) { alert("Tu navegador no soporta notificaciones Web Push."); return }
    setIsProcessing(true)
    try {
      if (enabled) {
        const p = await Notification.requestPermission(); setPermission(p)
        if (p !== "granted") { alert("Debes permitir las notificaciones en tu dispositivo."); return }
        await subscribePush()
        await mutation.mutateAsync({ notifications_enabled: true })
      } else {
        await unsubscribePush()
        await mutation.mutateAsync({ notifications_enabled: false })
      }
    } catch (err: any) { alert("Error: " + err.message) }
    finally { setIsProcessing(false) }
  }

  const sendTest = async () => {
    setIsProcessing(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) throw new Error("No estas suscrito.")
      const { error } = await supabase.functions.invoke("send-test-device", { body: { endpoint: sub.endpoint } })
      if (error) throw error
    } catch (err: any) { alert("Error enviando prueba: " + err.message) }
    finally { setIsProcessing(false) }
  }

  const toggleDay = (dayId: number) => {
    triggerHaptic(10)
    const cur = profile.daily_reminder_days || [1,2,3,4,5]
    const next = cur.includes(dayId) ? cur.filter(d => d !== dayId) : [...cur, dayId].sort((a,b) => a-b)
    mutation.mutate({ daily_reminder_days: next })
  }

  const isSupported = "Notification" in window
  const isEnabled = profile.notifications_enabled && permission === "granted" && isSubscribed
  const activeDays = profile.daily_reminder_days || [1,2,3,4,5]

  return (
    <div className="w-full flex flex-col space-y-6 pb-12">
      <FormSection title="Push">
        <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className={isEnabled ? "text-blue-500" : "text-gray-400"} size={20} />
            <span className="text-[17px] text-main">Recibir notificaciones</span>
          </div>
          <Toggle checked={isEnabled || false} onChange={toggleMain} disabled={mutation.isPending || isProcessing || !isSupported} />
        </div>
        <div className="grouped-list-item px-4 py-3 flex flex-col space-y-1.5">
          <div className="flex items-center space-x-2 mb-0.5">
            <Smartphone className="text-gray-400" size={15} />
            <span className="text-[12px] font-semibold text-sec uppercase tracking-wider">Estado del dispositivo</span>
          </div>
          {[
            { ok: isSupported, label: "API Web Push " + (isSupported ? "soportada" : "no soportada") },
            { ok: permission === "granted", label: "Permisos: " + permission },
            { ok: isSubscribed, label: "Suscripcion: " + (isSubscribed ? "activa" : "inactiva") },
          ].map(({ ok, label }) => (
            <span key={label} className="text-[13px] text-sec flex items-center space-x-1.5 pl-5">
              {ok ? <CheckCircle2 size={13} className="text-green-500 shrink-0" /> : <XCircle size={13} className="text-yellow-500 shrink-0" />}
              <span>{label}</span>
            </span>
          ))}
        </div>
      </FormSection>

      <FormSection title="Recordatorios">
        <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className={profile.daily_reminder_enabled ? "text-blue-500" : "text-gray-400"} size={20} />
            <span className="text-[17px] text-main">Recordatorio diario</span>
          </div>
          <Toggle checked={profile.daily_reminder_enabled || false} onChange={v => mutation.mutate({ daily_reminder_enabled: v })} disabled={mutation.isPending} />
        </div>
        {profile.daily_reminder_enabled && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
              <span className="text-[17px] text-main">Hora de aviso</span>
              <input type="time" className="bg-transparent text-right text-[17px] text-gray-500 dark:text-gray-400 focus:outline-none" value={profile.daily_reminder_time || "20:00"} onChange={e => mutation.mutate({ daily_reminder_time: e.target.value })} disabled={mutation.isPending} />
            </div>
            <div className="grouped-list-item px-4 py-3 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[17px] text-main">Dias activos</span>
                <span className="text-[14px] text-sec">{getDaysSummary(activeDays)}</span>
              </div>
              <div className="flex items-center gap-1">
                {DAYS_OF_WEEK.map(day => {
                  const active = activeDays.includes(day.id)
                  return (
                    <button key={day.id} onClick={() => toggleDay(day.id)} disabled={mutation.isPending} className={"flex-1 h-[38px] rounded-xl flex items-center justify-center text-[14px] font-semibold transition-all duration-[150ms] ease-out active:scale-95 " + (active ? "bg-blue-500 text-white shadow-sm" : "bg-black/5 dark:bg-white/5 text-sec hover:bg-black/10 dark:hover:bg-white/10")}>
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarDays className={profile.missing_days_enabled ? "text-blue-500" : "text-gray-400"} size={20} />
            <span className="text-[17px] text-main">Dias sin registrar</span>
          </div>
          <Toggle checked={profile.missing_days_enabled || false} onChange={v => mutation.mutate({ missing_days_enabled: v })} disabled={mutation.isPending} />
        </div>
        <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className={profile.month_end_enabled ? "text-blue-500" : "text-gray-400"} size={20} />
            <span className="text-[17px] text-main">Recordatorio fin de mes</span>
          </div>
          <Toggle checked={profile.month_end_enabled || false} onChange={v => mutation.mutate({ month_end_enabled: v })} disabled={mutation.isPending} />
        </div>
      </FormSection>

      <FormSection title="Aplicacion">
        <div className="grouped-list-item px-4 h-[56px] flex items-center justify-between">
          <span className="text-[17px] text-main">Avisar de nuevas versiones</span>
          <Toggle checked={true} onChange={() => alert("Las notificaciones de actualizacion son obligatorias actualmente.")} />
        </div>
        {isSubscribed && (
          <button onClick={sendTest} disabled={isProcessing} className="grouped-list-item px-4 h-[56px] flex items-center space-x-3 w-full text-left active:bg-black/5 dark:active:bg-white/5 transition-colors">
            <RefreshCw size={20} className={isProcessing ? "animate-spin text-blue-500" : "text-blue-500"} />
            <span className="text-[17px] text-blue-500 font-medium">{isProcessing ? "Enviando..." : "Enviar notificacion de prueba"}</span>
          </button>
        )}
      </FormSection>
    </div>
  )
}
