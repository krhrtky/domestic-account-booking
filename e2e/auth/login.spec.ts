import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'

test.describe('Login Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

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

    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()

    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill(testUser.password)

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText(/(おはようございます|こんにちは|こんばんは)/)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill('wrongpassword')

    await page.click('button[type="submit"]')

    const errorToast = page.locator('[role="status"]').first()
    await expect(errorToast).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login')

    await page.click('a[href="/signup"]')

    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible()
  })

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill(testUser.password)

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    await expect(submitButton).toHaveText('ログイン中...')
  })
})
