import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'

test.describe('Scenario 13: Logout & Session Persistence', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let userA: TestUser

  test.beforeAll(async () => {
    const timestamp = Date.now()
    userA = await createTestUser({
      email: `session-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Session User',
    })
  })

  test.afterAll(async () => {
    if (userA.id) await cleanupTestData(userA.id)
  })

  test('should persist session and handle logout correctly', async ({ page, context }) => {
    await loginUser(page, userA)
    await expect(page).toHaveURL('/dashboard')

    await page.reload()
    await expect(page).toHaveURL('/dashboard')

    const cookies = await context.cookies()
    expect(cookies.length).toBeGreaterThan(0)

    await page.close()
    const newPage = await context.newPage()
    await newPage.goto('/dashboard')
    await expect(newPage).toHaveURL('/dashboard', { timeout: 5000 })

    const logoutButton = newPage.locator('button:has-text("Logout")')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await expect(newPage).toHaveURL(/\/login/, { timeout: 5000 })
    }

    await newPage.goto('/dashboard')
    await expect(newPage).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
