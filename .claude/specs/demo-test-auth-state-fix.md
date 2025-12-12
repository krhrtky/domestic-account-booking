# Specification: Demo Test Authentication State Fix

## Document Metadata
- **Created**: 2025-12-11
- **Status**: Draft
- **Priority**: High
- **Related Branch**: `claude/fix-ci-e2e-lighthouse-01AFGUmzSjYfUeRyC49wSoGj`
- **Related Commits**: `ae623e4`, `95879b3`, `470b44f`

---

## 1. Problem Analysis

### 1.1 Root Cause
The CI pipeline splits E2E tests by authentication state:
- **chromium-unauth**: Tests requiring unauthenticated state (`e2e/auth`)
- **chromium**: Tests requiring authenticated state (`e2e/demo`, `e2e/settlement`, `e2e/accessibility`)

However, some tests in `e2e/demo/` expect unauthenticated state but are executed in the authenticated `chromium` project, causing failures.

### 1.2 Affected Test Files

#### Critical (Require Full Unauthenticated State)

**1. `e2e/demo/01-onboarding.spec.ts`**
- **Issue**: Line 25-26 expect redirect to `/login` when visiting `/`
- **Current Behavior**: Authenticated users redirect to `/dashboard`
- **Impact**: Test fails immediately at onboarding flow entry
- **Required State**: Unauthenticated (new user signup flow)

**2. `e2e/demo/14-error-handling.spec.ts`**
- **Issue**: Tests signup/login validation errors
  - Line 7: Already uses `test.use({ storageState: { cookies: [], origins: [] } })`
  - Line 23-35: Duplicate email signup test (requires `/signup` access)
  - Line 37-46: Email format validation (requires `/signup` access)
  - Line 48-57: Password validation (requires `/signup` access)
  - Line 59-78: Wrong password login test (requires `/login` access)
- **Current Behavior**: Mixed - test override works but project mismatch causes instability
- **Impact**: 4 out of 5 tests require unauthenticated state
- **Required State**: Unauthenticated for 4 tests, authenticated for CSV validation (line 80-116)

#### Partial (Mixed Authentication Requirements)

**3. `e2e/demo/02-partner-invitation.spec.ts`**
- **Issue**: Line 31 calls `loginUser(page, userA)` but already authenticated via global setup
- **Current Behavior**: Redundant login may cause timing issues
- **Impact**: Test complexity and potential race conditions
- **Required State**: Authenticated (uses `loginUser` helper for custom user)

### 1.3 Test Analysis Summary

| Test File | Auth State Needed | Current Project | Issue |
|-----------|-------------------|-----------------|-------|
| `01-onboarding.spec.ts` | Unauthenticated | chromium (auth) | ❌ Project mismatch |
| `02-partner-invitation.spec.ts` | Authenticated (custom) | chromium (auth) | ⚠️ Redundant login |
| `14-error-handling.spec.ts` | Mixed (4 unauth, 1 auth) | chromium (auth) | ❌ Project mismatch |

---

## 2. Solution Options

### Option A: Move Tests to `e2e/auth/` Directory (Recommended)

**Scope**: Relocate authentication-related demo tests to align with project structure.

**Changes**:
1. Move `01-onboarding.spec.ts` → `e2e/auth/01-onboarding-demo.spec.ts`
2. Split `14-error-handling.spec.ts`:
   - Move signup/login tests → `e2e/auth/14-validation-errors.spec.ts`
   - Keep CSV validation test → `e2e/demo/14-csv-error-handling.spec.ts`
3. Update CI test filter in `.github/workflows/e2e.yml` to include new auth test paths

**Pros**:
- Clear separation of concerns (auth tests in `e2e/auth/`, app tests in `e2e/demo/`)
- No Playwright config changes needed
- Tests run in correct project automatically based on path filter
- Aligns with existing `e2e/auth/` structure

**Cons**:
- Tests are no longer in sequential demo flow (Demo 1, Demo 2, etc.)
- Requires updating documentation references

**Effort**: Low (file moves + test filter update)

---

### Option B: Use `test.use()` Override in Tests

**Scope**: Add `test.use({ storageState: { cookies: [], origins: [] } })` to each test requiring unauthenticated state.

**Changes**:
1. Add override to `01-onboarding.spec.ts` (line 10, after describe)
2. Keep existing override in `14-error-handling.spec.ts`
3. Update `playwright.config.ts` to allow these tests to run in `chromium-unauth` project

