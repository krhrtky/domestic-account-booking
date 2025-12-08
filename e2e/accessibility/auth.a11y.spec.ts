import { test, expect } from '@playwright/test'
import { runAxeTest, expectNoViolations } from './utils/a11y-helpers'

test.describe('Auth Pages Accessibility', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('login page should have no accessibility violations', async ({ page }) => {
    await page.goto('/login')

    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible()

    const results = await runAxeTest(page)
    expectNoViolations(results)
  })

  test('signup page should have no accessibility violations', async ({ page }) => {
    await page.goto('/signup')

    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 10000 })

    const results = await runAxeTest(page)
    expectNoViolations(results)
  })
})
