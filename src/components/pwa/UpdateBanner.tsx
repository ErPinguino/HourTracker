import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(_r) {
      console.log('SW Registered')
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm">
      <div className="premium-card bg-card/95 backdrop-blur-xl p-4 flex items-center justify-between shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-main">Nueva versión</span>
          <span className="text-[13px] text-sec">Actualización disponible</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setNeedRefresh(false)}
            className="text-[15px] text-sec font-medium px-2 py-1 active:scale-95 transition-transform"
          >
            Ignorar
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-[15px] text-white bg-[#0A84FF] px-4 py-1.5 rounded-[12px] font-bold active:scale-95 transition-transform shadow-sm"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}
