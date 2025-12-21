import prisma from './prisma'
import { CACHE_DURATIONS, CACHE_TAGS, cachedFetch } from './cache'

export const getUserGroupId = async (userId: string): Promise<string | null> => {
  return cachedFetch(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { groupId: true }
      })
      return user?.groupId || null
    },
    ['user-group', userId],
    {
      revalidate: CACHE_DURATIONS.userGroup,
      tags: [CACHE_TAGS.user(userId)]
    }
  )
}
