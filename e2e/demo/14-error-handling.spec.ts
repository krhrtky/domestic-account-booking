import { test, expect } from '@playwright/test'
import { generateTestEmail, createTestUser, cleanupTestData, TestUser } from '../utils/test-helpers'
import { loginUser } from '../utils/demo-helpers'
import path from 'path'

test.describe('Scenario 14: Error Handling - Validation Errors', () => {
  let testEmail: string

  test.beforeEach(() => {
    testEmail = generateTestEmail()
  })

  test('should show error for duplicate email signup', async ({ page }) => {
    const timestamp = Date.now()
    const existingUser = await createTestUser({
      email: `existing-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Existing User',
    })

    await page.goto('/signup')

    await page.fill('input[name="name"]', 'New User')
    await page.fill('input[name="email"]', existingUser.email)
    await page.fill('input[name="password"]', 'TestPassword123!')

    const dialogPromise = page.waitForEvent('dialog')
    await page.click('button[type="submit"]')

    const dialog = await dialogPromise
    expect(dialog.message()).toContain('already')
    await dialog.accept()

    if (existingUser.id) await cleanupTestData(existingUser.id)
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'notanemail')
    await page.fill('input[name="password"]', 'TestPassword123!')

    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should validate password minimum length', async ({ page }) => {
    await page.goto('/signup')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'short')

    const passwordInput = page.locator('input[name="password"]')
    await expect(passwordInput).toHaveAttribute('minLength', '8')
  })

  test('should show error for wrong password', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = await createTestUser({
      email: `wrong-pwd-${timestamp}@example.com`,
      password: 'CorrectPassword123!',
      name: 'Wrong Password User',
    })

    await page.goto('/login')

    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', 'WrongPassword123!')

    const dialogPromise = page.waitForEvent('dialog')
    await page.click('button[type="submit"]')

    const dialog = await dialogPromise
    expect(dialog.message()).toContain('Invalid')
    await dialog.accept()

    if (testUser.id) await cleanupTestData(testUser.id)
  })

  test('should show error for invalid CSV format', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = await createTestUser({
      email: `csv-error-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'CSV Error User',
    })

    await loginUser(page, testUser)
    await page.goto('/settings')
    
    await page.fill('input[name="groupName"]', 'CSV Error Group')
    await page.fill('input[name="ratioA"]', '50')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    await page.goto('/dashboard/transactions/upload')

    const csvFilePath = path.join(
      __dirname,
      '../../tests/fixtures/demo-csvs/invalid-missing-columns.csv'
    )

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(csvFilePath)

    const payerSelect = page.locator('select[name="payerType"]')
    await payerSelect.selectOption('UserA')

    const uploadButton = page.locator('button:has-text("Upload")')
    await uploadButton.click()
    await page.waitForTimeout(1000)

    await expect(page.getByText(/missing|required|column/i)).toBeVisible()

    if (testUser.id) await cleanupTestData(testUser.id)
  })
})
