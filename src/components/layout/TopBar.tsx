import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  title: string
  showBack?: boolean
  rightElement?: ReactNode
}

export function TopBar({ title, showBack = false, rightElement }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      className="w-full shrink-0 bg-transparent"
    >
      <div className="w-full flex items-center justify-between px-4 h-14 mb-2">
        <div className="flex-1 flex items-center justify-start">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full text-blue-500 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors active:scale-95 flex items-center"
            >
              <ChevronLeft size={28} />
            </button>
          )}
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h1>
        
        <div className="flex-1 flex items-center justify-end">
          {rightElement}
        </div>
      </div>
    </div>
  )
}
