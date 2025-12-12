'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { acceptInvitation } from '@/app/actions/group'

export default function InvitePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/invite/${token}`)
      return
    }

    if (status === 'authenticated' && !processing) {
      setProcessing(true)
      acceptInvitation(token).then((result) => {
        if (result.error) {
          setError(result.error as string)
        } else {
          router.push('/dashboard')
        }
      })
    }
  }, [status, token, router, processing])

  if (status === 'loading' || processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-8 rounded-lg">
          <h1 className="text-xl font-bold text-red-800">Invalid Invitation</h1>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return null
}
