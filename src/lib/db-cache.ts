import { query } from './db'
import { CACHE_DURATIONS, CACHE_TAGS, cachedFetch } from './cache'

export const getUserGroupId = async (userId: string): Promise<string | null> => {
  return cachedFetch(
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
  )
}
