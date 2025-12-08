'use client'

import ErrorAlert from '@/components/ui/ErrorAlert'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <ErrorAlert
          title="Something went wrong"
          message={error.message || 'An unexpected error occurred'}
          retry={reset}
          variant="card"
        />
      </div>
    </div>
  )
}
