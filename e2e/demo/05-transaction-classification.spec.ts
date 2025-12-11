import { test, expect } from '@playwright/test'
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  insertTransaction as insertTransactionDb,
  getTransactionById,
} from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'

test.describe('Scenario 5: Transaction Classification', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string
  let transactionId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `classify-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Classify User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should toggle transaction expense type', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Classify Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    const inserted = await insertTransactionDb({
      userId: userA.id!,
      groupId: groupId,
      date: '2025-12-07',
      description: 'Clothing Store',
      amount: 12000,
      expenseType: 'Household',
    })
    transactionId = inserted.id

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    const clothingRow = page.locator('tr', { hasText: 'Clothing Store' })
    const toggleButton = clothingRow.locator('[data-testid="expense-type-toggle"]')
    await expect(toggleButton).toContainText('Household')

    await toggleButton.click()
    await page.waitForTimeout(500)

    await expect(toggleButton).toContainText('Personal')

    const updatedTransaction = await getTransactionById(transactionId)
    expect(updatedTransaction?.expense_type).toBe('Personal')

    await toggleButton.click()
    await page.waitForTimeout(500)
    await expect(toggleButton).toContainText('Household')
  })
})
