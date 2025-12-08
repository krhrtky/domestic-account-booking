interface LoadingSkeletonProps {
  variant: 'card' | 'table-row' | 'dashboard-stats'
  count?: number
}

export default function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count })

  if (variant === 'card') {
    return (
      <div className="bg-white p-6 rounded-lg shadow" role="status" aria-busy="true">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (variant === 'table-row') {
    return (
      <>
        {skeletons.map((_, index) => (
          <tr key={index} className="border-b" role="status" aria-busy="true">
            <td className="px-4 py-3">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
            </td>
            <td className="px-4 py-3">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div>
            </td>
            <td className="px-4 py-3">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-4 py-3">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
            </td>
          </tr>
        ))}
      </>
    )
  }

  if (variant === 'dashboard-stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="status" aria-busy="true">
        {skeletons.map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <div className="animate-pulse space-y-3">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}