**Pros**:
- Tests remain in `e2e/demo/` for demo flow continuity
- Minimal file restructuring

**Cons**:
- Requires explicit project targeting: `npx playwright test --project=chromium-unauth e2e/demo/01-onboarding.spec.ts`
- CI filter must be updated to run these specific files in both projects (complex)
- Mixing auth states in same directory is confusing for developers
- **Does not solve CI project filtering** - current CI runs all `e2e/demo` tests in `chromium` project

**Effort**: Medium (config changes + CI filter logic)

---

### Option C: Create Dedicated `e2e/demo-unauth/` Directory

**Scope**: Create new directory for unauthenticated demo tests.

**Changes**:
1. Create `e2e/demo-unauth/` directory
2. Move `01-onboarding.spec.ts` → `e2e/demo-unauth/01-onboarding.spec.ts`
3. Move unauthenticated tests from `14-error-handling.spec.ts` → `e2e/demo-unauth/14-validation-errors.spec.ts`
4. Update CI test filter to include `e2e/demo-unauth` in `chromium-unauth` job

**Pros**:
- Preserves demo numbering sequence
- Clear directory structure: `demo/` = auth, `demo-unauth/` = no auth
- Simple CI filter update

**Cons**:
- Adds new directory layer (may be over-engineering)
- Less intuitive than `e2e/auth/` for new contributors

**Effort**: Low-Medium (directory creation + file moves + CI update)

---

## 3. Recommended Solution

**Option A: Move Tests to `e2e/auth/` Directory**

### 3.1 Rationale
1. **Clarity**: Authentication tests belong in `e2e/auth/`, not `e2e/demo/`
2. **Consistency**: Aligns with existing `e2e/auth/login.spec.ts`, `e2e/auth/signup.spec.ts`
3. **Simplicity**: No Playwright config changes required
4. **Maintainability**: Developers can easily find auth-related tests in one place

### 3.2 Implementation Steps

#### Step 1: Move Onboarding Test
```bash
git mv e2e/demo/01-onboarding.spec.ts e2e/auth/onboarding-flow.spec.ts
```

**Changes**:
- Rename test suite to reflect auth focus: `'User Onboarding Flow - Signup to Group Creation'`
- No code changes needed (test logic remains identical)

#### Step 2: Split Error Handling Test
```bash
# Create new auth validation test
cp e2e/demo/14-error-handling.spec.ts e2e/auth/validation-errors.spec.ts
# Edit validation-errors.spec.ts to keep only lines 1-78 (auth tests)
# Edit 14-error-handling.spec.ts to keep only lines 1-6, 80-117 (CSV test)
```

**File 1: `e2e/auth/validation-errors.spec.ts`** (New)
- Keep: Duplicate email test (lines 15-35)
- Keep: Email format test (lines 37-46)
- Keep: Password length test (lines 48-57)
- Keep: Wrong password test (lines 59-78)
- Remove: CSV validation test (lines 80-116)

**File 2: `e2e/demo/14-error-handling.spec.ts`** (Modified)
- Remove: All auth validation tests (lines 7-78)
- Keep: CSV validation test (lines 80-116)
- Remove: `test.use({ storageState: { cookies: [], origins: [] } })` (no longer needed)
- Rename suite to `'Scenario 14: CSV Upload Error Handling'`

#### Step 3: Update Partner Invitation Test
```typescript
// e2e/demo/02-partner-invitation.spec.ts
// No file move needed, but simplify authentication

test.beforeAll(async () => {
  const timestamp = Date.now()
  userA = await createTestUser({
    email: `invite-a-${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: 'User A',
  })
})

test('should allow partner invitation and group joining', async ({ page, context }) => {
  // Remove redundant loginUser call (line 31)
  // Test will use global auth state from chromium project
  await page.goto('/settings')
  // Rest of test remains unchanged
})
```

**Rationale**: Global setup already creates an authenticated session. Custom user creation is for data isolation, not authentication.

#### Step 4: Update CI Test Filter
```yaml
# .github/workflows/e2e.yml
strategy:
  matrix:
    include:
      - browser: chromium-unauth
        test-filter: e2e/auth  # Already includes new auth tests
        job-name: auth
      - browser: chromium
        test-filter: e2e/demo e2e/settlement e2e/accessibility  # No change needed
        job-name: app
