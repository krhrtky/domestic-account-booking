import { Page } from '@playwright/test'
import { supabaseAdmin, TestUser, createTestUser } from './test-helpers'

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

export const loginUser = async (page: Page, user: TestUser) => {
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
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('group_id')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data.group_id
}

export const insertTransaction = async (
  groupId: string,
  userId: string,
  transaction: DemoTransaction
): Promise<void> => {
  const { error } = await supabaseAdmin.from('transactions').insert({
    group_id: groupId,
    user_id: userId,
    date: transaction.date,
    amount: transaction.amount,
    description: transaction.description,
    payer_type: transaction.payer_type,
    expense_type: transaction.expense_type,
  })

  if (error) throw error
}

export const insertTransactions = async (
  groupId: string,
  userId: string,
  transactions: DemoTransaction[]
): Promise<void> => {
  const records = transactions.map((t) => ({
    group_id: groupId,
    user_id: userId,
    date: t.date,
    amount: t.amount,
    description: t.description,
    payer_type: t.payer_type,
    expense_type: t.expense_type,
  }))

  const { error } = await supabaseAdmin.from('transactions').insert(records)
  if (error) throw error
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
  const { error } = await supabaseAdmin
    .from('groups')
    .update({ ratio_a: ratioA, ratio_b: ratioB })
    .eq('id', groupId)

  if (error) throw error
}

export const deleteAllTransactions = async (groupId: string): Promise<void> => {
  await supabaseAdmin.from('transactions').delete().eq('group_id', groupId)
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
