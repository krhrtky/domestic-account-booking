import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail } from '../utils/test-helpers'
import { loginUser, insertTransactions, revalidateCache } from '../utils/demo-helpers'

test.describe('Scenario 10: Settlement Calculation - Unequal Ratio', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `settle-unequal-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Unequal User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should calculate settlement with 60/40 ratio correctly', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Unequal Settlement Group')
    await page.fill('input[name="ratioA"]', '60')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 30000, description: 'Rent', payer_type: 'UserA', expense_type: 'Household' },
      { date: '2025-12-05', amount: 50000, description: 'Furniture', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await revalidateCache(groupId, '2025-12')
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const monthSelect = page.locator('select[name="settlement-month"]')
    await monthSelect.selectOption('2025-11')
    await page.waitForTimeout(500)
    await monthSelect.selectOption('2025-12')
    await page.waitForTimeout(2000)

    await expect(page.locator('[data-testid="settlement-summary"]')).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(/80,000/)).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(/30,000/)).toBeVisible()

    await expect(page.getByText(/50,000/)).toBeVisible()

    await expect(page.getByText(/Unequal User pays.*User B/)).toBeVisible()
  })
})
