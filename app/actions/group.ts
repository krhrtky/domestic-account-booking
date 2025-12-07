'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const parsed = CreateGroupSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (existingUser?.group_id) {
    return { error: 'User already belongs to a group' }
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: parsed.data.name,
      ratio_a: parsed.data.ratio_a,
      ratio_b: parsed.data.ratio_b,
      user_a_id: user.id
    })
    .select()
    .single()

  if (groupError) {
    console.error('Group creation error:', groupError)
    return { error: `Failed to create group: ${groupError.message}` }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ group_id: group.id })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Failed to link user to group' }
  }

  return { success: true, group_id: group.id }
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  const { data: group } = await supabase
    .from('groups')
    .select('user_a_id, user_b_id')
    .eq('id', currentUser.group_id)
    .single()

  if (group?.user_b_id) {
    return { error: 'Group already has two members' }
  }

  if (group?.user_a_id !== user.id) {
    return { error: 'Only group creator can invite partners' }
  }

  const inviteToken = crypto.randomUUID()
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`

  const { error: insertError } = await supabase
    .from('invitations')
    .insert({
      id: inviteToken,
      group_id: currentUser.group_id,
      inviter_id: user.id,
      invitee_email: normalizedEmail,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

  if (insertError) {
    return { error: 'Failed to create invitation' }
  }

  return { success: true, invite_url: inviteUrl }
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign up or log in first' }
  }

  const { data: invite, error: inviteError } = await supabase
    .from('invitations')
    .select('*, groups(*)')
    .eq('id', token)
    .single()

  if (inviteError || !invite) {
    return { error: 'Invalid or expired invitation' }
  }

  if (invite.used_at) {
    return { error: 'Invitation already used' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'Invitation expired' }
  }

  const { error: updateUserError } = await supabase
    .from('users')
    .update({ group_id: invite.group_id })
    .eq('id', user.id)

  if (updateUserError) {
    return { error: 'Failed to join group' }
  }

  const { error: updateGroupError } = await supabase
    .from('groups')
    .update({ user_b_id: user.id })
    .eq('id', invite.group_id)

  if (updateGroupError) {
    return { error: 'Failed to update group' }
  }

  await supabase
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', token)

  return { success: true }
}

const RatioSchema = z.object({
  ratio_a: z.number().int().min(1).max(99),
  ratio_b: z.number().int().min(1).max(99)
}).refine(
  data => data.ratio_a + data.ratio_b === 100,
  { message: 'Ratios must sum to 100' }
)

export async function updateRatio(ratioA: number, ratioB: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const parsed = RatioSchema.safeParse({ ratio_a: ratioA, ratio_b: ratioB })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  const { error } = await supabase
    .from('groups')
    .update({
      ratio_a: parsed.data.ratio_a,
      ratio_b: parsed.data.ratio_b
    })
    .eq('id', currentUser.group_id)

  if (error) {
    return { error: 'Failed to update ratio' }
  }

  return { success: true }
}

export async function getCurrentGroup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('users')
    .select(`
      group_id,
      groups!inner (
        id,
        name,
        ratio_a,
        ratio_b,
        user_a:users!groups_user_a_id_fkey!inner (id, name, email),
        user_b:users!groups_user_b_id_fkey (id, name, email)
      )
    `)
    .eq('id', user.id)
    .single()

  if (error || !data?.groups) {
    return { error: 'No group found' }
  }

  const group = Array.isArray(data.groups) ? data.groups[0] : data.groups
  if (!group) {
    return { error: 'No group found' }
  }

  const userA = Array.isArray(group.user_a) ? group.user_a[0] : group.user_a
  const userB = group.user_b
    ? (Array.isArray(group.user_b) ? group.user_b[0] : group.user_b)
    : null

  return {
    success: true,
    group: {
      id: group.id,
      name: group.name,
      ratio_a: group.ratio_a,
      ratio_b: group.ratio_b,
      user_a: userA,
      user_b: userB
    }
  }
}
