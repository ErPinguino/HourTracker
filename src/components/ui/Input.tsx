import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && <label className="text-[13px] font-medium text-gray-500 dark:text-gray-400 ml-1">{label}</label>}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] 
            border shadow-sm text-[17px] text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all
            ${error ? 'border-red-300 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-800'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-[13px] text-red-500 ml-1">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
