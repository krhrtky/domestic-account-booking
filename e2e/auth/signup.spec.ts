import { test, expect } from '@playwright/test'
import { generateTestEmail, cleanupTestData, getAuthUserByEmail } from '../utils/test-helpers'

test.describe('Sign Up Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  let testEmail: string
  let userId: string

  test.beforeEach(() => {
    testEmail = generateTestEmail()
  })

  test.afterEach(async () => {
    if (userId) {
      await cleanupTestData(userId)
    }
  })

  test('should successfully sign up a new user', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText('Welcome')).toBeVisible()

    const authUser = await getAuthUserByEmail(testEmail)
    expect(authUser).toBeDefined()
    userId = authUser!.id
  })

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'password123')

    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should show error for short password', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'short')

    const passwordInput = page.locator('input[name="password"]')
    await expect(passwordInput).toHaveAttribute('minLength', '8')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/signup')

    await page.click('a[href="/login"]')

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible()
  })
})
