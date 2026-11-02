import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppRoutes } from './routes/AppRoutes'
import { PWAProvider } from './contexts/PWAContext'
import { PWAUpdater } from './components/pwa/PWAUpdater'
import { queryClient } from '@/lib/queryClient'
import { useNotificationsEngine } from '@/hooks/useNotificationsEngine'

function EngineRunner() {
  useNotificationsEngine()
  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <PWAProvider>
              <main className="min-h-[100dvh] mx-auto w-full h-full flex flex-col relative transition-colors duration-300">
                <EngineRunner />
                <AppRoutes />
                <PWAUpdater />
              </main>
            </PWAProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
