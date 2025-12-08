import { Page } from '@playwright/test'
import { TestUser, createTestUser } from './test-helpers'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export interface DemoGroup {
  id: string
  name: string
  ratio_a: number
  ratio_b: number
  user_a_id: string
  user_b_id?: string
}

export interface DemoTransaction {
  date: string
  amount: number
  description: string
  payer_type: 'UserA' | 'UserB' | 'Common'
  expense_type: 'Household' | 'Personal'
}

export const loginUser = async (page: Page, user: TestUser, skipIfAuthenticated = false) => {
  if (skipIfAuthenticated) {
    await page.goto('/dashboard')
    const currentUrl = page.url()
    if (!currentUrl.includes('/login')) {
      return
    }
  }

  await page.goto('/login')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

export const createGroup = async (
  page: Page,
  groupName: string,
  ratioA: number
): Promise<void> => {
  await page.goto('/settings')
  await page.fill('input[name="groupName"]', groupName)
  await page.fill('input[name="ratioA"]', ratioA.toString())
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=Group created successfully', { timeout: 10000 })
}

export const getGroupId = async (userId: string): Promise<string | null> => {
  const result = await pool.query<{ group_id: string | null }>(
    'SELECT group_id FROM users WHERE id = $1',
    [userId]
  )

  if (result.rows.length === 0) return null
  return result.rows[0].group_id
}

export const insertTransaction = async (
  groupId: string,
  userId: string,
  transaction: DemoTransaction
): Promise<void> => {
  await pool.query(
    `INSERT INTO transactions (group_id, user_id, date, amount, description, payer_type, expense_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      groupId,
      userId,
      transaction.date,
      transaction.amount,
      transaction.description,
      transaction.payer_type,
      transaction.expense_type,
    ]
  )
}

export const insertTransactions = async (
  groupId: string,
  userId: string,
  transactions: DemoTransaction[]
): Promise<void> => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    for (const t of transactions) {
      await client.query(
        `INSERT INTO transactions (group_id, user_id, date, amount, description, payer_type, expense_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [groupId, userId, t.date, t.amount, t.description, t.payer_type, t.expense_type]
      )
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const getInvitationUrl = async (page: Page): Promise<string> => {
  await page.goto('/settings')
  const inviteUrl = await page.locator('[data-testid="invite-url"]').textContent()
  if (!inviteUrl) throw new Error('Invitation URL not found')
  return inviteUrl.trim()
}

export const updateGroupRatio = async (
  groupId: string,
  ratioA: number,
  ratioB: number
): Promise<void> => {
  await pool.query(
    'UPDATE groups SET ratio_a = $1, ratio_b = $2 WHERE id = $3',
    [ratioA, ratioB, groupId]
  )
}

export const deleteAllTransactions = async (groupId: string): Promise<void> => {
  await pool.query('DELETE FROM transactions WHERE group_id = $1', [groupId])
}

export const createDemoUsers = async (): Promise<{
  userA: TestUser
  userB: TestUser
}> => {
  const timestamp = Date.now()
  const userA = await createTestUser({
    email: `demo-a-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: 'Demo User A',
  })

  const userB = await createTestUser({
    email: `demo-b-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: 'Demo User B',
  })

  return { userA, userB }
}

export const waitForSettlement = async (page: Page): Promise<void> => {
  await page.waitForSelector('[data-testid="settlement-summary"]', { timeout: 5000 })
}

export const getSettlementAmount = async (page: Page): Promise<number> => {
  const amountText = await page
    .locator('[data-testid="settlement-amount"]')
    .textContent()
  if (!amountText) return 0
  return parseFloat(amountText.replace(/[^0-9.-]/g, ''))
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}
