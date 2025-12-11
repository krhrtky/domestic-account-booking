import { test, expect } from '@playwright/test'
import { generateTestEmail, createTestUser, cleanupTestData } from '../utils/test-helpers'

test.describe('Auth Validation Errors', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let testEmail: string

  test.beforeEach(() => {
    testEmail = generateTestEmail()
  })

  test('should show error for duplicate email signup', async ({ page }) => {
    const timestamp = Date.now()
    const existingUser = await createTestUser({
      email: `existing-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Existing User',
    })

    await page.goto('/signup')

    await page.fill('input[name="name"]', 'New User')
    await page.fill('input[name="email"]', existingUser.email)
    await page.fill('input[name="password"]', 'TestPassword123!')

    await page.click('button[type="submit"]')

    const errorToast = page.locator('[role="status"]').first()
    await expect(errorToast).toBeVisible({ timeout: 5000 })

    if (existingUser.id) await cleanupTestData(existingUser.id)
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'notanemail')
    await page.fill('input[name="password"]', 'TestPassword123!')

    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should validate password minimum length', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'short')

    const passwordInput = page.locator('input[name="password"]')
    await expect(passwordInput).toHaveAttribute('minLength', '8')
  })

  test('should show error for wrong password', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = await createTestUser({
      email: `wrong-pwd-${timestamp}@example.com`,
      password: 'CorrectPassword123!',
      name: 'Wrong Password User',
    })

    await page.goto('/login')

    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', 'WrongPassword123!')

    await page.click('button[type="submit"]')

    const errorToast = page.locator('[role="status"]').first()
    await expect(errorToast).toBeVisible({ timeout: 5000 })

    if (testUser.id) await cleanupTestData(testUser.id)
  })
})
