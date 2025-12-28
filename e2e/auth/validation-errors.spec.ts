import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData } from '../utils/test-helpers'

test.describe('Auth Validation Errors', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should show error for wrong password', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = await createTestUser({
      email: `wrong-pwd-${timestamp}@example.com`,
      password: 'CorrectPassword123!',
      name: 'Wrong Password User',
    })

    await page.goto('/login')

    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill('WrongPassword123!')

    await page.click('button[type="submit"]')

    const errorToast = page.locator('[role="status"]').first()
    await expect(errorToast).toBeVisible({ timeout: 5000 })

    if (testUser.id) await cleanupTestData(testUser.id)
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[name="email"]')
    await emailInput.waitFor({ state: 'visible' })

    await expect(emailInput).toHaveAttribute('type', 'email')
  })
})
