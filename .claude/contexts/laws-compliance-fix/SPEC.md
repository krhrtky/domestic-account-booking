# MINOR-002: Rate Limiting Compliance & E2E Environment Specification

## Status
- **Phase**: MINOR Issues Resolution
- **Priority**: MINOR (Must fix before APPROVED)
- **Prerequisites**: CONDITIONAL APPROVAL obtained from QGA
- **Related Laws**: L-SC-004, L-BR-007

---

## 1. Scope

### In Scope
1. **Rate Limiting Fixes**
   - Fix L-SC-004 violation in `signUp` action (1 hour window required)
   - Add missing rate limiting to `uploadCSV` action
   - Update tests to verify compliance

2. **E2E Environment Automation**
   - Validate existing Makefile targets for CI/local E2E execution
   - Document required setup steps for developers
   - Ensure traceability.spec.ts can run successfully

### Out of Scope
- Additional security features beyond L-SC-004
- UI/UX changes
- Performance optimization
- New feature development

---

## 2. Background & Problem Statement

### 2.1 Rate Limiting Violations

#### Violation 1: signUp Window Mismatch
**Current Implementation** (`app/actions/auth.ts:38-41`):
```typescript
const rateLimitResult = checkRateLimit(clientIP, {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000  // ❌ 15 minutes
}, 'signup')
```

**L-SC-004 Requirement** (`docs/laws/04-security.md:249-250`):
| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/auth/signup | 3回 | **1時間** |

**Issue**: Window is 15 minutes instead of 1 hour.

#### Violation 2: uploadCSV Missing Rate Limit
**Current Implementation** (`app/actions/transactions.ts:31-42`):
```typescript
export async function uploadCSV(
  csvContent: string,
  fileName: string,
  payerType: PayerType
) {
  const user = await requireAuth()
  // ❌ No rate limiting check
```

**L-SC-004 Requirement** (`docs/laws/04-security.md:251`):
| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/transactions (POST) | 10回 | 1分 |

**Issue**: No rate limiting implemented at all.

### 2.2 E2E Environment
**Current State**:
- Makefile exists with comprehensive targets
- `traceability.spec.ts` created but not verified
- DB migration process documented

**Requirement** (L-BR-007):
- E2E tests must verify settlement breakdown traceability
- Tests should run in both CI and local environments

---

## 3. Laws Compliance Matrix

### L-SC-004: Rate Limiting and DoS Protection

