import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for E2E tests'
  )
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export interface TestUser {
  email: string
  password: string
  name: string
  id?: string
}

export const createTestUser = async (user: TestUser) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    user_metadata: { name: user.name },
    email_confirm: true,
  })

  if (error) throw error
  return { ...user, id: data.user.id }
}

export const deleteTestUser = async (userId: string) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
}

export const cleanupTestData = async (userId: string) => {
  await supabaseAdmin.from('transactions').delete().eq('user_id', userId)
  await supabaseAdmin.from('groups').delete().eq('user_a_id', userId)
  await supabaseAdmin.from('groups').delete().eq('user_b_id', userId)
  await supabaseAdmin.from('invitations').delete().eq('inviter_id', userId)
  await deleteTestUser(userId)
}

export const generateTestEmail = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `test-${timestamp}-${random}@example.com`
}
