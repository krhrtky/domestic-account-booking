import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail } from '../utils/test-helpers'
import { loginUser, insertTransaction } from '../utils/demo-helpers'

test.describe('Scenario 3: Manual Transaction Entry', () => {
  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `manual-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User A',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should display manually inserted transactions', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Test Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransaction(groupId, userA.id!, {
      date: '2025-12-01',
      amount: 5000,
      description: 'Grocery Shopping',
      payer_type: 'UserA',
      expense_type: 'Household',
    })

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    const transactionRow = page.locator('tr', { hasText: 'Grocery Shopping' })
    await expect(transactionRow.locator('[data-testid="transaction-description"]')).toContainText('Grocery Shopping')
    await expect(transactionRow.locator('[data-testid="transaction-amount"]')).toContainText('5,000')
    await expect(transactionRow.locator('[data-testid="transaction-payer"]')).toContainText('UserA')
    await expect(transactionRow.locator('[data-testid="expense-type-toggle"]')).toContainText('Household')
  })
})
