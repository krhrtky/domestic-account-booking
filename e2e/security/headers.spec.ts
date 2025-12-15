import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'
import { verifySecurityHeaders, SECURITY_HEADERS } from './utils/headers-helpers'

test.describe('Security Headers - Public Pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('login page should have security headers', async ({ page }) => {
    const response = await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible()
    
    verifySecurityHeaders(response)
  })

  test('signup page should have security headers', async ({ page }) => {
    const response = await page.goto('/signup')
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()

    verifySecurityHeaders(response)
  })

  test('all required headers are present and correct', async ({ page }) => {
    const response = await page.goto('/login')
    
    if (!response) {
      throw new Error('No response received')
    }

    const headers = response.headers()
    
    SECURITY_HEADERS.forEach(({ name, expectedValue }) => {
      expect(headers[name], `Header ${name} should be present`).toBeDefined()
      expect(headers[name], `Header ${name} should have correct value`).toBe(expectedValue)
    })
  })
})

test.describe('Security Headers - Protected Pages', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    const timestamp = new Date().getTime()
    testUser = await createTestUser({
      email: `security-headers-${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Security Headers Test User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) {
      await cleanupTestData(testUser.id)
    }
  })

  test('dashboard should have security headers', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill(testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    const response = await page.goto('/dashboard')

    verifySecurityHeaders(response)
  })

  test('transactions page should have security headers', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill(testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    const response = await page.goto('/transactions')

    verifySecurityHeaders(response)
  })

  test('settings page should have security headers', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill(testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    const response = await page.goto('/settings')

    verifySecurityHeaders(response)
  })

  test('all protected pages have consistent headers', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    await emailInput.waitFor({ state: 'visible' })
    await emailInput.clear()
    await emailInput.fill(testUser.email)
    await passwordInput.clear()
    await passwordInput.fill(testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    
    const pages = ['/dashboard', '/transactions', '/settings']
    
    for (const pagePath of pages) {
      const response = await page.goto(pagePath)
      
      if (!response) {
        throw new Error(`No response received for ${pagePath}`)
      }

      const headers = response.headers()
      
      SECURITY_HEADERS.forEach(({ name, expectedValue }) => {
        expect(headers[name], `${pagePath}: Header ${name} should be present`).toBeDefined()
        expect(headers[name], `${pagePath}: Header ${name} should have correct value`).toBe(expectedValue)
      })
    }
  })
})