```

**No changes required** - CI filter already includes `e2e/auth` in `chromium-unauth` job.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Test execution time should not increase (file moves do not affect runtime)
- CI job separation remains optimal (parallel execution)

### 4.2 Maintainability
- Clear directory structure: `e2e/auth/` for authentication tests, `e2e/demo/` for application tests
- Reduce cognitive load: developers know where to find auth-related tests

### 4.3 Backward Compatibility
- No breaking changes to existing passing tests
- Demo test numbering may be adjusted (01-onboarding removed from demo sequence)

### 4.4 Security
- No security implications (file moves only)

---

## 5. Acceptance Criteria

### 5.1 Functional Acceptance

- [ ] **AC-1**: `e2e/auth/onboarding-flow.spec.ts` passes in `chromium-unauth` project
  - Test can access `/login` and `/signup` without authentication
  - Onboarding flow completes successfully (signup → dashboard → group creation)

- [ ] **AC-2**: `e2e/auth/validation-errors.spec.ts` passes in `chromium-unauth` project
  - Duplicate email test shows error toast on signup
  - Email format validation enforces HTML5 email input
  - Password minimum length enforced (8 characters)
  - Wrong password test shows error toast on login

- [ ] **AC-3**: `e2e/demo/14-error-handling.spec.ts` passes in `chromium` project
  - CSV upload with invalid format shows error message
  - Test runs with authenticated user from global setup

- [ ] **AC-4**: `e2e/demo/02-partner-invitation.spec.ts` passes in `chromium` project
  - Redundant `loginUser` call removed
  - Test uses global auth state for User A
  - Partner invitation flow completes successfully

### 5.2 CI Acceptance

- [ ] **AC-5**: CI `chromium-unauth` job passes
  - All tests in `e2e/auth/` directory pass (including new auth tests)
  - No authentication-related failures

- [ ] **AC-6**: CI `chromium` job passes
  - All tests in `e2e/demo/` directory pass (excluding moved tests)
  - No test failures due to authentication state mismatch

- [ ] **AC-7**: CI job execution time remains under 60 minutes
  - No performance regression from file moves

### 5.3 Documentation Acceptance

- [ ] **AC-8**: `e2e/AUTH-SETUP.md` updated to reflect new test locations
  - Reference new `e2e/auth/onboarding-flow.spec.ts` path
  - Document `e2e/auth/validation-errors.spec.ts` as auth validation example

- [ ] **AC-9**: `e2e/MIGRATION-GUIDE.md` created (if not exists)
  - Document test restructuring for future contributors
  - Explain when to use `e2e/auth/` vs `e2e/demo/`

---

## 6. Out of Scope

- Changing demo test numbering sequence (keep existing `02-`, `03-`, etc.)
- Rewriting test logic (only file moves and minimal auth cleanup)
- Adding new test coverage (focus on fixing existing failures)
- Modifying Playwright config structure (current setup is correct)

---

## 7. Risks and Mitigation

### Risk 1: Test Discovery Issues
**Impact**: Developers may not find moved tests  
**Mitigation**: Update `e2e/AUTH-SETUP.md` and add comments in original file locations

### Risk 2: CI Cache Invalidation
**Impact**: First CI run after merge may be slower  
**Mitigation**: Expected behavior, document in PR notes

### Risk 3: Demo Flow Disruption
**Impact**: Demo scenario numbering no longer sequential (01 moved to auth)  
**Mitigation**: Acceptable trade-off for correct test organization. Consider renaming remaining demo tests if needed.

---

## 8. Follow-Up Tasks

1. **Documentation Update**: Create `e2e/TEST-ORGANIZATION.md` to explain directory structure
2. **Test Numbering**: Consider renaming demo tests to remove gaps (optional)
3. **Auth Test Consolidation**: Review if `e2e/auth/signup.spec.ts` duplicates new `validation-errors.spec.ts`
4. **Global Setup Review**: Verify if custom user creation in tests can be simplified further

---

## 9. References

- **Current Branch**: `claude/fix-ci-e2e-lighthouse-01AFGUmzSjYfUeRyC49wSoGj`
- **Related Files**:
  - `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/01-onboarding.spec.ts`
  - `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/14-error-handling.spec.ts`
  - `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/02-partner-invitation.spec.ts`
  - `/Users/takuya.kurihara/workspace/domestic-account-booking/.github/workflows/e2e.yml`
  - `/Users/takuya.kurihara/workspace/domestic-account-booking/playwright.config.ts`
- **Documentation**:
  - `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/AUTH-SETUP.md`
  - `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/MIGRATION-GUIDE.md` (to be created)
