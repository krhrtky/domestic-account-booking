# Multi-browser E2E Testing & Auth Rate Limiting - Implementation Summary

## Overview
Implemented multi-browser E2E testing support and authentication rate limiting as specified in the SDA requirements.

## Files Modified

### 1. `/Users/takuya.kurihara/workspace/domestic-account-booking/playwright.config.ts`
**Changes:**
- Added Firefox browser project configuration
- Added WebKit (Safari) browser project configuration

**Key Code:**
```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
]
```

### 2. `/Users/takuya.kurihara/workspace/domestic-account-booking/app/actions/auth.ts`
**Changes:**
- Added imports for rate limiting and IP extraction utilities
- Added rate limit checks to `signUp()` function (3 attempts per 15 min per IP)
- Added rate limit checks to `logIn()` function (5 attempts per 15 min per email)
- Rate limit errors include retry-after time in seconds

**Key Code:**
```typescript
import { checkRateLimit } from '@/lib/rate-limiter'
import { getClientIP } from '@/lib/get-client-ip'
import { headers } from 'next/headers'

// In signUp():
const headersList = await headers()
const clientIP = getClientIP(headersList)
const rateLimitResult = checkRateLimit(clientIP, {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000
}, 'signup')

if (!rateLimitResult.allowed) {
  return {
    error: `Too many signup attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`
  }
}

// In logIn():
const rateLimitResult = checkRateLimit(email, {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000
}, 'login')

if (!rateLimitResult.allowed) {
  return {
    error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`
  }
}
```

## Files Created

### 3. `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/rate-limiter.ts`
**Purpose:** Token bucket rate limiting implementation using native Map and setTimeout

**Features:**
- Sliding window algorithm
- Configurable max attempts and window duration
- Separate stores for different rate limit types (login/signup)
- Automatic cleanup of expired entries
- Returns retry-after time in seconds when blocked

**API:**
```typescript
checkRateLimit(identifier: string, config: RateLimitConfig, storeName?: string)
  -> { allowed: true } | { allowed: false; retryAfter: number }

