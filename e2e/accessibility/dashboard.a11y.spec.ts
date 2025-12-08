import { test, expect } from '@playwright/test'
import { runAxeTest, expectNoViolations } from './utils/a11y-helpers'

test.describe('Dashboard Accessibility', () => {
  test('dashboard page should have no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Welcome')).toBeVisible()

    const results = await runAxeTest(page)
    expectNoViolations(results)
  })
})
