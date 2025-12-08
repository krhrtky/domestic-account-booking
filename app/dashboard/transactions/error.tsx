'use client'

import ErrorAlert from '@/components/ui/ErrorAlert'

export default function TransactionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <ErrorAlert
          title="Failed to load transactions"
          message={error.message || 'An unexpected error occurred'}
          retry={reset}
          variant="card"
        />
      </div>
    </div>
  )
}
