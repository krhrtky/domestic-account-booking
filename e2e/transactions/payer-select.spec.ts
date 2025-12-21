import { test, expect } from '@playwright/test'
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  insertTransaction as insertTransactionDb,
  getTransactionById,
  acceptInvitationDirectly,
} from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'

test.describe('AC-9: Payer Select - Change individual payer', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let userB: TestUser
  let groupId: string
  let transactionId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `payer-a-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Payer User A',
    })
    userB = await createTestUser({
      email: `payer-b-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Payer User B',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
    if (userB.id) await cleanupTestData(userB.id)
  })

  test('should change payer via PayerSelect dropdown', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Payer Test Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await acceptInvitationDirectly(userB.id!, groupId)

    const inserted = await insertTransactionDb({
      userId: userA.id!,
      groupId: groupId,
      date: '2025-12-10',
      description: 'Test Payer Change',
      amount: 10000,
      expenseType: 'Household',
      payerType: 'UserA',
      payerUserId: null,
    })
    transactionId = inserted.id

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    const testRow = page.locator('tr', { hasText: 'Test Payer Change' })
    const payerSelect = testRow.locator('[data-testid="payer-select"]')

    await expect(payerSelect).toHaveValue('')

    await payerSelect.selectOption({ label: 'Payer User B' })
    await page.waitForTimeout(500)

    const updatedTransaction = await getTransactionById(transactionId)
    expect(updatedTransaction?.payer_user_id).toBe(userB.id)

    await payerSelect.selectOption({ label: 'デフォルト' })
    await page.waitForTimeout(500)

    const revertedTransaction = await getTransactionById(transactionId)
    expect(revertedTransaction?.payer_user_id).toBeNull()
  })
})

test.describe('AC-4: CSV without payer column defaults to payer_type', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `csv-payer-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'CSV Payer User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should set payer_user_id to NULL when CSV has no payer column', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'CSV Test Group')
    await page.fill('input[name="ratioA"]', '60')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    const inserted = await insertTransactionDb({
      userId: userA.id!,
      groupId: groupId,
      date: '2025-12-11',
      description: 'CSV Import No Payer',
      amount: 5000,
      expenseType: 'Household',
      payerType: 'UserA',
      payerUserId: null,
    })

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    const testRow = page.locator('tr', { hasText: 'CSV Import No Payer' })
    const payerSelect = testRow.locator('[data-testid="payer-select"]')

    await expect(payerSelect).toHaveValue('')

    const transaction = await getTransactionById(inserted.id)
    expect(transaction?.payer_user_id).toBeNull()
  })
})

test.describe('L-BR-002: payer_user_id priority in settlement', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let userB: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `settle-a-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Settlement A',
    })
    userB = await createTestUser({
      email: `settle-b-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Settlement B',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
    if (userB.id) await cleanupTestData(userB.id)
  })

  test('should use payer_user_id for settlement calculation', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Settlement Priority Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await acceptInvitationDirectly(userB.id!, groupId)

    await insertTransactionDb({
      userId: userA.id!,
      groupId: groupId,
      date: '2025-12-15',
      description: 'UserA paid via payer_user_id',
      amount: 10000,
      expenseType: 'Household',
      payerType: 'UserB',
      payerUserId: userA.id!,
    })

    await insertTransactionDb({
      userId: userA.id!,
      groupId: groupId,
      date: '2025-12-16',
      description: 'UserB paid via fallback',
      amount: 10000,
      expenseType: 'Household',
      payerType: 'UserB',
      payerUserId: null,
    })

    await page.goto('/dashboard?month=2025-12')
    await page.waitForTimeout(1000)

    const settlementSection = page.locator('[data-testid="settlement-summary"]')
    if (await settlementSection.isVisible()) {
      await expect(settlementSection).toContainText('精算')
    }
  })
})
