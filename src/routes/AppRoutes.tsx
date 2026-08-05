import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Day } from '@/pages/Day'
import { Stats } from '@/pages/Stats'
import { Settings } from '@/pages/Settings'

import { RequireProfile } from '@/routes/RequireProfile'
import { Onboarding } from '@/pages/Onboarding'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route element={<RequireProfile />}>
            <Route path="/" element={<Home />} />
            <Route path="/day/:date" element={<Day />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
