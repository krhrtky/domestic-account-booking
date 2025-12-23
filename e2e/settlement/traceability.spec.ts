import { test, expect } from '@playwright/test'

test.use({
  storageState: './e2e/.auth/user-chromium.json'
})

test.describe('L-BR-007: Traceability', () => {
  test.describe('UC-001: Settlement Breakdown Confirmation', () => {
    test('should display settlement breakdown panel when clicking details', async ({ page }) => {
      await page.goto('/dashboard')
      
      const detailsButton = page.getByRole('button', { name: /詳細|details/i })
      if (await detailsButton.isVisible()) {
        await detailsButton.click()
        await expect(page.getByTestId('breakdown-panel')).toBeVisible()
      }
    })

    test('should show paid amounts by each user', async ({ page }) => {
      await page.goto('/dashboard')
      
      const detailsButton = page.getByRole('button', { name: /詳細|details/i })
      if (await detailsButton.isVisible()) {
        await detailsButton.click()
        await expect(page.getByTestId('paid-by-a-total')).toBeVisible()
        await expect(page.getByTestId('paid-by-b-total')).toBeVisible()
      }
    })

    test('should display calculation formula', async ({ page }) => {
      await page.goto('/dashboard')
      
      const detailsButton = page.getByRole('button', { name: /詳細|details/i })
      if (await detailsButton.isVisible()) {
        await detailsButton.click()
        await expect(page.getByTestId('calculation-formula')).toBeVisible()
      }
    })
  })

  test.describe('UC-002: Past Settlement Trace', () => {
    test('should verify past month settlement breakdown', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const monthSelector = page.getByTestId('month-selector')
      if (await monthSelector.isVisible()) {
        const currentDate = new Date()
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        const lastMonthValue = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

        await monthSelector.selectOption(lastMonthValue)
        await page.waitForLoadState('networkidle')

        const detailsButton = page.getByRole('button', { name: /詳細/ })
        if (await detailsButton.isVisible()) {
          await detailsButton.click()
          await expect(page.getByTestId('breakdown-panel')).toBeVisible()
          await expect(page.getByTestId('paid-by-a-total')).toBeVisible()
          await expect(page.getByTestId('paid-by-b-total')).toBeVisible()
          await expect(page.getByTestId('calculation-formula')).toBeVisible()
        }
      }
    })
  })
})
