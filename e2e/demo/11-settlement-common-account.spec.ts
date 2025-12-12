import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail } from '../utils/test-helpers'
import { loginUser, insertTransactions } from '../utils/demo-helpers'

test.describe('Scenario 11: Settlement with Common Account', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `common-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Common User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should handle common account transactions correctly', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Common Account Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 40000, description: 'Rent', payer_type: 'UserA', expense_type: 'Household' },
      { date: '2025-12-05', amount: 20000, description: 'Utilities', payer_type: 'Common', expense_type: 'Household' },
    ])

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    await expect(page.locator('tr', { hasText: 'Rent' })).toBeVisible()
    await expect(page.locator('tr', { hasText: 'Utilities' })).toBeVisible()
    await expect(page.locator('[data-testid="transaction-payer"]', { hasText: 'Common' })).toBeVisible()

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    const monthSelect = page.locator('select[name="settlement-month"]')
    await monthSelect.selectOption('2025-12')
    await page.waitForTimeout(1000)

    await expect(page.getByText(/User B pays.*Common User/)).toBeVisible()
  })
})