resetRateLimit(identifier: string, storeName?: string): void
clearAllRateLimits(): void
```

### 4. `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/get-client-ip.ts`
**Purpose:** Extract client IP from request headers

**Features:**
- Checks `x-forwarded-for` header first (handles proxy chains)
- Falls back to `x-real-ip` header
- Returns 'unknown' if no IP headers present
- Trims whitespace from extracted IPs

**API:**
```typescript
getClientIP(headers: Headers): string
```

### 5. `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/rate-limiter.test.ts`
**Purpose:** Comprehensive unit tests for rate limiter (10 tests)

**Coverage:**
- First request always allowed
- Requests under limit allowed
- Requests over limit blocked
- Correct retry-after calculation
- Window expiration and reset
- Separate stores for different rate limit types
- Different identifiers tracked separately
- Manual reset functionality

### 6. `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/get-client-ip.test.ts`
**Purpose:** Unit tests for IP extraction (6 tests)

**Coverage:**
- x-forwarded-for extraction (single and multiple IPs)
- x-real-ip extraction
- Header preference (x-forwarded-for over x-real-ip)
- Fallback to 'unknown'
- Whitespace trimming

### 7. `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/rate-limiter-auth.test.ts`
**Purpose:** Integration tests for auth rate limiting (9 tests)

**Coverage:**
- Login rate limit (5 attempts per 15 min)
- Signup rate limit (3 attempts per 15 min)
- Email/IP isolation
- Login/signup store separation
- Error message format

## Test Results

### Unit Tests
```bash
npm test -- --run
```
**Result:** All 98 tests passed
- 10 tests for rate-limiter.ts
- 6 tests for get-client-ip.ts
- 9 tests for rate-limiter-auth.ts
- All existing tests still passing

### Type Checking
```bash
npm run type-check
```
**Result:** No TypeScript errors

## Commands to Run

### Development
```bash
npm run dev
```

### Run All Unit Tests
```bash
npm test
```

### Run Specific Tests
```bash
npm test -- src/lib/rate-limiter.test.ts
npm test -- src/lib/get-client-ip.test.ts
npm test -- src/lib/rate-limiter-auth.test.ts
```

### Run E2E Tests (Multi-browser)
```bash
npm run test:e2e
```
This will now run tests across:
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)

### Run E2E with UI
```bash
npm run test:e2e:ui
```

### Type Check
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

## Deployment Notes

### No Breaking Changes
- All existing functionality preserved
- Rate limiting is additive
- Multi-browser testing is configuration-only

### Environment Considerations
1. **Rate Limiting Storage:**
   - In-memory Map-based storage (server-side only)
   - Resets on server restart
   - For production with multiple server instances, consider Redis or similar distributed cache

2. **IP Extraction:**
   - Relies on reverse proxy headers (x-forwarded-for, x-real-ip)
   - Verify proxy configuration passes client IP correctly
   - Test with actual proxy setup (nginx, Cloudflare, etc.)

3. **E2E Browser Installation:**
   - First run of multi-browser tests requires browser installation:
     ```bash
     npx playwright install firefox webkit
     ```
   - Chromium should already be installed

### Testing Recommendations
1. Test rate limiting with actual proxy headers in staging
2. Verify retry-after messages display correctly in UI
3. Run E2E tests on all browsers before production deploy
4. Monitor rate limit effectiveness (may need adjustment)

## Acceptance Criteria Status

- [x] playwright.config.ts includes Firefox and WebKit projects
- [x] /src/lib/rate-limiter.ts created with checkRateLimit function
- [x] /src/lib/get-client-ip.ts created
- [x] logIn action checks rate limit before processing
- [x] signUp action checks rate limit before processing
- [x] Rate limit error message includes retry-after time
- [x] Unit tests for rate limiter (25 total tests across 3 files)
- [x] No new npm dependencies (uses native Map + setTimeout)
- [x] Follows existing code patterns and conventions

## Blocking Issues
None identified. Implementation is complete and tested.

## Future Enhancements
1. Consider distributed rate limiting for multi-server deployments
2. Add rate limit metrics/logging
3. Make rate limit thresholds configurable via environment variables
4. Add E2E tests specifically for rate limiting behavior

---

# Session 2025-12-07: Local Supabase & E2E Test Fixes

## Overview
Fixed local Supabase startup issues with Colima and E2E test infrastructure.

## Problems Resolved

### 1. Local Supabase Startup with Colima ✅
**Issue:** Supabase CLI failed with "mkdir /Users/.../docker.sock: operation not supported"

**Root Cause:** Colima's virtiofs mount type cannot handle Docker socket mounting required by Supabase's vector container.

**Solution:**
1. Deleted existing Colima instance: `colima delete --force`
2. Recreated with sshfs mount: `colima start --mount-type sshfs`
3. Disabled analytics in `supabase/config.toml` to avoid vector container entirely

**Commit:** `a7843cb` - feat: add Supabase local development config

### 2. Middleware Location ✅
**Issue:** Middleware was in `src/middleware.ts` but Next.js App Router requires it at project root.

**Solution:** Moved to `middleware.ts` at project root.

**Commit:** `1c2778e` - fix: move middleware to project root for Next.js App Router

### 3. Form Input Name Attributes ✅
**Issue:** E2E tests used selectors like `input[name="groupName"]` but forms lacked name attributes.

**Solution:** Added name attributes to:
- CreateGroupForm: `name="groupName"`, `name="ratioA"`
- GroupSettings: `name="ratioA"`
- InvitePartner: `name="partnerEmail"`
- Converted CreateGroupForm to use `<form>` with `onSubmit` and `type="submit"` button

**Commit:** `90be520` - fix: add name attributes to form inputs for E2E testing

### 4. Database Circular Dependency ✅
**Issue:** users and groups tables had circular foreign key references during creation.

**Solution:** Changed inline FK constraints to ALTER TABLE statements after both tables exist.

**Commit:** `8bb0ea9` - fix: resolve circular dependency in users/groups tables

### 5. Playwright WebServer Environment Variables ✅
**Issue:** Supabase credentials weren't passed to Next.js dev server during E2E tests.

**Solution:** Added `env` block to Playwright's webServer config.

**Commit:** `595b3fa` - fix: pass environment variables to Playwright webServer

## Remaining Issues

### E2E Test Failures (22/25 failing)
**Symptoms:**
- `Cannot read properties of null (reading 'group_id')` - users.group_id is null after signup
- Various UI element selectors not matching

**Root Causes (likely):**
1. Group creation may not be updating the user's group_id in the database
2. Some UI components missing expected elements (select[name="payerType"], etc.)
3. Test helpers expecting data that isn't being persisted correctly

**Required Investigation:**
1. Check `createGroup` action - does it update users.group_id?
2. Verify transaction upload page has expected form elements
3. Review test helper functions in `e2e/utils/demo-helpers.ts`

## Commits Made This Session

| Commit | Description |
|--------|-------------|
| 1c2778e | fix: move middleware to project root for Next.js App Router |
| a7843cb | feat: add Supabase local development config |
| 90be520 | fix: add name attributes to form inputs for E2E testing |
| 595b3fa | fix: pass environment variables to Playwright webServer |
| eb823b4 | chore: add supabase .gitignore for temp files |
| 8bb0ea9 | fix: resolve circular dependency in users/groups tables |
| 7468ad1 | chore: update project config for E2E testing |

## Next Steps

1. **Fix `createGroup` action** - Ensure it updates `users.group_id` after creating group
2. **Add missing UI elements** - Review failing tests and add required form elements
3. **Update E2E test selectors** - Align test expectations with actual UI
4. **Run full E2E suite** - Verify all 25 demo tests pass

## Commands to Run

### Start Local Supabase
```bash
npx supabase start
```

### Run E2E Demo Tests (Chromium only)
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key> \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
NEXT_PUBLIC_APP_URL=http://localhost:3000 \
npx playwright test e2e/demo --project=chromium
```

