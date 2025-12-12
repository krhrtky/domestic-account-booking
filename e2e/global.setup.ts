import { chromium, firefox, webkit, FullConfig } from '@playwright/test'
import { createTestUser, cleanupTestData, getAuthUserByEmail } from './utils/test-helpers'
import path from 'path'
import fs from 'fs'

const STORAGE_STATE_DIR = path.join(__dirname, '.auth')

if (!fs.existsSync(STORAGE_STATE_DIR)) {
  fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true })
}

export const TEST_USER = {
  email: 'e2e-test-user@example.com',
  password: 'E2ETestPassword123!',
  name: 'E2E Test User',
}

const setupAuth = async (browserType: 'chromium' | 'firefox' | 'webkit', config: FullConfig) => {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
  const storageStatePath = path.join(STORAGE_STATE_DIR, `user-${browserType}.json`)

  let browser
  if (browserType === 'chromium') {
    browser = await chromium.launch()
  } else if (browserType === 'firefox') {
    browser = await firefox.launch()
  } else {
    browser = await webkit.launch()
  }

  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  try {
    await page.goto('/login', { waitUntil: 'networkidle' })

    await page.waitForSelector('input[name="email"]', { timeout: 10000 })
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/callback/credentials') ||
        response.url().includes('/api/auth/signin'),
      { timeout: 15000 }
    )

    await page.click('button[type="submit"]')

    try {
      const response = await responsePromise
      console.log(`  Auth response: ${response.status()} ${response.url()}`)
    } catch {
      console.log('  No auth callback response detected, continuing...')
    }

    await page.waitForURL('**/dashboard', { timeout: 20000 })

    await page.waitForLoadState('domcontentloaded')

    await context.storageState({ path: storageStatePath })

    console.log(`✓ Authentication state saved for ${browserType}: ${storageStatePath}`)
  } catch (error) {
    const errorText = await page.locator('[role="alert"], .error, .text-red-500').first().textContent().catch(() => null)
    if (errorText) {
      console.error(`  Page error message: ${errorText}`)
    }
    console.error(`  Current URL: ${page.url()}`)
    console.error(`✗ Failed to set up authentication for ${browserType}:`, error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

async function globalSetup(config: FullConfig) {
  console.log('Starting global E2E test setup...')

  let testUser

  try {
    const existingUser = await getAuthUserByEmail(TEST_USER.email)
    if (existingUser) {
      console.log(`ℹ Cleaning up existing test user: ${TEST_USER.email}`)
      await cleanupTestData(existingUser.id)
    }

    testUser = await createTestUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: TEST_USER.name,
    })

    console.log(`✓ Test user created: ${testUser.email} (ID: ${testUser.id})`)

    const browsers = (process.env.CI ? ['chromium'] : ['chromium', 'firefox', 'webkit']) as Array<'chromium' | 'firefox' | 'webkit'>
    for (const browser of browsers) {
      await setupAuth(browser, config)
    }

    console.log('✓ Global setup complete\n')
  } catch (error) {
    console.error('✗ Global setup failed:', error)

    if (testUser?.id) {
      try {
        await cleanupTestData(testUser.id)
        console.log('✓ Test user cleanup completed after failure')
      } catch (cleanupError) {
        console.error('✗ Failed to cleanup test user:', cleanupError)
      }
    }

    throw error
  }
}

export default globalSetup
