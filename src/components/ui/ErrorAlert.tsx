interface ErrorAlertProps {
  title?: string
  message: string
  retry?: () => void
  variant?: 'inline' | 'card'
}

export default function ErrorAlert({
  title = 'エラー',
  message,
  retry,
  variant = 'card'
}: ErrorAlertProps) {
  const isCard = variant === 'card'

  return (
    <div
      className={`
        ${isCard ? 'card-glass overflow-hidden' : 'rounded-xl'}
        animate-scale-in
      `}
      role="alert"
    >
      <div className={`
        ${isCard ? 'border-l-4 border-semantic-error p-6' : 'bg-semantic-error-light border border-semantic-error/30 p-4'}
        ${isCard ? 'bg-gradient-to-r from-semantic-error-light to-white' : ''}
      `}>
        <div className="flex items-start gap-4">
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
            ${isCard ? 'bg-semantic-error/10' : 'bg-semantic-error/20'}
          `}>
            <svg className="w-5 h-5 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-semantic-error">{title}</p>
            <p className="text-sm text-neutral-600 mt-1">{message}</p>
            {retry && (
              <button
                onClick={retry}
                aria-label="再読み込み"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-semantic-error hover:text-semantic-error/80 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                再試行する
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
