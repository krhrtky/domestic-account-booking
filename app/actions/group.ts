'use server'

import { z } from 'zod'
import { db } from '@/db/client'
import { users, groups } from '@/db/schema'
import { requireAuth } from '@/lib/session'
import { getUserGroupId } from '@/lib/db-cache'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'
import { eq, and } from 'drizzle-orm'

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

  const existingUser = await db
    .select({ groupId: users.groupId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (existingUser.length === 0) {
    return { error: 'User not found' }
  }

  if (existingUser[0].groupId) {
    return { error: 'User already belongs to a group' }
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [newGroup] = await tx
        .insert(groups)
        .values({
          name: parsed.data.name,
          ratioA: parsed.data.ratio_a,
          ratioB: parsed.data.ratio_b,
          userAId: user.id,
        })
        .returning({ id: groups.id })

      const groupId = newGroup.id

      await tx
        .update(users)
        .set({ groupId })
        .where(eq(users.id, user.id))

      return groupId
    })

    revalidateTag(CACHE_TAGS.group(result))
    revalidateTag(CACHE_TAGS.user(user.id))

    return { success: true, group_id: result }
  } catch (error) {
    console.error('Group creation error:', error)
    return { error: 'Failed to create group' }
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

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'User is not in a group' }
  }

  try {
    await db
      .update(groups)
      .set({
        ratioA: parsed.data.ratio_a,
        ratioB: parsed.data.ratio_b,
      })
      .where(eq(groups.id, groupId))

    revalidateTag(CACHE_TAGS.group(groupId))

    return { success: true }
  } catch (error) {
    return { error: 'Failed to update ratio' }
  }
}

export async function getCurrentGroup() {
  const user = await requireAuth()

  const result = await db
    .select({
      groupId: users.groupId,
      groupName: groups.name,
      ratioA: groups.ratioA,
      ratioB: groups.ratioB,
      userAId: groups.userAId,
      userAName: users.name,
      userAEmail: users.email,
    })
    .from(users)
    .innerJoin(groups, eq(users.groupId, groups.id))
    .where(eq(users.id, user.id))
    .limit(1)

  if (result.length === 0) {
    return { error: 'No group found' }
  }

  const row = result[0]

  const userBData = row.groupId ? await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .innerJoin(groups, eq(users.groupId, groups.id))
    .where(and(
      eq(users.groupId, row.groupId),
      eq(groups.userBId, users.id)
    ))
    .limit(1)
    : []

  return {
    success: true,
    group: {
      id: row.groupId!,
      name: row.groupName,
      ratio_a: row.ratioA,
      ratio_b: row.ratioB,
      user_a: {
        id: row.userAId,
        name: row.userAName,
        email: row.userAEmail,
      },
      user_b: userBData.length > 0 ? {
        id: userBData[0].id,
        name: userBData[0].name,
        email: userBData[0].email,
      } : null,
    }
  }
}
