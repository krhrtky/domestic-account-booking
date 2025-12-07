import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'

test.describe('Settlement Dashboard', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    const timestamp = new Date().getTime()
    testUser = await createTestUser({
      email: `dashboard-test-${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Dashboard Test User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) {
      await cleanupTestData(testUser.id)
    }
  })

  test('should display dashboard after login', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('should show settlement summary', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    await expect(page.getByText(/settlement/i)).toBeVisible()
  })

  test('should have navigation to transactions', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    const transactionsLink = page.getByRole('link', { name: /transactions/i })
    await expect(transactionsLink).toBeVisible()
    await expect(transactionsLink).toHaveAttribute('href', '/dashboard/transactions')
  })

  test('should have navigation to group settings', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    const settingsLink = page.getByRole('link', { name: /group settings/i })
    await expect(settingsLink).toBeVisible()
    await expect(settingsLink).toHaveAttribute('href', '/settings')
  })

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })
})
