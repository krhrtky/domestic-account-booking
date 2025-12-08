import { test, expect } from '@playwright/test'

test.describe('Settlement Dashboard', () => {
  test('should display dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('should show settlement summary', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(/settlement/i)).toBeVisible()
  })

  test('should have navigation to transactions', async ({ page }) => {
    await page.goto('/dashboard')

    const transactionsLink = page.getByRole('link', { name: /transactions/i })
    await expect(transactionsLink).toBeVisible()
    await expect(transactionsLink).toHaveAttribute('href', '/dashboard/transactions')
  })

  test('should have navigation to group settings', async ({ page }) => {
    await page.goto('/dashboard')

    const settingsLink = page.getByRole('link', { name: /group settings/i })
    await expect(settingsLink).toBeVisible()
    await expect(settingsLink).toHaveAttribute('href', '/settings')
  })

  test('should redirect to login if not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })

    await context.close()
  })
})
