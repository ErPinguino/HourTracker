import { useEffect } from 'react'
import { Outlet, useLocation, useOutlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BottomNavigation } from './BottomNavigation'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/services/profile'
import { useTheme } from '@/contexts/ThemeContext'
import { PageTransition } from '@/components/animate-ui/PageTransition'

export function AppLayout() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const location = useLocation()
  const outlet = useOutlet()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!user,
  })

  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme)
    }
  }, [profile?.theme, setTheme])

  const isMainScreen = location.pathname === '/' || location.pathname === '/stats' || location.pathname === '/settings'

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center">
        <div className="w-full max-w-md flex-1 flex flex-col">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden">
      {/* Sidebar on Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative" id="main-scroll-container">
        <PageTransition pageKey={isMainScreen ? location.pathname : 'secondary'}><div className={`w-full max-w-2xl mx-auto flex-1 flex flex-col md:pb-8 ${isMainScreen ? 'pb-[calc(80px+env(safe-area-inset-bottom))]' : 'pb-0'}`}>{outlet}</div></PageTransition>
      </div>

      {/* BottomNav on Mobile */}
      {isMainScreen && (
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      )}
    </div>
  )
}
