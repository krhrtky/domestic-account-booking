# Spec & Acceptance: PR #8 CI Failure Fix

**Date**: 2025-12-09  
**PR**: https://github.com/krhrtky/domestic-account-booking/pull/8  
**Status**: Draft

---

## Executive Summary

PR #8 aims to configure CI workflows to use hardcoded test credentials instead of GitHub Secrets. The CI currently fails due to database schema mismatches between:
- **E2E test helper** (`e2e/utils/test-helpers.ts`) expecting column `encrypted_password`
- **Lighthouse auth script** (`scripts/lighthouse-auth.js`) expecting column `password_hash`
- **CI workflow** (`.github/workflows/e2e.yml`) creating table with `password_hash`

Additionally, Lighthouse CI times out (30+ minutes) due to the auth script hanging indefinitely.

---

## CI Status Analysis

### Current Failures

```
test (chromium)   FAIL   1m42s   ✗ Global setup failed: column "encrypted_password" does not exist
test (firefox)    FAIL   1m30s   ✗ Global setup failed: column "encrypted_password" does not exist
test (webkit)     FAIL   1m45s   ✗ Global setup failed: column "encrypted_password" does not exist
lighthouse        FAIL   30m17s  Timeout (auth script hangs indefinitely)
```

### Passing Checks

```
Build             PASS   1m5s
Unit Tests        PASS   40s
Lint & Type Check PASS   35s
lint              PASS   38s
```

---

## Root Cause Analysis

### Issue 1: Database Column Name Mismatch

**Location**: 
- `e2e/utils/test-helpers.ts:32` uses `encrypted_password`
- `scripts/lighthouse-auth.js:38` uses `password_hash`
- `.github/workflows/e2e.yml:82` creates schema with `password_hash`

**Impact**: E2E test global setup fails immediately when attempting to insert test user.

**Root Cause**: Inconsistent database column naming across codebase. The actual application code may use one convention, but test utilities diverged.

### Issue 2: Lighthouse Auth Script Hang

**Location**: `scripts/lighthouse-auth.js`

**Symptoms**: 
- Script starts at `2025-12-09T00:19:06`
- Operation canceled at `2025-12-09T00:47:47` (28+ minutes later)
- No error output, just timeout

**Root Cause Analysis**:
1. Script calls `pool.end()` but uses `process.exit(0)` before connection fully closes
2. When running via `node --env-file`, possible race condition with connection cleanup
3. No timeout mechanism in the script itself
4. Possible database connection pool not draining properly

---

## Scope & Non-Scope

### In Scope

1. **Standardize password column name** to `password_hash` across all files:
   - `e2e/utils/test-helpers.ts`
   - `scripts/lighthouse-auth.js` (already correct)
   - `.github/workflows/e2e.yml` (already correct)
   - `.github/workflows/lighthouse.yml` (already correct)

2. **Fix Lighthouse auth script timeout**:
   - Ensure proper connection cleanup
   - Add explicit timeout handling
   - Verify script completes within reasonable time (<30s)

3. **Verify database schema consistency**:
   - Ensure CI schema matches test expectations
   - Document required schema structure

### Out of Scope

1. Refactoring test data seeding strategy
2. Migrating to Supabase Auth or other auth solutions
3. Changing overall CI architecture (container strategy, etc.)
4. Addressing npm deprecation warnings (inflight, rimraf, glob)
5. Fixing React setState warning in `app/dashboard/transactions/page.tsx:115`

---

## Constraints

1. **No Breaking Changes**: Must not alter existing test behavior for passing tests
2. **Code Style Compliance**: Follow existing patterns in E2E test utilities
3. **CI Environment**: Work within GitHub Actions ubuntu-latest, Node 20, PostgreSQL 15
4. **Backwards Compatibility**: Ensure local development environment still works
5. **No Secrets Required**: Continue using hardcoded test credentials in CI

---

## Proposed Solution

### Change 1: Standardize Column Name in `e2e/utils/test-helpers.ts`

**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/utils/test-helpers.ts`

**Line 32**: Change from:
```typescript
'INSERT INTO auth.users (id, email, encrypted_password) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
```

To:
```typescript
'INSERT INTO auth.users (id, email, password_hash) VALUES (gen_random_uuid(), $1, $2) RETURNING id',
```

**Rationale**: Aligns with:
- Lighthouse script convention (`scripts/lighthouse-auth.js:38`)
- CI workflow schema (`.github/workflows/e2e.yml:82`)
- Likely production schema (based on naming pattern in auth.ts)

### Change 2: Fix Lighthouse Auth Script Connection Handling

**File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/scripts/lighthouse-auth.js`

