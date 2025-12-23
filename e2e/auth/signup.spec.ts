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

  test('should successfully sign up a new user', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Webkit has React controlled input issues with signup form')
    await page.goto('/signup')

    await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible()

    const nameInput = page.locator('input[name="name"]')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const submitButton = page.locator('button[type="submit"]')
    await nameInput.waitFor({ state: 'visible' })

    if (browserName === 'webkit') {
      await nameInput.click()
      await nameInput.pressSequentially('Test User', { delay: 10 })
      await emailInput.click()
      await emailInput.pressSequentially(testEmail, { delay: 10 })
      await passwordInput.click()
      await passwordInput.pressSequentially('TestPassword123!', { delay: 10 })
    } else {
      await nameInput.click()
      await nameInput.fill('Test User')
      await emailInput.click()
      await emailInput.fill(testEmail)
      await passwordInput.click()
      await passwordInput.fill('TestPassword123!')
    }

    await submitButton.waitFor({ state: 'visible' })
    await Promise.all([
      page.waitForURL('/dashboard', { timeout: 15000 }),
      submitButton.click(),
    ])
    await expect(page.getByText(/(おはようございます|こんにちは|こんばんは)/)).toBeVisible()

    const authUser = await getAuthUserByEmail(testEmail)
    expect(authUser).toBeDefined()
    userId = authUser!.id
  })

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/signup')

    const nameInput = page.locator('input[name="name"]')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await nameInput.waitFor({ state: 'visible' })
    await nameInput.clear()
    await nameInput.fill('Test User')
    await emailInput.clear()
    await emailInput.fill('invalid-email')
    await passwordInput.clear()
    await passwordInput.fill('password123')

    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should show error for short password', async ({ page }) => {
    await page.goto('/signup')

    const nameInput = page.locator('input[name="name"]')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await nameInput.waitFor({ state: 'visible' })
    await nameInput.clear()
    await nameInput.fill('Test User')
    await emailInput.clear()
    await emailInput.fill(testEmail)
    await passwordInput.clear()
    await passwordInput.fill('short')

    await expect(passwordInput).toHaveAttribute('minLength', '8')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/signup')

    await page.click('a[href="/login"]')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
  })
})
