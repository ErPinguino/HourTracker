import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { CalendarDays, BarChart2, Settings } from 'lucide-react'

export function BottomNavigation() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const mainScrollContainer = document.getElementById('main-scroll-container')
    if (!mainScrollContainer) return

    let currentLastScrollY = mainScrollContainer.scrollTop

    const handleScroll = () => {
      const currentScrollY = mainScrollContainer.scrollTop
      if (currentScrollY > currentLastScrollY && currentScrollY > 50) {
        setIsVisible(false) // Scrolling down
      } else if (currentScrollY < currentLastScrollY) {
        setIsVisible(true) // Scrolling up
      }
      currentLastScrollY = currentScrollY
    }

    mainScrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => mainScrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const tabs = [
    { to: '/', icon: CalendarDays, label: 'Inicio' },
    { to: '/stats', icon: BarChart2, label: 'Estadísticas' },
    { to: '/settings', icon: Settings, label: 'Ajustes' },
  ]

  return (
    <div className={`fixed bottom-0 left-0 w-full bg-card/80 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)] z-50 md:hidden transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center w-full h-full space-y-1
                transition-all duration-200 active:scale-[0.95]
                ${isActive ? 'text-accent' : 'text-ter hover:text-sec'}
              `}
            >
              <Icon size={24} strokeWidth={2} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}
