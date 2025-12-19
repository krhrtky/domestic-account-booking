'use client'

import { useState } from 'react'

interface FormFieldProps {
  label: string
  name: string
  type: string
  error?: string
  required?: boolean
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  minLength?: number
}

export default function FormField({
  label,
  name,
  type,
  error,
  required,
  value,
  onChange,
  minLength
}: FormFieldProps) {
  const inputId = 'field-' + name
  const errorId = inputId + '-error'
  const [isFocused, setIsFocused] = useState(false)
  const isActive = isFocused || value.length > 0

  return (
    <div className="relative group">
      <div className="relative">
        <input
          type={type}
          id={inputId}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          minLength={minLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          placeholder=" "
          className={`
            peer w-full px-4 pt-6 pb-2 text-base rounded-xl border-2
            bg-white/60 backdrop-blur-sm text-neutral-900
            transition-all duration-200 ease-out
            placeholder:text-transparent
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${error
              ? 'border-semantic-error focus:border-semantic-error focus:ring-2 focus:ring-semantic-error/20'
              : 'border-neutral-200 hover:border-neutral-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
            }
            focus:outline-none focus:bg-white
          `}
          style={{
            boxShadow: isFocused && !error
              ? '0 0 0 3px rgba(91, 75, 138, 0.1), inset 0 1px 2px rgba(26, 25, 23, 0.02)'
              : 'inset 0 1px 2px rgba(26, 25, 23, 0.04)'
          }}
        />
        <label
          htmlFor={inputId}
          className={`
            absolute left-4 transition-all duration-200 ease-out pointer-events-none
            ${isActive
              ? 'top-2 text-xs font-medium'
              : 'top-1/2 -translate-y-1/2 text-sm'
            }
            ${error
              ? 'text-semantic-error'
              : isActive
                ? 'text-brand-primary'
                : 'text-neutral-500'
            }
            peer-focus:top-2 peer-focus:text-xs peer-focus:font-medium
            peer-focus:text-brand-primary peer-focus:-translate-y-0
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
            peer-placeholder-shown:text-sm peer-placeholder-shown:text-neutral-500
          `}
        >
          {label}
          {required && <span className="text-semantic-error ml-0.5">*</span>}
        </label>

        <div
          className={`
            absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-200
            ${error ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <svg
            className="w-5 h-5 text-semantic-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-200 ${error ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-semantic-error flex items-center gap-1.5 animate-fade-in-up"
          >
            <span className="inline-block w-1 h-1 rounded-full bg-semantic-error" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
