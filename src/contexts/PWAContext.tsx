import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface PWAContextType {
  needRefresh: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  offlineReady: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: ReactNode }) {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | undefined>()

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setSwRegistration(r)
      }
      if (import.meta.env.DEV) {
        console.log('SW Registered', r)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  // Comprobación automática de actualizaciones
  useEffect(() => {
    // Si no hay SW o ya hay una actualización pendiente, no comprobamos nada
    if (!swRegistration || needRefresh) return

    const checkForUpdate = async () => {
      try {
        await swRegistration.update()
      } catch (err) {
        console.error('Error comprobando actualizaciones de PWA:', err)
      }
    }

    // 1. Comprobar periódicamente cada 30 minutos
    const intervalMS = 30 * 60 * 1000
    const interval = setInterval(checkForUpdate, intervalMS)

    // 2. Comprobar cuando la aplicación vuelve a estar visible o gana el foco
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', checkForUpdate)

    // Limpieza al desmontar o cuando hay una actualización pendiente
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', checkForUpdate)
    }
  }, [swRegistration, needRefresh])

  return (
    <PWAContext.Provider
      value={{
        needRefresh: [needRefresh, setNeedRefresh],
        offlineReady: [offlineReady, setOfflineReady],
        updateServiceWorker,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}
