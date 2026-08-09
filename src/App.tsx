import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppRoutes } from './routes/AppRoutes'
import { UpdateBanner } from './components/pwa/UpdateBanner'
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
            <main className="min-h-screen max-w-md mx-auto w-full h-full flex flex-col relative transition-colors duration-300">
              <EngineRunner />
              <AppRoutes />
              <UpdateBanner />
            </main>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
