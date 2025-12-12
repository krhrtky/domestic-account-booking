import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail } from '../utils/test-helpers'
import { loginUser, insertTransactions, revalidateCache } from '../utils/demo-helpers'

const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const getDateInCurrentMonth = (day: number) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const dayStr = String(day).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

test.describe('Scenario 9: Settlement Calculation - Equal Ratio', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `settle-equal-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Settlement User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should calculate settlement with 50/50 ratio correctly', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Equal Settlement Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    const currentMonth = getCurrentMonth()

    await insertTransactions(groupId, userA.id!, [
      { date: getDateInCurrentMonth(1), amount: 30000, description: 'Rent', payer_type: 'UserA', expense_type: 'Household' },
      { date: getDateInCurrentMonth(5), amount: 30000, description: 'Utilities', payer_type: 'UserA', expense_type: 'Household' },
      { date: getDateInCurrentMonth(10), amount: 20000, description: 'Groceries', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await revalidateCache(groupId, currentMonth)

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const monthSelector = page.locator('select')
    if (await monthSelector.isVisible()) {
      await monthSelector.selectOption(currentMonth)
      await page.waitForTimeout(1000)
    }

    await page.waitForTimeout(2000)

    await expect(page.locator('[data-testid="settlement-summary"]')).toBeVisible({ timeout: 15000 })

    await expect(page.getByText(/80,000/)).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(/60,000/)).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(/20,000/).first()).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(/User B pays.*Settlement User/)).toBeVisible({ timeout: 10000 })
  })
})
