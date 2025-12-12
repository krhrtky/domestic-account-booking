# E2E Test Authentication Migration Guide

## What Changed

Phase 17 introduces persistent authentication via Playwright `storageState`, eliminating repetitive login flows in E2E tests.

## For Existing Tests

### Before (Manual Login Each Test)
```typescript
test('my test', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
  
  // Actual test logic
})
```

### After (Auto-Authenticated)
```typescript
test('my test', async ({ page }) => {
  await page.goto('/dashboard')
  // Already authenticated - no login needed!
  
  // Actual test logic
})
```

## Test Categories

### 1. Tests That Can Use Shared Auth (Most Tests)
**Before:** Created unique users per test  
**After:** Use shared `e2e-test-user@example.com` via storageState

Simply remove login code - authentication is automatic.

### 2. Tests That Need Custom Users
**Before:** Created and logged in custom users  
**After:** Keep creating custom users, but can skip login if using `loginUser` helper

```typescript
const user = await createTestUser({...})
await loginUser(page, user, true) // skipIfAuthenticated=true
```

### 3. Auth-Specific Tests
**Before:** Tested login/logout flows  
**After:** No change needed - these tests should NOT use storageState

For auth tests, explicitly avoid using the shared state by creating fresh users.

## Breaking Changes

### None Expected
The implementation is backward compatible. Tests that manually log in will continue to work.

## Performance Impact

- **Setup time:** +5-10 seconds (one-time global setup)
- **Per-test time:** -2-5 seconds (no login per test)
- **Net benefit:** Significant for test suites with 10+ tests

## Rollback

If issues arise, temporarily disable by:
1. Remove `storageState` from `playwright.config.ts` projects
2. Comment out `globalSetup` and `globalTeardown`
3. Restore manual login in affected tests

## Questions?

See `e2e/AUTH-SETUP.md` for detailed documentation.
