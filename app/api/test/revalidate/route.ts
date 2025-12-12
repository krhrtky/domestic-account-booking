import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production' && !process.env.E2E_TEST) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { groupId, month } = await request.json()

  if (!groupId) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
  }

  revalidateTag(CACHE_TAGS.transactions(groupId))
  revalidateTag(CACHE_TAGS.settlementAll(groupId))

  if (month) {
    revalidateTag(CACHE_TAGS.settlement(groupId, month))
  }

  return NextResponse.json({ success: true })
}
