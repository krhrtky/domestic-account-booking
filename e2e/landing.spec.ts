import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Landing Page', () => {
  test.describe('AC-NAV-001: App name and tagline', () => {
    test('displays app name and tagline', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByRole('heading', { name: '家計精算アプリ', level: 1 })).toBeVisible()
      await expect(page.getByText(/二人暮らしの家計管理を、もっとシンプルに/).first()).toBeVisible()
    })
  })

  test.describe('AC-NAV-004: No development status', () => {
    test('does not display project status section', async ({ page }) => {
      await page.goto('/')
      
      await expect(page.getByText('プロジェクトステータス')).not.toBeVisible()
      await expect(page.getByText('Next.js 15 + TypeScript')).not.toBeVisible()
    })
  })

  test.describe('AC-NAV-006: No prohibited expressions (L-LC-004)', () => {
    test('does not contain prohibited expressions', async ({ page }) => {
      await page.goto('/')

      const bodyText = await page.locator('body').textContent()

      const prohibited = [
        '完璧', '絶対', '必ず', '確実',
        '業界No.1', '最高', '最強', '究極', '唯一',
        '節税', '確定申告', '税金が減る',
        '投資判断', '資産運用', '利益が出る',
        '主婦向け', '男性の稼ぎ', '女性の家事',
        '損する', '危険', '今すぐ', '今だけ', '期間限定',
        '後悔', 'もったいない'
      ]

      for (const phrase of prohibited) {
        expect(bodyText).not.toContain(phrase)
      }
    })

    test('uses allowed expressions only', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByText(/参考値としてご利用ください/).first()).toBeVisible()
      await expect(page.getByText(/税務や法務については専門家にご相談/).first()).toBeVisible()
    })
  })

  test.describe('AC-NAV-011: CTA buttons', () => {
    test('displays signup and login CTAs', async ({ page }) => {
      await page.goto('/')
      
      const signupButton = page.getByRole('link', { name: '無料で始める' })
      const loginButton = page.getByRole('link', { name: 'ログイン' })
      
      await expect(signupButton).toBeVisible()
      await expect(loginButton).toBeVisible()
      
      await expect(signupButton).toHaveAttribute('href', '/signup')
      await expect(loginButton).toHaveAttribute('href', '/login')
    })
  })

  test.describe('AC-NAV-012: Authenticated user redirect', () => {
    test.skip('redirects authenticated user to dashboard', async ({ page }) => {
      await page.goto('/login')
      await page.fill('[name="email"]', 'alice@example.com')
      await page.fill('[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      await page.waitForURL('/dashboard')

      await page.goto('/')
      await page.waitForURL('/dashboard')
    })
  })

  test.describe('Features Section', () => {
    test('displays three key features', async ({ page }) => {
      await page.goto('/')
      
      await expect(page.getByText(/公平な精算計算/)).toBeVisible()
      await expect(page.getByText(/CSV取り込み/)).toBeVisible()
      await expect(page.getByText(/明細の透明性/)).toBeVisible()
    })
  })

  test.describe('How It Works Section', () => {
    test('displays step-by-step guide', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByRole('heading', { name: '使い方' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'アカウント登録' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '支出を記録' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '精算結果を確認' })).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('is mobile-friendly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      await expect(page.getByRole('heading', { name: '家計精算アプリ', level: 1 })).toBeVisible()
      await expect(page.getByRole('link', { name: '無料で始める' })).toBeVisible()
    })
  })
})
