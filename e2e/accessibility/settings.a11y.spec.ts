import { test, expect } from '@playwright/test'
import { runAxeTest, expectNoViolations } from './utils/a11y-helpers'

test.use({
  storageState: './e2e/.auth/user-chromium.json'
})

test.describe('Settings Page Accessibility', () => {
  test('settings page should have no accessibility violations', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL('/settings')

    await page.waitForLoadState('networkidle')

    const results = await runAxeTest(page)
    expectNoViolations(results)
  })
})
