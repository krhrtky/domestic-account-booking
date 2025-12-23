'use client'

import { ButtonHTMLAttributes } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary'
}

function LoadingSpinner() {
  return (
    <div className="relative w-5 h-5">
      <div className="absolute inset-0 rounded-full border-2 border-white/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
    </div>
  )
}

export default function LoadingButton({
  isLoading,
  loadingText,
  children,
  className = '',
  variant = 'primary',
  ...props
}: LoadingButtonProps) {
  const baseStyles = `
    relative overflow-hidden
    inline-flex items-center justify-center gap-2
    px-6 py-3.5 text-sm font-medium rounded-xl
    transition-all duration-200 ease-out
    disabled:cursor-not-allowed
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  `

  const variantStyles = variant === 'primary'
    ? `
      text-white
      bg-gradient-to-br from-brand-primary to-brand-primary-light
      hover:from-brand-primary-dark hover:to-brand-primary
      focus-visible:ring-brand-primary
      shadow-md hover:shadow-lg hover:shadow-brand-primary/25
      hover:-translate-y-0.5 active:translate-y-0
      active:scale-[0.98]
      disabled:from-neutral-300 disabled:to-neutral-400 disabled:shadow-none disabled:hover:translate-y-0
    `
    : `
      text-neutral-700
      bg-white border-2 border-neutral-200
      hover:bg-neutral-50 hover:border-neutral-300
      focus-visible:ring-brand-primary
      shadow-sm hover:shadow-md
      hover:-translate-y-0.5 active:translate-y-0
      active:scale-[0.98]
      disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 disabled:shadow-none
    `

  return (
    <button
      disabled={isLoading || props.disabled}
      aria-busy={isLoading}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {!isLoading && (
        <span
          className="inline-flex items-center gap-2 transition-all duration-200"
        >
          {children}
        </span>
      )}

      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 animate-fade-in">
          <LoadingSpinner />
          {loadingText && (
            <span className="animate-pulse-gentle">{loadingText}</span>
          )}
        </span>
      )}

      <span
        className={`
          absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0
          -translate-x-full transition-transform duration-500
          ${!isLoading ? 'group-hover:translate-x-full' : ''}
        `}
      />
    </button>
  )
}
