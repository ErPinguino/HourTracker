import { NavLink } from 'react-router-dom'
import { CalendarDays, BarChart2, Settings, Clock } from 'lucide-react'

export function Sidebar() {
  const tabs = [
    { to: '/', icon: CalendarDays, label: 'Inicio' },
    { to: '/stats', icon: BarChart2, label: 'Estadísticas' },
    { to: '/settings', icon: Settings, label: 'Ajustes' },
  ]

  return (
    <div className="w-64 h-full bg-[var(--card-bg)] border-r border-[var(--border-color)] flex flex-col pt-8 pb-4 shrink-0 shadow-sm hidden md:flex">
      
      {/* Brand Header */}
      <div className="px-6 flex items-center space-x-3 mb-10">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
          <Clock size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">HourTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `
                flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-900 dark:hover:text-white'}
              `}
            >
              <Icon size={20} strokeWidth={2} className="transition-transform group-hover:scale-110" />
              <span className="text-[15px]">{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>

    </div>
  )
}
