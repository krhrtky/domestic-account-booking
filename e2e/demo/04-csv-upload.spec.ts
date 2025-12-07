import { test, expect } from '@playwright/test'
import {
  createTestUser,
  cleanupTestData,
  TestUser,
  getUserByEmail,
  getTransactionsByGroupId,
} from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'
import path from 'path'

test.describe('Scenario 4: CSV Upload & Transaction Import', () => {
  let userA: TestUser
  let groupId: string

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `csv-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'CSV Test User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should upload CSV and import transactions', async ({ page }) => {
    await loginUser(page, userA)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'CSV Test Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const userData = await getUserByEmail(userA.email)
    groupId = userData!.group_id!

    await page.goto('/dashboard/transactions/upload')

    const csvFilePath = path.join(
      __dirname,
      '../../tests/fixtures/demo-csvs/valid-transactions.csv'
    )

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(csvFilePath)

    const payerSelect = page.locator('select[name="payerType"]')
    await payerSelect.selectOption('UserA')

    const uploadButton = page.locator('button:has-text("Upload")')
    await uploadButton.click()

    await expect(page).toHaveURL('/dashboard/transactions', { timeout: 10000 })

    await expect(page.getByText('Restaurant Dinner')).toBeVisible()
    await expect(page.getByText('Gas Station')).toBeVisible()
    await expect(page.getByText('Supermarket')).toBeVisible()

    const transactions = await getTransactionsByGroupId(groupId)
    expect(transactions).toHaveLength(3)
    expect(transactions.every(t => t.expense_type === 'Household')).toBe(true)
  })
})
