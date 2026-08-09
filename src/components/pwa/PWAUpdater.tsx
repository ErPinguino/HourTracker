import { usePWA } from '@/contexts/PWAContext'
import { Sparkles, X } from 'lucide-react'

export function PWAUpdater() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = usePWA()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md mx-auto">
      <div className="bg-main text-main border border-border shadow-lg rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-main">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-[17px] tracking-tight">Nueva versión disponible</h3>
          </div>
          <button 
            onClick={() => setNeedRefresh(false)}
            className="p-1 text-sec hover:bg-hover rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-[15px] text-sec leading-snug">
          Hay una actualización de HourTrack lista para instalar.
        </p>
        
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-[15px]"
          >
            Actualizar ahora
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="flex-1 bg-sec hover:bg-hover text-main font-medium py-2.5 px-4 rounded-xl transition-colors text-[15px]"
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  )
}
