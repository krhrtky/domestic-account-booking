import { test, expect } from '@playwright/test'
import { runAxeTest, expectNoViolations } from './utils/a11y-helpers'

test.describe('Transactions Page Accessibility', () => {
  test('transaction list should have no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard/transactions')
    await expect(page).toHaveURL('/dashboard/transactions')

    await page.waitForLoadState('networkidle')

    const results = await runAxeTest(page)
    expectNoViolations(results)
  })
})
