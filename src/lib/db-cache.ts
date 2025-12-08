import { unstable_cache } from 'next/cache'
import { query } from './db'
import { CACHE_DURATIONS, CACHE_TAGS } from './cache'

export const getUserGroupId = async (userId: string): Promise<string | null> => {
  return unstable_cache(
    async () => {
      const result = await query<{ group_id: string | null }>(
        'SELECT group_id FROM users WHERE id = $1',
        [userId]
      )
      return result.rows[0]?.group_id || null
    },
    ['user-group', userId],
    {
      revalidate: CACHE_DURATIONS.userGroup,
      tags: [CACHE_TAGS.user(userId)]
    }
  )()
}
