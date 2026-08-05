import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  
  let variantClasses = ''
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800'
      break
    case 'secondary':
      variantClasses = 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3a3a3c] active:bg-gray-300'
      break
    case 'ghost':
      variantClasses = 'bg-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2c2c2e] active:scale-95'
      break
    case 'danger':
      variantClasses = 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 active:bg-red-200'
      break
  }

  return (
    <button
      className={`
        flex items-center justify-center font-medium rounded-2xl py-4 px-6
        transition-all duration-200 transform
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed transform-none hover:bg-auto' : 'active:scale-[0.98]'}
        ${variantClasses}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