### Get Supabase Keys
```bash
npx supabase status -o json
```

## Session 2 Continuation: Fixed Test User Creation

### Additional Fix Applied

**Problem:** `createTestUser` in `e2e/utils/test-helpers.ts` only created auth users, not entries in the `users` table. This caused FK constraint violations when creating groups.

**Solution:** Updated `createTestUser` to also insert into the `users` table after auth user creation.

**Commit:** `2f836db` - fix: insert users table entry when creating test users

### Current Test Status
- E2E demo tests now pass the user/group creation phase
- Some tests still fail due to selector mismatches (e.g., `getByText('Household')` resolving to multiple elements)
- These are test expectation issues, not application bugs

### Additional Commits
| Commit | Description |
|--------|-------------|
| 2f836db | fix: insert users table entry when creating test users |
| 1ea298e | fix: improve group creation error handling and debugging |

### Remaining Test Selector Issues
1. `getByText('Household')` matches both option and button - need more specific selector
2. `getByText('UserA')` may match multiple elements
3. Other similar strict mode violations

### Next Steps
1. ~~Update E2E test selectors to be more specific (use `data-testid` or role-based selectors)~~ ✅
2. ~~Add `data-testid` attributes to UI components where needed~~ ✅
3. Run full E2E suite and fix remaining failures

---

## Session 3: E2E Test Selector Fixes

### Overview
Fixed strict mode violations in E2E tests by adding `data-testid` attributes to UI components and updating test selectors to use more specific patterns.

### Files Modified

#### UI Components (data-testid additions)
1. **src/components/transactions/TransactionRow.tsx**
   - Added `data-testid="transaction-row-{id}"` to row
   - Added `data-testid` to all table cells (date, description, amount, payer, expense-type)
   - Added `data-testid="transaction-delete-btn"` to delete button

2. **src/components/transactions/ExpenseTypeToggle.tsx**
   - Added `data-testid="expense-type-toggle"` to toggle button

3. **src/components/transactions/TransactionFilters.tsx**
   - Added `name="expenseType"` to expense type select
   - Added `name="payerType"` to payer type select

4. **src/components/transactions/CSVUploadForm.tsx**
   - Added `name="payerType"` to payer type select

#### E2E Tests (selector updates)
1. **e2e/demo/03-manual-transactions.spec.ts**
   - Changed `getByText('Household')` to `locator('[data-testid="expense-type-toggle"]').toContainText('Household')`
   - Used row-scoped selectors with `page.locator('tr', { hasText: ... })`

2. **e2e/demo/05-transaction-classification.spec.ts**
   - Updated toggle button selector to use data-testid
   - Removed duplicate element issues

3. **e2e/demo/06-filtering.spec.ts**
   - Changed `select[name="month"]` to `input[type="month"]` (month filter is input, not select)
   - Updated selectors to use row-scoped patterns

4. **e2e/demo/07-pagination.spec.ts**
   - Changed `data-testid="transaction-row"` to `data-testid^="transaction-row-"` (starts-with selector)

5. **e2e/demo/08-deletion.spec.ts**
   - Changed `button[data-testid="delete-transaction"]` to `[data-testid="transaction-delete-btn"]`

6. **e2e/demo/09-settlement-equal.spec.ts**
   - Changed `select[name="month"]` to `select[name="settlement-month"]`
   - Updated currency format to include ¥ symbol
   - Updated settlement message pattern to use regex

7. **e2e/demo/10-settlement-unequal.spec.ts**
   - Same fixes as 09

8. **e2e/demo/11-settlement-common-account.spec.ts**
   - Same fixes as 09
   - Added data-testid based selectors for payer column

9. **e2e/demo/12-ratio-update.spec.ts**
   - Changed month selector name
   - Removed data-testid="settlement-summary" dependency (not present in component)

10. **e2e/demo/15-edge-cases.spec.ts**
    - Fixed month selector references
    - Updated currency format expectations

### Commits Made
| Commit | Description |
|--------|-------------|
| 6a16e1a | feat: add data-testid attributes to transaction components for E2E testing |
| 74ef047 | test: add E2E demo tests with improved selectors |

### Key Patterns Used
1. **Row-scoped selectors:** `page.locator('tr', { hasText: 'description' })`
2. **Starts-with attribute:** `[data-testid^="transaction-row-"]`
3. **Data-testid for unique elements:** `[data-testid="expense-type-toggle"]`
4. **Regex patterns for flexible matching:** `/User B pays.*Settlement User/`

### Remaining Work
- Run full E2E suite with local Supabase to verify all fixes
