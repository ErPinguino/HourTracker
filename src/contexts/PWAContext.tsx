import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface PWAContextType {
  needRefresh: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  offlineReady: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: ReactNode }) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (import.meta.env.DEV) {
        console.log('SW Registered', r)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

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
