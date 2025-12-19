import { test, expect } from '@playwright/test'

test.describe('L-CX-002: Visual Regression Tests', () => {
  test('login page visual appearance', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    })
  })

  test('login form elements', async ({ page }) => {
    await page.goto('/login')
    const form = page.locator('form')
    await expect(form).toHaveScreenshot('login-form.png')
  })

  test('signup page visual appearance', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveScreenshot('signup-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    })
  })

  test('error message styling', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'invalid')
    await page.fill('input[name="password"]', 'x')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    await expect(page.locator('form')).toHaveScreenshot('login-form-error.png')
  })
})