| Endpoint | Current Status | Required | Action |
|----------|----------------|----------|--------|
| /api/auth/login | ✅ 5回/15分 | 5回/15分 | No change |
| /api/auth/signup | ❌ 3回/15分 | 3回/1時間 | Fix window |
| /api/transactions (POST) | ❌ None | 10回/1分 | Add rate limit |
| /api/* (GET) | ⚠️ Not verified | 100回/1分 | Out of scope (no violations reported) |

### L-BR-007: Traceability Testing

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-001: Settlement Breakdown | `e2e/settlement/traceability.spec.ts:4-35` | ✅ Implemented |
| UC-002: Past Settlement Trace | `e2e/settlement/traceability.spec.ts:37-56` | ✅ Implemented |

---

## 4. Detailed Design

### 4.1 Rate Limiting Fixes

#### 4.1.1 Fix signUp Window
**File**: `app/actions/auth.ts`

**Change**:
```diff
-  windowMs: 15 * 60 * 1000
+  windowMs: 60 * 60 * 1000  // 1 hour
```

**Verification**:
- Update comment to reflect correct duration
- Existing error message already mentions "秒後に再試行" (dynamically calculated)

#### 4.1.2 Add uploadCSV Rate Limit
**File**: `app/actions/transactions.ts`

**Implementation Pattern** (following existing auth.ts pattern):
```typescript
export async function uploadCSV(
  csvContent: string,
  fileName: string,
  payerType: PayerType
) {
  const user = await requireAuth()

  // L-SC-004: CSV upload rate limit - 10 attempts per 1 minute (per user)
  const rateLimitResult = checkRateLimit(user.id, {
    maxAttempts: 10,
    windowMs: 60 * 1000
  }, 'csv-upload')

  if (!rateLimitResult.allowed) {
    return {
      error: `CSV取り込みの試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`
    }
  }

  const parsed = UploadCSVSchema.safeParse({ csvContent, fileName, payerType })
  // ... rest of existing implementation
}
```

**Key Design Decisions**:
1. **Identifier**: Use `user.id` instead of IP (user already authenticated)
2. **Scope**: Use `'csv-upload'` as rate limit scope (separate from other actions)
3. **Reset**: Success should NOT reset counter (per L-SC-004, only login resets on success)
4. **Error Message**: Follow L-CX-003 (specific, actionable, Japanese)

### 4.2 Test Coverage

#### 4.2.1 Unit Tests
**New File**: `src/lib/rate-limiter.test.ts` (if not exists) or update existing

**Test Cases** (per L-TA-001 categories):

**Typical**:
```typescript
describe('L-SC-004: Rate Limiting', () => {
  describe('signUp rate limit', () => {
    it('allows 3 attempts within 1 hour', async () => {
      const ip = '192.168.1.1'
      
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(ip, { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, 'signup')
        expect(result.allowed).toBe(true)
      }
    })
  })

  describe('uploadCSV rate limit', () => {
    it('allows 10 attempts within 1 minute', async () => {
      const userId = 'test-user-id'
      
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(userId, { maxAttempts: 10, windowMs: 60 * 1000 }, 'csv-upload')
        expect(result.allowed).toBe(true)
      }
    })
  })
})
```

**Boundary**:
```typescript
it('blocks 4th signup attempt within 1 hour', async () => {
  const ip = '192.168.1.2'
  
  for (let i = 0; i < 3; i++) {
    checkRateLimit(ip, { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, 'signup')
  }
  
  const result = checkRateLimit(ip, { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, 'signup')
  expect(result.allowed).toBe(false)
  expect(result.retryAfter).toBeGreaterThan(0)
})

it('blocks 11th CSV upload within 1 minute', async () => {
  const userId = 'test-user-id'
  
  for (let i = 0; i < 10; i++) {
    checkRateLimit(userId, { maxAttempts: 10, windowMs: 60 * 1000 }, 'csv-upload')
  }
  
  const result = checkRateLimit(userId, { maxAttempts: 10, windowMs: 60 * 1000 }, 'csv-upload')
  expect(result.allowed).toBe(false)
})
```

**Attack** (L-TA-003):
```typescript
it('prevents rapid signup attempts from same IP', async () => {
  const ip = 'attacker-ip'
  
  // Rapid fire 10 attempts
  for (let i = 0; i < 10; i++) {
    checkRateLimit(ip, { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, 'signup')
  }
  
  const result = checkRateLimit(ip, { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, 'signup')
  expect(result.allowed).toBe(false)
})
```

#### 4.2.2 Integration Tests
**File**: `app/actions/transactions.test.ts` (new or update)

```typescript
describe('uploadCSV rate limiting', () => {
  it('returns error after 10 uploads in 1 minute', async () => {
    const user = await createTestUser()
    const csv = 'date,amount\n2025-01-01,1000'
    
    for (let i = 0; i < 10; i++) {
      await uploadCSV(csv, 'test.csv', 'UserA')
    }
    
    const result = await uploadCSV(csv, 'test.csv', 'UserA')
    expect(result.error).toContain('試行回数が上限を超えました')
  })
})
```

### 4.3 E2E Environment Automation

#### 4.3.1 Validate Makefile Targets
**Existing Targets** (per `Makefile:1-125`):
- `e2e-ci`: Full CI pipeline (setup → run)
- `e2e-ci-setup`: DB + env + playwright install
- `e2e-ci-db-start`: PostgreSQL container
- `e2e-ci-db-migrate`: Apply migrations
- `e2e-ci-env`: Create `.env.local.e2e`
- `e2e-ci-run`: Execute tests
- `e2e-ci-clean`: Cleanup containers and files
- `e2e-local`: Local run with full setup
- `e2e-local-ui`: Local UI mode

**Validation Required**:
1. Ensure all migration files exist in correct order
2. Verify container naming consistency
3. Test end-to-end execution

#### 4.3.2 Developer Documentation
**New File**: `docs/api/e2e-testing.md`

**Content Outline**:
```markdown
# E2E Testing Setup

## Quick Start

### CI Environment
```bash
make e2e-ci        # Full run (setup + execute + keep container)
make e2e-ci-clean  # Cleanup after tests
```

### Local Development
```bash
make e2e-local     # Run all tests
make e2e-local-ui  # Run with Playwright UI
```

## Requirements
- Docker installed and running
- Port 5433 available (or adjust POSTGRES_PORT in Makefile)
- Playwright installed (auto-installed by setup)

## What Gets Created
- PostgreSQL container: `domestic-account-booking-e2e-postgres`
- `.env.local.e2e` file with test database credentials
- `e2e/.auth/` directory with test user sessions

## Cleanup
```bash
make e2e-ci-clean  # Stop container, remove env file
```

## Troubleshooting
- **Port conflict**: Adjust `POSTGRES_PORT` in Makefile
- **Migration errors**: Check migration file order in `e2e-ci-db-migrate`
- **Timeout**: Increase `playwright.config.ts` webServer timeout
```

#### 4.3.3 Traceability Test Execution
**Verify**:
1. Test file exists: `e2e/settlement/traceability.spec.ts`
2. Test IDs used in tests are implemented in UI components:
   - `breakdown-panel`
   - `paid-by-a-total`
   - `paid-by-b-total`
   - `calculation-formula`
   - `month-selector`

**Out of Scope**:
- Adding missing test IDs to UI (CONDITIONAL item, separate task)
- Fixing test failures (will be addressed if tests fail during validation)

---

## 5. Non-Functional Requirements

### 5.1 Performance (L-RV-002)
- Rate limit checks should add <10ms latency
- Use in-memory cache for rate limit counters (existing implementation assumed)

### 5.2 Security (L-SC-004)
- Rate limits MUST be enforced before any business logic
- Error messages MUST NOT leak implementation details (L-CX-003)
- Rate limit scope MUST be isolated per action type

### 5.3 Maintainability (L-OC-003)
- Use existing `checkRateLimit` utility pattern
- Follow existing error handling conventions
- Update inline comments with Law references

---

## 6. Acceptance Criteria

### 6.1 Rate Limiting Compliance

#### AC-1: signUp Window Fix
- [ ] `app/actions/auth.ts:40` window changed to `60 * 60 * 1000`
- [ ] Comment updated: `// L-SC-004: Signup rate limit - 3 attempts per 1 hour (per IP)`
- [ ] Unit test passes: 3rd attempt succeeds, 4th fails within 1 hour
- [ ] Integration test passes: Actual signUp action respects limit

#### AC-2: uploadCSV Rate Limit
- [ ] Rate limit check added after `requireAuth()` call
- [ ] Uses `user.id` as identifier
- [ ] Window: `60 * 1000` (1 minute)
- [ ] maxAttempts: `10`
- [ ] Scope: `'csv-upload'`
- [ ] Error message: `CSV取り込みの試行回数が上限を超えました。${rateLimitResult.retryAfter}秒後に再試行してください。`
- [ ] Unit test passes: 10th attempt succeeds, 11th fails within 1 minute
- [ ] Integration test passes: Actual uploadCSV action respects limit

### 6.2 Test Coverage (L-TA-002)

#### AC-3: Unit Tests
- [ ] Rate limiter tests exist for both fixes
- [ ] Coverage includes: Typical, Boundary, Attack scenarios
- [ ] All tests pass: `npm test`
- [ ] Coverage: 100% for modified functions

#### AC-4: Integration Tests
- [ ] uploadCSV integration test added
- [ ] Test verifies actual action behavior
- [ ] All tests pass: `npm test`

### 6.3 E2E Environment (L-BR-007)

#### AC-5: Makefile Validation
- [ ] `make e2e-ci-setup` completes without errors
- [ ] PostgreSQL container starts and becomes healthy
- [ ] All migration files apply successfully
- [ ] `.env.local.e2e` created with correct variables
- [ ] `make e2e-ci-clean` removes all artifacts

#### AC-6: Traceability Test Execution
- [ ] `make e2e-ci-run` includes `e2e/settlement` tests
- [ ] `traceability.spec.ts` runs without errors (skip/pass acceptable for missing UI elements)
- [ ] Test report generated in `playwright-report/`

#### AC-7: Documentation
- [ ] `docs/api/e2e-testing.md` created
- [ ] Quick start commands documented
- [ ] Troubleshooting section includes common issues
- [ ] Cleanup process documented

### 6.4 Code Quality (L-OC-001)

#### AC-8: Linting and Type Checking
- [ ] `npm run lint` passes with no errors
- [ ] `npm run type-check` passes with no errors
- [ ] No new ESLint warnings introduced

### 6.5 Laws Compliance

#### AC-9: L-SC-004 Full Compliance
- [ ] All four endpoints match specification table
- [ ] No rate limiting violations in QGA review

#### AC-10: L-CX-003 Error Message Clarity
- [ ] Error messages in Japanese
- [ ] Include actionable guidance (retry time)
- [ ] No technical jargon or raw errors

#### AC-11: L-TA-001 Test Categories
- [ ] Tests include: Typical, Boundary, Attack cases
- [ ] Each category has minimum required test count

---

## 7. Testing Strategy

### 7.1 Test Execution Order
1. **Unit Tests**: `npm test` (rate-limiter, actions)
2. **Linting**: `npm run lint`
3. **Type Check**: `npm run type-check`
4. **E2E Setup**: `make e2e-ci-setup`
5. **E2E Tests**: `make e2e-ci-run`
6. **Cleanup**: `make e2e-ci-clean`

### 7.2 Success Criteria
- All unit tests pass
- All integration tests pass
- E2E setup completes successfully
- Traceability tests run (pass/skip acceptable)
- No linting or type errors
- QGA APPROVED status achieved

---

## 8. Implementation Plan

### 8.1 Phase 1: Rate Limiting Fixes
1. Update `app/actions/auth.ts` signUp window
2. Add rate limiting to `app/actions/transactions.ts` uploadCSV
3. Write unit tests for both fixes
4. Write integration test for uploadCSV
5. Verify all tests pass

### 8.2 Phase 2: E2E Environment
1. Validate Makefile targets with test run
2. Create `docs/api/e2e-testing.md`
3. Verify traceability.spec.ts execution
4. Document any issues found

### 8.3 Phase 3: QGA Review
1. Run full test suite
2. Submit to QGA with updated test results
3. Address any additional feedback

---

## 9. Constraints & Dependencies

### 9.1 Technical Constraints
- Must use existing `checkRateLimit` utility
- Cannot change rate limit storage mechanism (out of scope)
- Must maintain backward compatibility with existing tests

### 9.2 Dependencies
- `@/lib/rate-limiter` utility exists and is functional
- PostgreSQL 15 container image available
- Playwright installed and configured

### 9.3 Assumptions
- Rate limit storage is in-memory (session-based)
- E2E tests run on localhost:3000
- Port 5433 is available for test database

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Rate limiter not working as expected | HIGH | LOW | Add comprehensive unit tests before integration |
| E2E environment setup fails | MEDIUM | MEDIUM | Validate each Makefile step individually |
| Traceability tests fail due to missing UI | LOW | MEDIUM | Document as CONDITIONAL item, not blocker |
| Port conflict on CI | MEDIUM | LOW | Use configurable port in Makefile |

---

## 11. Rollback Plan

### If Rate Limiting Breaks Existing Functionality:
1. Revert `app/actions/auth.ts` to previous window value
2. Remove rate limiting from `uploadCSV`
3. Mark as KNOWN ISSUE for next iteration

### If E2E Setup Fails:
1. Keep Makefile as-is (already exists)
2. Document manual setup steps
3. File issue for automation improvement

---

## 12. Success Metrics

### Definition of Done
- [ ] All Acceptance Criteria (AC-1 through AC-11) met
- [ ] QGA review status: APPROVED
- [ ] No BLOCKER or MAJOR issues remaining
- [ ] All MINOR issues resolved
- [ ] E2E tests executable by any developer with `make e2e-local`

### Quality Gates
- Unit test coverage: 100% for modified code
- Integration test: uploadCSV rate limiting verified
- E2E: traceability tests execute successfully
- Linting: 0 errors, 0 new warnings
- Type checking: 0 errors

---

## 13. References

### Laws Documents
- `/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/04-security.md` (L-SC-004)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/01-customer-experience.md` (L-CX-003)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/08-business-rules.md` (L-BR-007)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/07-test-audit.md` (L-TA-001, L-TA-002, L-TA-003)

### Implementation Files
- `/Users/takuya.kurihara/workspace/domestic-account-booking/app/actions/auth.ts` (signUp fix)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/app/actions/transactions.ts` (uploadCSV fix)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/Makefile` (E2E automation)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/settlement/traceability.spec.ts` (L-BR-007 tests)

### Related Rules
- `.claude/rules/**__api__.md` (API route compliance)
- `.claude/rules/**__*.test.*.md` (Test file requirements)
- `.claude/rules/**__*.spec.*.md` (E2E test requirements)

---

## Document Metadata
- **Created**: 2025-12-15
- **Context**: laws-compliance-fix
- **Agent**: Product Agent (PA)
- **Status**: Draft → Review → Approved
- **Next Step**: Hand off to Delivery Agent (DA) for implementation
