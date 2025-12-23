import { test, expect } from '@playwright/test'
import { runAxeTest, expectNoViolations } from './utils/a11y-helpers'

test.use({
  storageState: './e2e/.auth/user-chromium.json'
})

test.describe('Dashboard Accessibility', () => {
  test('dashboard page should have no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1').first()).toBeVisible()

    const results = await runAxeTest(page)
    expectNoViolations(results)
  })
})
