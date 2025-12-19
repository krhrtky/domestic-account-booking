interface LoadingSkeletonProps {
  variant: 'card' | 'table-row' | 'dashboard-stats'
  count?: number
}

export default function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count })

  if (variant === 'card') {
    return (
      <div className="card-glass p-6" role="status" aria-busy="true" aria-label="Loading content">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-200 animate-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded-lg w-1/3 animate-shimmer" />
              <div className="h-5 bg-neutral-200 rounded-lg w-2/3 animate-shimmer" style={{ animationDelay: '0.1s' }} />
            </div>
            <div className="h-8 bg-neutral-200 rounded-lg w-24 animate-shimmer" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="h-px bg-neutral-200" />
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-100/50">
              <div className="h-3 bg-neutral-200 rounded w-1/2 mb-3 animate-shimmer" style={{ animationDelay: '0.1s' }} />
              <div className="h-6 bg-neutral-200 rounded w-3/4 animate-shimmer" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="p-4 rounded-xl bg-neutral-100/50">
              <div className="h-3 bg-neutral-200 rounded w-1/2 mb-3 animate-shimmer" style={{ animationDelay: '0.15s' }} />
              <div className="h-6 bg-neutral-200 rounded w-3/4 animate-shimmer" style={{ animationDelay: '0.25s' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'table-row') {
    return (
      <>
        {skeletons.map((_, index) => (
          <tr key={index} className="border-b border-neutral-100" role="status" aria-busy="true" aria-label="Loading row">
            <td className="px-4 py-4">
              <div className="h-4 bg-neutral-200 rounded-lg w-24 animate-shimmer" style={{ animationDelay: `${index * 0.05}s` }} />
            </td>
            <td className="px-4 py-4">
              <div className="h-4 bg-neutral-200 rounded-lg w-32 animate-shimmer" style={{ animationDelay: `${index * 0.05 + 0.1}s` }} />
            </td>
            <td className="px-4 py-4">
              <div className="h-4 bg-neutral-200 rounded-lg w-20 animate-shimmer" style={{ animationDelay: `${index * 0.05 + 0.2}s` }} />
            </td>
            <td className="px-4 py-4">
              <div className="h-6 bg-neutral-200 rounded-full w-16 animate-shimmer" style={{ animationDelay: `${index * 0.05 + 0.3}s` }} />
            </td>
          </tr>
        ))}
      </>
    )
  }

  if (variant === 'dashboard-stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="status" aria-busy="true" aria-label="Loading dashboard">
        {skeletons.map((_, index) => (
          <div key={index} className="card-glass p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-200 animate-shimmer" style={{ animationDelay: `${index * 0.1}s` }} />
              <div className="h-3 bg-neutral-200 rounded-lg w-1/2 animate-shimmer" style={{ animationDelay: `${index * 0.1 + 0.1}s` }} />
            </div>
            <div className="h-7 bg-neutral-200 rounded-lg w-3/4 animate-shimmer" style={{ animationDelay: `${index * 0.1 + 0.2}s` }} />
          </div>
        ))}
      </div>
    )
  }

  return null
}
