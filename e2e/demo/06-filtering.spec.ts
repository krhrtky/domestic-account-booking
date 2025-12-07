import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser, getUserByEmail } from '../utils/test-helpers'
import { loginUser, insertTransactions } from '../utils/demo-helpers'

test.describe('Scenario 6: Transaction Filtering', () => {
  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `filter-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Filter User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should filter transactions by month, payer, and type', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Filter Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 5000, description: 'Dec UserA Household', payer_type: 'UserA', expense_type: 'Household' },
      { date: '2025-12-05', amount: 3000, description: 'Dec UserB Household', payer_type: 'UserB', expense_type: 'Household' },
      { date: '2025-12-10', amount: 2000, description: 'Dec UserA Personal', payer_type: 'UserA', expense_type: 'Personal' },
      { date: '2025-11-15', amount: 4000, description: 'Nov UserA Household', payer_type: 'UserA', expense_type: 'Household' },
    ])

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    const monthInput = page.locator('input[type="month"]')
    await monthInput.fill('2025-12')
    await page.waitForTimeout(500)

    await expect(page.locator('tr', { hasText: 'Dec UserA Household' })).toBeVisible()
    await expect(page.locator('tr', { hasText: 'Nov UserA Household' })).not.toBeVisible()

    const expenseTypeFilter = page.locator('select[name="expenseType"]')
    await expenseTypeFilter.selectOption('Household')
    await page.waitForTimeout(500)

    await expect(page.locator('tr', { hasText: 'Dec UserA Household' })).toBeVisible()
    await expect(page.locator('tr', { hasText: 'Dec UserA Personal' })).not.toBeVisible()

    const payerFilter = page.locator('select[name="payerType"]')
    await payerFilter.selectOption('UserA')
    await page.waitForTimeout(500)

    await expect(page.locator('tr', { hasText: 'Dec UserA Household' })).toBeVisible()
    await expect(page.locator('tr', { hasText: 'Dec UserB Household' })).not.toBeVisible()
  })
})