**Lines 60-65**: Replace:
```javascript
console.log(`next-auth.session-token=${token}`)

await pool.end()
process.exit(0)
```

With:
```javascript
console.log(`next-auth.session-token=${token}`)
await pool.end()
process.exit(0)
```

And add timeout wrapper at the beginning:
```javascript
const TIMEOUT_MS = 30000

setTimeout(() => {
  console.error('Error: Script timeout after 30s')
  process.exit(1)
}, TIMEOUT_MS)
```

**Alternative (More Robust)**: Use connection pooling with explicit timeout:
```javascript
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 1000,
})
```

And ensure proper cleanup:
```javascript
try {
  // ... existing logic
  console.log(`next-auth.session-token=${token}`)
} finally {
  await pool.end()
  process.exit(0)
}
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] E2E tests (chromium, firefox, webkit) complete successfully in CI
- [ ] Lighthouse CI completes within 10 minutes (down from 30+)
- [ ] All existing passing tests remain green (lint, type-check, build, unit tests)
- [ ] Test user creation succeeds in global setup
- [ ] Authentication state files generated for all browsers (`e2e/.auth/user-*.json`)

### Non-Functional Requirements

- [ ] No new dependencies added
- [ ] No secrets required (hardcoded test credentials work)
- [ ] Lighthouse auth script exits within 30 seconds
- [ ] Database connections properly cleaned up (no hanging connections)
- [ ] Error messages remain clear and actionable

### Verification Steps

**Local Verification**:
```bash
# 1. Ensure .env.local exists with test credentials
cat > .env.local << 'ENV'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
NEXTAUTH_SECRET=test-secret-for-ci-e2e
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV

# 2. Setup local PostgreSQL with correct schema
PGPASSWORD=postgres psql -h localhost -U postgres -d test_db -c "
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";
  CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
"

# 3. Run E2E tests
npm run test:e2e -- --project=chromium

# 4. Test Lighthouse auth script
time node --env-file=.env.local scripts/lighthouse-auth.js
# Expected: completes in <5s, outputs session token

# 5. Run full test suite
npm run lint
npm test
npm run type-check
npm run build
```

**CI Verification**:
```bash
# Push changes and verify GitHub Actions
gh pr checks 8

# Expected output:
# test (chromium)   pass   ~2m
# test (firefox)    pass   ~2m
# test (webkit)     pass   ~2m
# lighthouse        pass   ~5-10m
# Build             pass   ~1m
# Unit Tests        pass   ~1m
# Lint & Type Check pass   ~1m
```

---

## Rollback Plan

If the fix causes regressions:

1. **Immediate**: Revert commit in PR #8
2. **Identify**: Check which tests started failing
3. **Options**:
   - If local tests work but CI fails: Check service container health
   - If column name is still wrong: Verify actual production schema
   - If Lighthouse still hangs: Add DEBUG logging to script

---

## Dependencies & Follow-Up Tasks

### Blockers
None (all changes are self-contained)

### Follow-Up Issues
1. **Technical Debt**: Document database schema in `docs/database-schema.md`
2. **Improvement**: Add schema validation step to CI (verify column names)
3. **Improvement**: Add connection pooling best practices to test utilities
4. **Improvement**: Consider migrating to centralized test database seeding
5. **Bug**: Fix React setState warning in `app/dashboard/transactions/page.tsx:115` (separate PR)

---

## Notes

- Column name standardization is critical: `password_hash` appears to be the correct convention based on CI schema and Lighthouse script
- Lighthouse timeout suggests connection pool not draining; explicit cleanup required
- PostgreSQL service container in CI is healthy (verified by startup logs)
- The PR already correctly configured database schema in workflows; only test utilities need updating

---

## References

- PR #8: https://github.com/krhrtky/domestic-account-booking/pull/8
- Failed E2E Run: https://github.com/krhrtky/domestic-account-booking/actions/runs/20047303253
- Failed Lighthouse Run: https://github.com/krhrtky/domestic-account-booking/actions/runs/20047303260
- `e2e/utils/test-helpers.ts:32` - Test user creation with `encrypted_password`
- `scripts/lighthouse-auth.js:38` - Lighthouse user creation with `password_hash`
- `.github/workflows/e2e.yml:82` - CI schema with `password_hash`
