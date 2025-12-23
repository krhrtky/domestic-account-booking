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
  test.use({ storageState: { cookies: [], origins: [] } })

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

  test.skip('should paginate large transaction lists', async ({ page }) => {
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
    expect(initialCount).toBe(25)

    const showingText = page.locator('text=/Showing 1-25 of 75 transactions/')
    await expect(showingText).toBeVisible()

    const nextButton = page.locator('button[aria-label="Next page"]')
    await expect(nextButton).toBeEnabled()

    await nextButton.click()
    await page.waitForTimeout(1000)

    const page2Rows = await transactionRows.count()
    expect(page2Rows).toBe(25)

    const showingPage2 = page.locator('text=/Showing 26-50 of 75 transactions/')
    await expect(showingPage2).toBeVisible()

    const page3Button = page.locator('button[aria-label="Page 3"]')
    await page3Button.click()
    await page.waitForTimeout(1000)

    const page3Rows = await transactionRows.count()
    expect(page3Rows).toBe(25)

    const showingPage3 = page.locator('text=/Showing 51-75 of 75 transactions/')
    await expect(showingPage3).toBeVisible()

    const allTransactions = await getTransactionsByGroupId(groupId)
    expect(allTransactions).toHaveLength(75)
  })
})
