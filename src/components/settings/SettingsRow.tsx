import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface SettingsRowProps extends InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label: string
  error?: string
  rightElement?: ReactNode
  isSelect?: boolean
}

export const SettingsRow = forwardRef<any, SettingsRowProps>(
  ({ label, error, rightElement, isSelect, children, ...props }, ref) => {
    return (
      <div className="grouped-list-item flex flex-col justify-center min-h-[56px] py-2 bg-transparent px-4 transition-colors">
        <div className="flex items-center justify-between w-full">
          <label htmlFor={props.id || props.name} className="text-[17px] text-main mr-3 break-words">
            {label}
          </label>
          <div className="min-w-0 flex-1 flex justify-end">
            {rightElement ? (
              rightElement
            ) : isSelect ? (
              <select
                ref={ref} id={props.id || props.name}
                className="bg-transparent text-right text-[17px] text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-0 max-w-full truncate"
                {...props as any}
              >
                {children}
              </select>
            ) : (
              <input
                ref={ref} id={props.id || props.name}
                className="bg-transparent text-right text-[17px] text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-0 w-full min-w-0"
                {...props as any}
              />
            )}
          </div>
        </div>
        {error && <span className="text-[13px] text-red-500 mt-1">{error}</span>}
      </div>
    )
  }
)
SettingsRow.displayName = 'SettingsRow'
