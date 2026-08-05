import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BottomNavigation } from './BottomNavigation'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { getProfile } from '@/services/profile'
import { useTheme } from '@/contexts/ThemeContext'

export function AppLayout() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const location = useLocation()

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
    <div className="h-screen w-full flex overflow-hidden">
      {/* Sidebar on Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative" id="main-scroll-container">
        <div 
          key={location.pathname} 
          className={`w-full max-w-2xl mx-auto flex-1 flex flex-col md:pb-8 animate-fade-in ${isMainScreen ? 'pb-[calc(80px+env(safe-area-inset-bottom))]' : 'pb-0'}`}
        >
          <Outlet />
        </div>
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
