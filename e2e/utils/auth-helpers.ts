import { Page, expect } from '@playwright/test'

export interface AuthUser {
  email: string
  password: string
  name: string
}

export const ensureAuthenticated = async (page: Page, user: AuthUser) => {
  await page.goto('/dashboard')
  
  const currentUrl = page.url()
  
  if (currentUrl.includes('/login')) {
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10000 })
  }
  
  await expect(page.getByText('Welcome')).toBeVisible({ timeout: 5000 })
}

export const navigateToProtectedPage = async (page: Page, path: string) => {
  await page.goto(path)
  
  const currentUrl = page.url()
  
  if (currentUrl.includes('/login')) {
    throw new Error(
      `Navigation to ${path} failed: redirected to login. Ensure authentication state is set up correctly.`
    )
  }
  
  await page.waitForLoadState('networkidle', { timeout: 10000 })
}

export const verifyAuthentication = async (page: Page): Promise<boolean> => {
  await page.goto('/dashboard')
  
  await page.waitForLoadState('networkidle', { timeout: 5000 })
  
  const currentUrl = page.url()
  return !currentUrl.includes('/login')
}
