'use server'

import { z } from 'zod'
import { query, getClient } from '@/lib/db'
import { requireAuth } from '@/lib/session'

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100).default('Household'),
  ratio_a: z.number().int().min(1).max(99).default(50),
  ratio_b: z.number().int().min(1).max(99).default(50)
}).refine(
  data => data.ratio_a + data.ratio_b === 100,
  { message: 'Ratios must sum to 100' }
)

export async function createGroup(data: {
  name?: string
  ratio_a?: number
  ratio_b?: number
}) {
  const user = await requireAuth()

  const parsed = CreateGroupSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const existingUserResult = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [user.id]
  )

  if (existingUserResult.rows.length === 0) {
    return { error: 'User not found' }
  }

  if (existingUserResult.rows[0].group_id) {
    return { error: 'User already belongs to a group' }
  }

  const client = await getClient()

  try {
    await client.query('BEGIN')

    const groupResult = await client.query<{ id: string }>(
      `INSERT INTO groups (name, ratio_a, ratio_b, user_a_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [parsed.data.name, parsed.data.ratio_a, parsed.data.ratio_b, user.id]
    )

    const groupId = groupResult.rows[0].id

    await client.query(
      'UPDATE users SET group_id = $1 WHERE id = $2',
      [groupId, user.id]
    )

    await client.query('COMMIT')

    return { success: true, group_id: groupId }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Group creation error:', error)
    return { error: 'Failed to create group' }
  } finally {
    client.release()
  }
}

const InviteSchema = z.object({
  email: z.string().email()
})

export async function invitePartner(email: string) {
  const parsed = InviteSchema.safeParse({ email })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  const normalizedEmail = parsed.data.email.toLowerCase()

  const user = await requireAuth()

  const currentUserResult = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [user.id]
  )

  if (!currentUserResult.rows[0]?.group_id) {
    return { error: 'User is not in a group' }
  }

  const groupId = currentUserResult.rows[0].group_id

  const groupResult = await query<{ user_a_id: string; user_b_id: string | null }>(
    'SELECT user_a_id, user_b_id FROM groups WHERE id = $1',
    [groupId]
  )

  if (groupResult.rows.length === 0) {
    return { error: 'Group not found' }
  }

  const group = groupResult.rows[0]

  if (group.user_b_id) {
    return { error: 'Group already has two members' }
  }

  if (group.user_a_id !== user.id) {
    return { error: 'Only group creator can invite partners' }
  }

  const inviteToken = crypto.randomUUID()
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  try {
    await query(
      `INSERT INTO invitations (id, group_id, inviter_id, invitee_email, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [inviteToken, groupId, user.id, normalizedEmail, expiresAt]
    )

    return { success: true, invite_url: inviteUrl }
  } catch (error) {
    return { error: 'Failed to create invitation' }
  }
}

export async function acceptInvitation(token: string) {
  const user = await requireAuth()

  const inviteResult = await query<{
    group_id: string
    used_at: string | null
    expires_at: string
  }>(
    'SELECT group_id, used_at, expires_at FROM invitations WHERE id = $1',
    [token]
  )

  if (inviteResult.rows.length === 0) {
    return { error: 'Invalid or expired invitation' }
  }

  const invite = inviteResult.rows[0]

  if (invite.used_at) {
    return { error: 'Invitation already used' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'Invitation expired' }
  }

  const client = await getClient()

  try {
    await client.query('BEGIN')

    await client.query(
      'UPDATE users SET group_id = $1 WHERE id = $2',
      [invite.group_id, user.id]
    )

    await client.query(
      'UPDATE groups SET user_b_id = $1 WHERE id = $2',
      [user.id, invite.group_id]
    )

    await client.query(
      'UPDATE invitations SET used_at = $1 WHERE id = $2',
      [new Date().toISOString(), token]
    )

    await client.query('COMMIT')

    return { success: true }
  } catch (error) {
    await client.query('ROLLBACK')
    return { error: 'Failed to accept invitation' }
  } finally {
    client.release()
  }
}

const RatioSchema = z.object({
  ratio_a: z.number().int().min(1).max(99),
  ratio_b: z.number().int().min(1).max(99)
}).refine(
  data => data.ratio_a + data.ratio_b === 100,
  { message: 'Ratios must sum to 100' }
)

export async function updateRatio(ratioA: number, ratioB: number) {
  const user = await requireAuth()

  const parsed = RatioSchema.safeParse({ ratio_a: ratioA, ratio_b: ratioB })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const currentUserResult = await query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [user.id]
  )

  if (!currentUserResult.rows[0]?.group_id) {
    return { error: 'User is not in a group' }
  }

  try {
    await query(
      'UPDATE groups SET ratio_a = $1, ratio_b = $2 WHERE id = $3',
      [parsed.data.ratio_a, parsed.data.ratio_b, currentUserResult.rows[0].group_id]
    )

    return { success: true }
  } catch (error) {
    return { error: 'Failed to update ratio' }
  }
}

export async function getCurrentGroup() {
  const user = await requireAuth()

  const result = await query<{
    group_id: string | null
    group_name: string
    ratio_a: number
    ratio_b: number
    user_a_id: string
    user_a_name: string
    user_a_email: string
    user_b_id: string | null
    user_b_name: string | null
    user_b_email: string | null
  }>(
    `SELECT
      u.group_id,
      g.name as group_name,
      g.ratio_a,
      g.ratio_b,
      ua.id as user_a_id,
      ua.name as user_a_name,
      ua.email as user_a_email,
      ub.id as user_b_id,
      ub.name as user_b_name,
      ub.email as user_b_email
    FROM users u
    INNER JOIN groups g ON u.group_id = g.id
    INNER JOIN users ua ON g.user_a_id = ua.id
    LEFT JOIN users ub ON g.user_b_id = ub.id
    WHERE u.id = $1`,
    [user.id]
  )

  if (result.rows.length === 0) {
    return { error: 'No group found' }
  }

  const row = result.rows[0]

  return {
    success: true,
    group: {
      id: row.group_id!,
      name: row.group_name,
      ratio_a: row.ratio_a,
      ratio_b: row.ratio_b,
      user_a: {
        id: row.user_a_id,
        name: row.user_a_name,
        email: row.user_a_email
      },
      user_b: row.user_b_id ? {
        id: row.user_b_id,
        name: row.user_b_name!,
        email: row.user_b_email!
      } : null
    }
  }
}
