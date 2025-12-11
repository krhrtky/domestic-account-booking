# E2E Test Authentication Setup

## Overview

This project uses Playwright's `storageState` feature to persist authentication across E2E tests, eliminating the need to log in for every test. This significantly improves test execution speed and reliability.

## Architecture

### Global Setup (`e2e/global.setup.ts`)
- Runs once before all tests
- Creates a shared test user: `e2e-test-user@example.com`
- Logs in with each browser (Chromium, Firefox, WebKit)
- Saves authentication state to `e2e/.auth/user-{browser}.json`

### Storage State Files
- `e2e/.auth/user-chromium.json` - Chromium session cookies/localStorage
- `e2e/.auth/user-firefox.json` - Firefox session cookies/localStorage
- `e2e/.auth/user-webkit.json` - WebKit session cookies/localStorage

### Global Teardown (`e2e/global.teardown.ts`)
- Runs once after all tests complete
- Cleans up the shared test user and associated data

## Authentication Helpers

### `ensureAuthenticated(page, user)`
Verifies the page is authenticated. If not, performs login.

```typescript
await ensureAuthenticated(page, TEST_USER)
```

### `navigateToProtectedPage(page, path)`
Navigates to a protected page and throws an error if redirected to login.

```typescript
await navigateToProtectedPage(page, '/dashboard')
```

### `verifyAuthentication(page)`
Returns `true` if authenticated, `false` otherwise.

```typescript
const isAuth = await verifyAuthentication(page)
```

## Test Organization

### Directory Structure
- `e2e/auth/` - Tests requiring unauthenticated state (run with `chromium-unauth` project)
  - `login.spec.ts` - Login flow tests
  - `signup.spec.ts` - Signup flow tests
  - `onboarding-flow.spec.ts` - Full signup to group creation flow
  - `validation-errors.spec.ts` - Auth form validation tests
- `e2e/demo/` - Tests using authenticated state (run with `chromium` project)
- `e2e/settlement/` - Settlement calculation tests (authenticated)
- `e2e/accessibility/` - A11y tests (authenticated)
- `e2e/security/` - Security tests (authenticated)

### When to Use Each Directory
| Directory | Auth State | Use When |
|-----------|------------|----------|
| `e2e/auth/` | Unauthenticated | Testing login, signup, password reset, form validation |
| `e2e/demo/` | Authenticated | Testing app features that require logged-in user |
| `e2e/settlement/` | Authenticated | Testing settlement calculations |

## Usage in Tests

### For Tests Using Shared Test User
No login required - authentication state is automatically loaded:

```typescript
test('should access dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Welcome')).toBeVisible()
})
```

### For Tests Requiring Custom User
Create a new user and log in manually:

```typescript
test('should work with custom user', async ({ page }) => {
  const user = await createTestUser({
    email: 'custom@example.com',
    password: 'password',
    name: 'Custom User'
  })
  
  await loginUser(page, user)
  // Test logic here
  
  await cleanupTestData(user.id!)
})
```

## Benefits

1. **Speed**: Tests skip login flow (saves 2-5 seconds per test)
2. **Reliability**: Fewer network requests = fewer flaky tests
3. **Simplicity**: Most tests can focus on feature logic, not auth setup

## Limitations

- Tests cannot verify the login flow itself (use dedicated auth tests)
- Browser-specific storage states may differ slightly
- Expired sessions will cause tests to fail (re-run global setup)

## Troubleshooting

### Tests Redirect to Login
1. Verify `.env.local` has correct `DATABASE_URL` and `NEXTAUTH_SECRET`
2. Delete `e2e/.auth/` directory and re-run tests to regenerate state
3. Check if test user still exists in database

### Global Setup Fails
1. Ensure Next.js dev server is running (`npm run dev`)
2. Verify database connection and migrations are up to date
3. Check that no other test user with the same email exists

## Configuration

See `playwright.config.ts` for:
- `globalSetup` - Points to setup script
- `globalTeardown` - Points to teardown script
- `storageState` - Per-project storage state paths
- `dependencies` - Ensures setup runs before tests
