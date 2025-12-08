interface ErrorAlertProps {
  title?: string
  message: string
  retry?: () => void
  variant?: 'inline' | 'card'
}

export default function ErrorAlert({
  title = 'Error',
  message,
  retry,
  variant = 'card'
}: ErrorAlertProps) {
  const baseClasses = 'bg-red-50 border border-red-200 text-red-700'
  const variantClasses = variant === 'card' ? 'p-4 rounded-lg' : 'px-4 py-3 rounded'

  return (
    <div className={`${baseClasses} ${variantClasses}`} role="alert">
      <p className="font-medium">{title}</p>
      <p className="text-sm">{message}</p>
      {retry && (
        <button
          onClick={retry}
          aria-label="Retry loading"
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}
