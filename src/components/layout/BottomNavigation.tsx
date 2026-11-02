import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, BarChart2, Settings } from 'lucide-react'
import { BottomNavigation as AnimateBottomNavigation, BottomNavigationHighlight, BottomNavigationHighlightItem, BottomNavigationItem, BottomNavigationLabel } from '@animate-ui/react/primitives/bottom-navigation'

export function BottomNavigation() {
  const [isVisible, setIsVisible] = useState(true)
  const location = useLocation()
  const scrollRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const mainScrollContainer = document.getElementById('main-scroll-container')
    if (!mainScrollContainer) return
    scrollRef.current = mainScrollContainer

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

  const activeValue = tabs.find(tab => tab.to === location.pathname)?.to ?? '/'
  return <div className={`fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(.5rem+env(safe-area-inset-bottom))] pointer-events-none md:hidden transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
    <AnimateBottomNavigation value={activeValue} onValueChange={() => undefined} scrollBehavior="minimize" scrollContainer={scrollRef} aria-label="Navegación principal" className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-card/90 p-1.5 shadow-lg ring-1 ring-border backdrop-blur-xl">
      <BottomNavigationHighlight className="absolute inset-x-0 inset-y-1 rounded-full bg-black/[0.06] dark:bg-white/[0.08]"><ul className="relative flex items-center">
        {tabs.map(tab => { const Icon = tab.icon; return <li key={tab.to}>
          <BottomNavigationHighlightItem value={tab.to}>
            <BottomNavigationItem value={tab.to} asChild className="flex h-14 w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-full text-ter outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent data-[active]:text-accent data-[minimized]:size-12">
              <NavLink to={tab.to} aria-label={tab.label}><Icon size={21} strokeWidth={2.1} /><BottomNavigationLabel show="always" className="text-[10px] font-medium tracking-wide">{tab.label}</BottomNavigationLabel></NavLink>
            </BottomNavigationItem>
          </BottomNavigationHighlightItem>
        </li> })}
      </ul></BottomNavigationHighlight>
    </AnimateBottomNavigation>
  </div>
}
