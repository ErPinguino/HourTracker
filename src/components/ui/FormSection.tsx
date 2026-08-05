import type { ReactNode } from 'react'

interface FormSectionProps {
  title?: string
  children: ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="w-full mb-6">
      {title && (
        <h2 className="text-[13px] uppercase tracking-wider font-bold text-sec ml-4 mb-2">
          {title}
        </h2>
      )}
      <div className="premium-card overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export function FormRow({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`p-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  )
}
