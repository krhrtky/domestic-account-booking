import { test, expect } from '@playwright/test'
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  deleteTransactionsByGroupId,
} from '../utils/test-helpers'
import { loginUser, insertTransactions } from '../utils/demo-helpers'

test.describe('Scenario 15: Edge Cases & Data Boundaries', () => {
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

    await expect(page.getByText(/0|no transactions/i)).toBeVisible()
  })

  test('should handle exactly equal contributions', async ({ page }) => {
    await loginUser(page, userA)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 50000, description: 'UserA Payment', payer_type: 'UserA', expense_type: 'Household' },
      { date: '2025-12-05', amount: 50000, description: 'UserB Payment', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    const monthSelect = page.locator('select[name="settlement-month"]')
    await monthSelect.selectOption('2025-12')
    await page.waitForTimeout(1000)

    await expect(page.getByText(/0|balanced|no payment/i)).toBeVisible()
  })

  test('should handle single transaction', async ({ page }) => {
    await loginUser(page, userA)

    await deleteTransactionsByGroupId(groupId)

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 10000, description: 'Single Payment', payer_type: 'UserA', expense_type: 'Household' },
    ])

    await page.goto('/dashboard')
    await page.waitForTimeout(1000)

    await page.locator('select[name="settlement-month"]').selectOption('2025-12')
    await page.waitForTimeout(1000)

    await expect(page.getByText('¥10,000')).toBeVisible()
  })

  test('should handle very large amounts', async ({ page }) => {
    await loginUser(page, userA)

    await deleteTransactionsByGroupId(groupId)

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-26', amount: 999999999, description: 'Large Investment', payer_type: 'UserB', expense_type: 'Household' },
    ])

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    await expect(page.getByText('Large Investment')).toBeVisible()
    await expect(page.getByText(/999,999,999/)).toBeVisible()
  })

  test('should handle very small amounts', async ({ page }) => {
    await loginUser(page, userA)

    await deleteTransactionsByGroupId(groupId)

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-25', amount: 50, description: 'Small Purchase', payer_type: 'UserA', expense_type: 'Household' },
    ])

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    await expect(page.getByText('Small Purchase')).toBeVisible()
    await expect(page.getByText('50')).toBeVisible()
  })

  test('should handle special characters in description', async ({ page }) => {
    await loginUser(page, userA)

    await deleteTransactionsByGroupId(groupId)

    await insertTransactions(groupId, userA.id!, [
      { date: '2025-12-01', amount: 3500, description: "Café & Restaurant (50% off!)", payer_type: 'UserA', expense_type: 'Household' },
    ])

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    await expect(page.getByText("Café & Restaurant (50% off!)")).toBeVisible()
  })

  test('should handle future dates', async ({ page }) => {
    await loginUser(page, userA)

    await deleteTransactionsByGroupId(groupId)

    await insertTransactions(groupId, userA.id!, [
      { date: '2099-12-31', amount: 10000, description: 'Future Transaction', payer_type: 'UserA', expense_type: 'Household' },
    ])

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(1000)

    await expect(page.getByText('Future Transaction')).toBeVisible()
  })
})
