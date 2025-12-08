import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'
import { runAxeTest, expectNoViolations } from './utils/a11y-helpers'

test.describe('Dashboard Accessibility', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    const timestamp = new Date().getTime()
    testUser = await createTestUser({
      email: `dashboard-a11y-${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Dashboard A11y Test User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) {
      await cleanupTestData(testUser.id)
    }
  })

  test('dashboard page should have no accessibility violations', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText('Welcome')).toBeVisible()
    
    const results = await runAxeTest(page)
    expectNoViolations(results)
  })
})
