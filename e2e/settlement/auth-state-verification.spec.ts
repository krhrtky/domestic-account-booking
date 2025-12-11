import { test, expect } from '@playwright/test'
import { ensureAuthenticated, navigateToProtectedPage, verifyAuthentication } from '../utils/auth-helpers'
import { TEST_USER } from '../global.setup'

test.describe('Authentication State Verification', () => {
  test('should use persisted authentication state for chromium', async ({ page }) => {
    const isAuthenticated = await verifyAuthentication(page)
    expect(isAuthenticated).toBe(true)
  })

  test('should access protected pages without login', async ({ page }) => {
    await navigateToProtectedPage(page, '/dashboard')
    await expect(page.getByText('Welcome')).toBeVisible()
  })

  test('should navigate to settings without re-authentication', async ({ page }) => {
    await navigateToProtectedPage(page, '/settings')
    await expect(page.locator('input[name="groupName"]')).toBeVisible()
  })

  test('should maintain session across multiple page navigations', async ({ page }) => {
    await navigateToProtectedPage(page, '/dashboard')
    await expect(page.getByText('Welcome')).toBeVisible()

    await navigateToProtectedPage(page, '/settings')
    await expect(page.locator('input[name="groupName"]')).toBeVisible()

    await navigateToProtectedPage(page, '/dashboard')
    await expect(page.getByText('Welcome')).toBeVisible()
  })

  test('should verify auth state with ensureAuthenticated helper', async ({ page }) => {
    await ensureAuthenticated(page, TEST_USER)
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Welcome')).toBeVisible()
  })
})
