import { ButtonHTMLAttributes } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
}

export default function LoadingButton({
  isLoading,
  loadingText = 'Loading...',
  children,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={isLoading}
      aria-busy={isLoading}
      className={`${className} disabled:opacity-50`}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  )
}
