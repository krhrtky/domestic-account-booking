import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail } from '../utils/test-helpers'
import { loginUser, insertTransactions, revalidateCache } from '../utils/demo-helpers'

test.describe.skip('Scenario 11: Settlement with Common Account', () => {
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
    await page.waitForLoadState('networkidle')

    await page.fill('input[name="groupName"]', 'Common Account Group')
    const slider = page.locator('input[name="ratioA"]')
    await slider.fill('50')
    await page.click('button:has-text("グループを作成")')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 40000, description: 'Rent', payer_type: 'UserA', expense_type: 'Household' },
      { date: '2025-12-05', amount: 20000, description: 'Utilities', payer_type: 'Common', expense_type: 'Household' },
    ])

    await revalidateCache(groupId, '2025-12')
    await page.waitForTimeout(500)

    await page.goto('/dashboard/transactions')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('tr', { hasText: 'Rent' })).toBeVisible()
    await expect(page.locator('tr', { hasText: 'Utilities' })).toBeVisible()
    await expect(page.locator('[data-testid="transaction-payer"]', { hasText: 'Common' })).toBeVisible()

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const monthSelector = page.locator('select')
    if (await monthSelector.isVisible()) {
      await monthSelector.selectOption('2025-12')
      await page.waitForLoadState('networkidle')
    }

    await expect(page.getByText(/ユーザーBがCommon Userに.*を支払う/)).toBeVisible()
  })
})
