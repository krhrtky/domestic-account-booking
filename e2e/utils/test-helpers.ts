import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'Missing required environment variable: DATABASE_URL is required for E2E tests'
  )
}

const pool = new Pool({
  connectionString: databaseUrl,
})

export interface TestUser {
  email: string
  password: string
  name: string
  id?: string
}

export const createTestUser = async (user: TestUser) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const passwordHash = await bcrypt.hash(user.password, 12)

    const authResult = await client.query<{ id: string }>(
      'INSERT INTO auth.users (id, email, password_hash) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
      [user.email.toLowerCase(), passwordHash]
    )

    const userId = authResult.rows[0].id

    await client.query(
      'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
      [userId, user.name, user.email.toLowerCase()]
    )

    await client.query('COMMIT')

    return { ...user, id: userId }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const deleteTestUser = async (userId: string) => {
  await pool.query('DELETE FROM auth.users WHERE id = $1', [userId])
}

export const cleanupTestData = async (userId: string) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query('DELETE FROM transactions WHERE user_id = $1', [userId])
    await client.query('DELETE FROM invitations WHERE inviter_id = $1', [userId])
    await client.query('DELETE FROM groups WHERE user_a_id = $1', [userId])
    await client.query('DELETE FROM groups WHERE user_b_id = $1', [userId])
    await client.query('DELETE FROM users WHERE id = $1', [userId])
    await client.query('DELETE FROM auth.users WHERE id = $1', [userId])

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const generateTestEmail = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `test-${timestamp}-${random}@example.com`
}

export const getUserByEmail = async (email: string) => {
  const result = await pool.query<{ id: string; group_id: string | null }>(
    'SELECT id, group_id FROM users WHERE email = $1',
    [email.toLowerCase()]
  )
  return result.rows[0] || null
}

export const getAuthUserByEmail = async (email: string) => {
  const result = await pool.query<{ id: string; email: string }>(
    'SELECT id, email FROM auth.users WHERE email = $1',
    [email.toLowerCase()]
  )
  return result.rows[0] || null
}

export const getGroupById = async (groupId: string) => {
  const result = await pool.query<{
    id: string
    user_a_id: string
    user_b_id: string | null
    ratio_a: number
    ratio_b: number
  }>('SELECT * FROM groups WHERE id = $1', [groupId])
  return result.rows[0] || null
}

export const getTransactionsByGroupId = async (groupId: string) => {
  const result = await pool.query<{
    id: string
    user_id: string
    group_id: string
    date: Date
    description: string
    amount: number
    payer_type: string
    expense_type: string
  }>('SELECT * FROM transactions WHERE group_id = $1 ORDER BY date DESC', [groupId])
  return result.rows
}

export const insertTransaction = async (transaction: {
  userId: string
  groupId: string
  date: string
  description: string
  amount: number
  expenseType: string
  payerType?: 'UserA' | 'UserB' | 'Common'
}) => {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO transactions (user_id, group_id, date, description, amount, payer_type, expense_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      transaction.userId,
      transaction.groupId,
      transaction.date,
      transaction.description,
      transaction.amount,
      transaction.payerType || 'UserA',
      transaction.expenseType,
    ]
  )
  return result.rows[0]
}

export const insertTransactions = async (
  transactions: Array<{
    userId: string
    groupId: string
    date: string
    description: string
    amount: number
    expenseType: string
    payerType?: 'UserA' | 'UserB' | 'Common'
  }>
) => {
  if (transactions.length === 0) return []

  const values: unknown[] = []
  const placeholders: string[] = []

  transactions.forEach((t, i) => {
    const offset = i * 7
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
    )
    values.push(t.userId, t.groupId, t.date, t.description, t.amount, t.payerType || 'UserA', t.expenseType)
  })

  const result = await pool.query<{ id: string }>(
    `INSERT INTO transactions (user_id, group_id, date, description, amount, payer_type, expense_type)
     VALUES ${placeholders.join(', ')} RETURNING id`,
    values
  )
  return result.rows
}

export const getTransactionById = async (transactionId: string) => {
  const result = await pool.query<{
    id: string
    user_id: string
    group_id: string
    date: Date
    description: string
    amount: number
    payer_type: string
    expense_type: string
  }>('SELECT * FROM transactions WHERE id = $1', [transactionId])
  return result.rows[0] || null
}

export const deleteTransactionsByGroupId = async (groupId: string) => {
  await pool.query('DELETE FROM transactions WHERE group_id = $1', [groupId])
}

export const updateGroupRatio = async (
  groupId: string,
  ratioA: number,
  ratioB: number
) => {
  await pool.query('UPDATE groups SET ratio_a = $1, ratio_b = $2 WHERE id = $3', [
    ratioA,
    ratioB,
    groupId,
  ])
}
