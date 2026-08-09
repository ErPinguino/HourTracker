import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/services/profile'
import { getWorkLogsByMonth } from '@/services/workLogs'
import { evaluateNotifications } from '@/services/notificationEngine'
import { useAuth } from '@/hooks/useAuth'

export function useNotificationsEngine() {
  const { user } = useAuth()
  
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: !!user
  })

  // We only need the current month's logs for these evaluations
  const { data: workLogs } = useQuery({
    queryKey: ['workLogs', new Date().toISOString().substring(0, 7)], // yyyy-MM
    queryFn: () => getWorkLogsByMonth(new Date()),
    enabled: !!user
  })

  useEffect(() => {
    if (!profile || !workLogs) return

    // Run evaluation immediately
    evaluateNotifications(profile, workLogs)

    // Run evaluation every 5 minutes while app is open
    const interval = setInterval(() => {
      evaluateNotifications(profile, workLogs)
    }, 5 * 60 * 1000)

    // Run evaluation when app gains focus / visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        evaluateNotifications(profile, workLogs)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [profile, workLogs])
}
