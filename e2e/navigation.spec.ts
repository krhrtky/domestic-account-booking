import { test, expect } from '@playwright/test'

test.describe('Navigation Component', () => {
  test.use({
    storageState: './e2e/.auth/user-chromium.json'
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test.describe('AC-NAV-007: Navigation items', () => {
    test('displays all navigation items', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 })
      await page.goto('/dashboard')
      await expect(page.locator('nav').getByRole('link', { name: 'ダッシュボード' })).toBeVisible()
      await expect(page.locator('nav').getByRole('link', { name: '取引一覧' })).toBeVisible()
      await expect(page.locator('nav').getByRole('link', { name: 'グループ設定' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible()
    })

    test('navigates to correct routes', async ({ page }) => {
      await page.click('text=取引一覧')
      await page.waitForURL('/dashboard/transactions')

      await page.click('text=グループ設定')
      await page.waitForURL('/settings')

      await page.click('text=ダッシュボード')
      await page.waitForURL('/dashboard')
    })
  })

  test.describe('AC-NAV-008: Active state highlighting', () => {
    test('highlights active navigation item on dashboard', async ({ page }) => {
      await page.goto('/dashboard')

      const dashboardLink = page.getByRole('link', { name: 'ダッシュボード' })
      await expect(dashboardLink).toHaveAttribute('data-active', 'true')
    })

    test('highlights active navigation item on transactions page', async ({ page }) => {
      await page.goto('/dashboard/transactions')

      const transactionsLink = page.getByRole('link', { name: '取引一覧' })
      await expect(transactionsLink).toHaveAttribute('data-active', 'true')
    })

    test('highlights active navigation item on settings page', async ({ page }) => {
      await page.goto('/settings')

      const settingsLink = page.getByRole('link', { name: 'グループ設定' })
      await expect(settingsLink).toHaveAttribute('data-active', 'true')
    })
  })

  test.describe('AC-NAV-013: Logout functionality', () => {
    test('logs out user and redirects to home', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 })
      await page.goto('/dashboard')
      await page.click('text=ログアウト')

      await page.waitForURL('/')

      await page.goto('/dashboard')
      await page.waitForURL(/\/login/)
    })
  })

  test.describe('Mobile Navigation', () => {
    test('shows mobile menu toggle on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const menuButton = page.getByRole('button', { name: /メニュー/i })
      await expect(menuButton).toBeVisible()
    })

    test('opens mobile menu and shows navigation items', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const menuButton = page.getByRole('button', { name: /メニュー/i })
      await menuButton.click()

      await expect(page.getByRole('link', { name: 'ダッシュボード' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: '取引一覧' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'グループ設定' }).first()).toBeVisible()
    })

    test('navigates from mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const menuButton = page.getByRole('button', { name: /メニュー/i })
      await menuButton.click()

      await page.getByRole('link', { name: '取引一覧' }).first().click()
      await page.waitForURL('/dashboard/transactions')
    })
  })

  test.describe('AC-NAV-014: Unauthenticated redirect', () => {
    test('redirects to login when accessing protected pages', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 })
      await page.goto('/dashboard')
      await page.click('text=ログアウト')
      await page.waitForURL('/')

      await page.goto('/dashboard')
      await page.waitForURL(/\/login/)

      await page.goto('/dashboard/transactions')
      await page.waitForURL(/\/login/)

      await page.goto('/settings')
      await page.waitForURL(/\/login/)
    })
  })
})
