import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'
import path from 'path'

test.describe('Scenario 14: CSV Upload Error Handling', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should show error for invalid CSV format', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = await createTestUser({
      email: `csv-error-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'CSV Error User',
    })

    await loginUser(page, testUser)
    await page.goto('/settings')

    await page.fill('input[name="groupName"]', 'CSV Error Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    await page.goto('/dashboard/transactions/upload')

    const csvFilePath = path.join(
      __dirname,
      '../../tests/fixtures/demo-csvs/invalid-missing-columns.csv'
    )

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(csvFilePath)

    await page.waitForTimeout(1000)

    await expect(page.getByText(/必須列.*が見つかりません/)).toBeVisible()

    if (testUser.id) await cleanupTestData(testUser.id)
  })
})
