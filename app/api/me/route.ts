import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCurrentUser } from '@/lib/session'
import prisma from '@/lib/prisma'

const getSecurityHeaders = (requestId: string, responseTime: number) => ({
  'Content-Type': 'application/json; charset=utf-8',
  'X-Request-Id': requestId,
  'X-Response-Time': `${responseTime}ms`,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store'
})

export async function GET() {
  const startTime = Date.now()
  const requestId = randomUUID()

  const user = await getCurrentUser()

  if (!user) {
    const responseTime = Date.now() - startTime
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'E_AUTH_001',
          message: '認証が必要です'
        }
      },
      {
        status: 401,
        headers: getSecurityHeaders(requestId, responseTime)
      }
    )
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { groupId: true }
  })

  const groupId = userData?.groupId || null
  const responseTime = Date.now() - startTime

  return NextResponse.json(
    {
      success: true,
      data: {
        userId: user.id,
        groupId,
        email: user.email,
        name: user.name
      }
    },
    {
      status: 200,
      headers: getSecurityHeaders(requestId, responseTime)
    }
  )
}
