import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'

test.describe('Login Flow', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    const timestamp = new Date().getTime()
    testUser = await createTestUser({
      email: `login-test-${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Login Test User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) {
      await cleanupTestData(testUser.id)
    }
  })

  test('should successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible()

    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText('Welcome')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', 'wrongpassword')

    const dialogPromise = page.waitForEvent('dialog')
    await page.click('button[type="submit"]')

    const dialog = await dialogPromise
    expect(dialog.message()).toContain('Invalid')
    await dialog.accept()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login')

    await page.click('a[href="/signup"]')

    await expect(page).toHaveURL('/signup')
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
  })

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    await expect(submitButton).toHaveText('Logging in...')
  })
})
