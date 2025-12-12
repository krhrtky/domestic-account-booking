import { test, expect } from '@playwright/test'
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  deleteTransactionsByGroupId,
} from '../utils/test-helpers'
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

test.describe('Scenario 15: Edge Cases & Data Boundaries', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `edge-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Edge Case User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should handle zero transactions gracefully', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Empty Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    await expect(page.locator('[data-testid="settlement-summary"]').getByText(/0|no transactions/i)).toBeVisible()
  })

  test('should handle exactly equal contributions', async ({ page }) => {
    await loginUser(page, userA)

    await page.goto('/settings')
    await page.fill('input[name="groupName"]', 'Equal Test Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    const currentMonth = getCurrentMonth()

    await insertTransactions(groupId, userA.id!, [
      { date: getDateInCurrentMonth(1), amount: 50000, description: 'UserA Payment', payer_type: 'UserA', expense_type: 'Household' },
      { date: getDateInCurrentMonth(5), amount: 50000, description: 'UserB Payment', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await revalidateCache(groupId, currentMonth)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await expect(page.locator('[data-testid="settlement-summary"]')).toBeVisible({ timeout: 15000 })

    await expect(page.getByText('No payment needed')).toBeVisible({ timeout: 10000 })
  })

  test('should handle single transaction', async ({ page }) => {
    await loginUser(page, userA)

    const userData = await getUserByEmail(userA.email)
    const testGroupId = userData!.group_id!

    await deleteTransactionsByGroupId(testGroupId)

    const currentMonth = getCurrentMonth()

    await insertTransactions(testGroupId, userA.id!, [
      { date: getDateInCurrentMonth(1), amount: 10000, description: 'Single Payment', payer_type: 'UserA', expense_type: 'Household' },
    ])

    await revalidateCache(testGroupId, currentMonth)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await expect(page.locator('[data-testid="settlement-summary"]')).toBeVisible({ timeout: 15000 })

    await expect(page.getByText('¥10,000')).toBeVisible({ timeout: 10000 })
  })

  test('should handle very large amounts', async ({ page }) => {
    await loginUser(page, userA)

    const userData = await getUserByEmail(userA.email)
    const testGroupId = userData!.group_id!

    await deleteTransactionsByGroupId(testGroupId)

    await insertTransactions(testGroupId, userA.id!, [
      { date: getDateInCurrentMonth(2), amount: 999999999, description: 'Large Investment', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await revalidateCache(testGroupId)
    await page.goto('/dashboard/transactions')
    await page.reload()
    await page.waitForTimeout(1000)

    await expect(page.getByText('Large Investment')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/999,999,999/)).toBeVisible({ timeout: 10000 })
  })

  test('should handle very small amounts', async ({ page }) => {
    await loginUser(page, userA)

    const userData = await getUserByEmail(userA.email)
    const testGroupId = userData!.group_id!

    await deleteTransactionsByGroupId(testGroupId)

    await insertTransactions(testGroupId, userA.id!, [
      { date: getDateInCurrentMonth(3), amount: 50, description: 'Small Purchase', payer_type: 'UserA', expense_type: 'Household' },
    ])

    await revalidateCache(testGroupId)
    await page.goto('/dashboard/transactions')
    await page.reload()
    await page.waitForTimeout(1000)

    await expect(page.getByText('Small Purchase')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('50')).toBeVisible({ timeout: 10000 })
  })

  test('should handle special characters in description', async ({ page }) => {
    await loginUser(page, userA)

    const userData = await getUserByEmail(userA.email)
    const testGroupId = userData!.group_id!

    await deleteTransactionsByGroupId(testGroupId)

    await insertTransactions(testGroupId, userA.id!, [
      { date: getDateInCurrentMonth(4), amount: 3500, description: "Café & Restaurant (50% off!)", payer_type: 'UserA', expense_type: 'Household' },
    ])

    await revalidateCache(testGroupId)
    await page.goto('/dashboard/transactions')
    await page.reload()
    await page.waitForTimeout(1000)

    await expect(page.getByText("Café & Restaurant (50% off!)")).toBeVisible({ timeout: 10000 })
  })

  test('should handle future dates', async ({ page }) => {
    await loginUser(page, userA)

    const userData = await getUserByEmail(userA.email)
    const testGroupId = userData!.group_id!

    await deleteTransactionsByGroupId(testGroupId)

    await insertTransactions(testGroupId, userA.id!, [
      { date: '2099-12-31', amount: 10000, description: 'Future Transaction', payer_type: 'UserA', expense_type: 'Household' },
    ])

    await revalidateCache(testGroupId)
    await page.goto('/dashboard/transactions')
    await page.reload()
    await page.waitForTimeout(1000)

    await expect(page.getByText('Future Transaction')).toBeVisible({ timeout: 10000 })
  })
})
