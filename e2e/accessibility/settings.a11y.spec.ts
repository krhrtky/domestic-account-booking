import { test, expect } from '@playwright/test'
import { createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'
import { runAxeTest, expectNoViolations } from './utils/a11y-helpers'

test.describe('Settings Page Accessibility', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    const timestamp = new Date().getTime()
    testUser = await createTestUser({
      email: `settings-a11y-${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Settings A11y Test User',
    })
  })

  test.afterAll(async () => {
    if (testUser.id) {
      await cleanupTestData(testUser.id)
    }
  })

  test('settings page should have no accessibility violations', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    
    await page.goto('/settings')
    await expect(page).toHaveURL('/settings')
    
    await page.waitForLoadState('networkidle')
    
    const results = await runAxeTest(page)
    expectNoViolations(results)
  })
})
