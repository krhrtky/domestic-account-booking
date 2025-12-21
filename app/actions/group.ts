'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requireAuth, getCurrentUser } from '@/lib/session'
import { getUserGroupId } from '@/lib/db-cache'
import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

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

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { groupId: true }
  })

  if (!existingUser) {
    return { error: 'User not found' }
  }

  if (existingUser.groupId) {
    return { error: 'User already belongs to a group' }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: parsed.data.name,
          ratioA: parsed.data.ratio_a,
          ratioB: parsed.data.ratio_b,
          userAId: user.id
        }
      })

      await tx.user.update({
        where: { id: user.id },
        data: { groupId: group.id }
      })

      return group
    })

    revalidateTag(CACHE_TAGS.group(result.id))
    revalidateTag(CACHE_TAGS.user(user.id))

    return { success: true, group_id: result.id }
  } catch (error) {
    console.error('Group creation error:', error)
    return { error: 'Failed to create group' }
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

  const groupId = await getUserGroupId(user.id)

  if (!groupId) {
    return { error: 'User is not in a group' }
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { userAId: true, userBId: true }
  })

  if (!group) {
    return { error: 'Group not found' }
  }

  if (group.userBId) {
    return { error: 'Group already has two members' }
  }

  if (group.userAId !== user.id) {
    return { error: 'Only group creator can invite partners' }
  }

  const inviteToken = crypto.randomUUID()
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  try {
    await prisma.invitation.create({
      data: {
        id: inviteToken,
        groupId,
        inviterId: user.id,
        inviteeEmail: normalizedEmail,
        expiresAt
      }
    })

    return { success: true, invite_url: inviteUrl }
  } catch (error) {
    return { error: 'Failed to create invitation' }
  }
}

export async function acceptInvitation(token: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Please log in to accept this invitation' }
  }

  const invite = await prisma.invitation.findUnique({
    where: { id: token },
    select: { groupId: true, usedAt: true, expiresAt: true }
  })

  if (!invite) {
    return { error: 'Invalid or expired invitation' }
  }

  if (invite.usedAt) {
    return { error: 'Invitation already used' }
  }

  if (invite.expiresAt < new Date()) {
    return { error: 'Invitation expired' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { groupId: invite.groupId }
      })

      await tx.group.update({
        where: { id: invite.groupId },
        data: { userBId: user.id }
      })

      await tx.invitation.update({
        where: { id: token },
        data: { usedAt: new Date() }
      })
    })

    revalidateTag(CACHE_TAGS.group(invite.groupId))
    revalidateTag(CACHE_TAGS.user(user.id))

    return { success: true }
  } catch (error) {
    return { error: 'Failed to accept invitation' }
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
    await prisma.group.update({
      where: { id: groupId },
      data: {
        ratioA: parsed.data.ratio_a,
        ratioB: parsed.data.ratio_b
      }
    })

    revalidateTag(CACHE_TAGS.group(groupId))

    return { success: true }
  } catch (error) {
    return { error: 'Failed to update ratio' }
  }
}

export async function getCurrentGroup() {
  const user = await requireAuth()

  const result = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      groupId: true,
      group: {
        select: {
          id: true,
          name: true,
          ratioA: true,
          ratioB: true,
          userA: {
            select: { id: true, name: true, email: true }
          },
          userB: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  })

  if (!result?.group) {
    return { error: 'No group found' }
  }

  const group = result.group

  return {
    success: true,
    group: {
      id: group.id,
      name: group.name,
      ratio_a: group.ratioA,
      ratio_b: group.ratioB,
      user_a: {
        id: group.userA.id,
        name: group.userA.name,
        email: group.userA.email
      },
      user_b: group.userB ? {
        id: group.userB.id,
        name: group.userB.name,
        email: group.userB.email
      } : null
    }
  }
}
