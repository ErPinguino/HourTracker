import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function Card({ children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`bg-white dark:bg-[#1c1c1e] rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden ${noPadding ? '' : 'p-4 sm:p-6'} ${className}`}>
      {children}
    </div>
  )
}
