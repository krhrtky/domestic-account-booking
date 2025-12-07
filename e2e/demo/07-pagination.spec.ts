import { test, expect } from '@playwright/test'
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  getTransactionsByGroupId,
} from '../utils/test-helpers'
import { loginUser, insertTransactions } from '../utils/demo-helpers'
import { paginationTransactions } from '../fixtures/demo-data'

test.describe('Scenario 7: Transaction Pagination', () => {
  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `paginate-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Pagination User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should paginate large transaction lists', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'Pagination Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await insertTransactions(groupId, userA.id!, paginationTransactions(75))

    await page.goto('/dashboard/transactions')
    await page.waitForTimeout(2000)

    const transactionRows = page.locator('[data-testid^="transaction-row-"]')
    const initialCount = await transactionRows.count()
    expect(initialCount).toBeLessThanOrEqual(50)

    const loadMoreButton = page.locator('button:has-text("Load More")')
    await expect(loadMoreButton).toBeVisible()

    await loadMoreButton.click()
    await page.waitForTimeout(1000)

    const updatedCount = await transactionRows.count()
    expect(updatedCount).toBeGreaterThan(initialCount)

    const allTransactions = await getTransactionsByGroupId(groupId)
    expect(allTransactions).toHaveLength(75)
  })
})
