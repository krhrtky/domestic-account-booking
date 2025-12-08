import { cache } from 'react'
import { query } from './db'

export const getUserGroupId = cache(async (userId: string) => {
  const result = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [userId]
  )
  return result.rows[0]?.group_id || null
})
