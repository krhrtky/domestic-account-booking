import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export interface SessionUser {
  id: string
  email: string
  name: string
}

export const getCurrentUser = async (): Promise<SessionUser | null> => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name
  }
}

export const requireAuth = async (): Promise<SessionUser> => {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
