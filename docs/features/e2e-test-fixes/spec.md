# E2E Test Fixes Specification

## Scope

Fix 57 failing E2E tests across multiple categories:
- Text matching issues (English vs Japanese)
- Visual regression test baseline updates
- Missing breakdown panel implementation (L-BR-007 traceability)
- Auth state setup issues
- Missing sensitive column warning (CSV import)

## Non-Goals

- Changing core business logic (settlement calculations, CSV parsing)
- Modifying Laws (docs/laws/)
- Adding new features beyond L-BR-007 requirement
- Performance optimization

## Constraints

- L-CX-002: UI Display Consistency (Japanese text throughout)
- L-BR-007: Traceability requirements (breakdown panel must show calculation basis)
- L-TA-001: E2E tests must cover Typical/Boundary/Incident/Gray/Attack categories
- No code in docs/laws/ can be modified

---

## Analysis Summary

### 1. Text Matching Issues (10-15 tests)

**Root Cause**: Tests written expecting English UI text, but application uses Japanese.

**Affected Files**:
- e2e/auth/login.spec.ts
  - Line 27: `'Log In'` → `'ログイン'`
  - Line 40: `'Welcome'` → `user.name` (dynamic)
  - Line 66: `'Create Account'` → `'新規登録'`
  
- e2e/auth/signup.spec.ts
  - Line 24: `'Create Account'` → `'新規登録'`
  - Line 53: `'Welcome'` → `user.name` (dynamic)
  - Line 100: `'Log In'` → `'ログイン'`

- e2e/settlement/dashboard.spec.ts
  - Line 8: `'Dashboard'` → Dynamic greeting (おはようございます/こんにちは/こんばんは) + user name
  - Line 22: `/transactions/i` → `'取引一覧'`
  - Line 29: `/group settings/i` → `'グループ設定'`

- e2e/happy-path/complete-user-journey.spec.ts
  - Line 39: `'新規登録'` → Already correct (verify only)

**Solution**: Update test assertions to match Japanese UI text.

**Code Changes**: Test files only (no component changes needed).

---

### 2. Visual Regression Test Failures (4 tests)

**Root Cause**: Screenshot baselines outdated after UI changes to Japanese text.

**Affected Files**:
- e2e/vrt/visual-regression.spec.ts
  - All 4 tests need baseline regeneration

**Solution**: Regenerate VRT baselines with current Japanese UI.

**Command**:
```bash
npx playwright test e2e/vrt/visual-regression.spec.ts --update-snapshots
```

**Code Changes**: None (baseline image updates only).

---

### 3. Missing Breakdown Panel (8-10 tests)

**Root Cause**: L-BR-007 requires traceability UI (breakdown panel showing calculation basis), but component not implemented.

**Affected Files**:
- e2e/settlement/traceability.spec.ts (all tests)
- Potentially e2e/settlement/dashboard.spec.ts
- Potentially e2e/happy-path/complete-user-journey.spec.ts

**Required Implementation** (per L-BR-007):

#### UC-001: Settlement Breakdown Confirmation
User must be able to click "詳細を見る" button on SettlementSummary to view:
- `breakdown-panel` (testid): Panel container
- `paid-by-a-total` (testid): Total amount paid by User A
- `paid-by-b-total` (testid): Total amount paid by User B
- `calculation-formula` (testid): Formula display showing how balance was calculated

#### UC-002: Past Settlement Trace
Same breakdown must be available for past months.

**Solution**: Add breakdown panel to SettlementSummary component.

**Code Changes**:

#### src/components/settlement/SettlementSummary.tsx

Add state and UI:
```typescript
const [showBreakdown, setShowBreakdown] = useState(false)

// Add button after settlement instruction
<button
  onClick={() => setShowBreakdown(!showBreakdown)}
  className="..."
>
  {showBreakdown ? '詳細を閉じる' : '詳細を見る'}
</button>

// Add breakdown panel (conditional render)
{showBreakdown && (
  <div data-testid="breakdown-panel" className="...">
    <h4>精算の内訳</h4>
    
    <div>
      <p>支払合計</p>
      <div data-testid="paid-by-a-total">
        {userAName}: {formatCurrency(settlement.paid_by_a_household)}
      </div>
      <div data-testid="paid-by-b-total">
        {userBName}: {formatCurrency(settlement.paid_by_b_household)}
      </div>
    </div>

    <div data-testid="calculation-formula">
      <p>計算式</p>
      <code>
        Balance = {formatCurrency(settlement.paid_by_a_household)} 
        - (({formatCurrency(settlement.paid_by_a_household)} + {formatCurrency(settlement.paid_by_b_household)}) 
        × {settlement.ratio_a}%)
        = {formatCurrency(settlement.balance_a)}
      </code>
    </div>
  </div>
)}
```

**Test Changes**: Update tests to handle conditional visibility of button.

---

### 4. Auth State Issues (15-20 tests)

**Root Cause**: Tests don't have proper authentication state setup.

**Affected Files**:
- e2e/navigation.spec.ts (uses default storageState from config)
- e2e/settlement/dashboard.spec.ts (uses default storageState)
- e2e/settlement/traceability.spec.ts (uses default storageState)
- e2e/demo/*.spec.ts (many use `storageState: { cookies: [], origins: [] }` and manual login)

**Current State**:
- Some tests use `./e2e/.auth/user-chromium.json`
- Some tests use `storageState: { cookies: [], origins: [] }`
- Some tests call `loginUser()` helper
- Inconsistent patterns

**Solution**: Standardize auth setup.

**Pattern A (Authenticated tests)**:
```typescript
test.use({
  storageState: './e2e/.auth/user-chromium.json'
})
```

**Pattern B (Unauthenticated/custom user tests)**:
```typescript
test.use({ storageState: { cookies: [], origins: [] } })

test.beforeAll(async () => {
  testUser = await createTestUser({...})
})

test('...', async ({ page }) => {
  await loginUser(page, testUser)
  // test steps
})
```

**Test Changes**: Add explicit `test.use()` to files missing it.

---

### 5. UC-004: Sensitive Column Warning (1 test)

**Root Cause**: Test expects warning message when sensitive columns are excluded, but UI may not display it.

**Affected Files**:
- e2e/transactions/csv-column-mapping.spec.ts:65-81

**Test Expectation**:
```typescript
await expect(page.getByText(/機密情報を含む可能性のある列を除外しました/)).toBeVisible()
await expect(page.getByText('カード番号')).toBeVisible()
```

**Solution**: Verify/implement warning display in CSV column mapping UI.

**Code Changes**: Investigate `src/components/transactions/ColumnMapping.tsx` (or similar) to ensure warning is shown when sensitive columns (カード番号, 口座番号, Card Number, Account Number) are detected and excluded per L-LC-001.

---

## Acceptance Criteria

### AC-001: Text Matching Tests Pass
- [ ] All auth flow tests (login.spec.ts, signup.spec.ts) pass
- [ ] Dashboard navigation tests pass with Japanese text
- [ ] Settlement dashboard tests recognize Japanese UI elements

### AC-002: VRT Tests Pass
- [ ] All 4 VRT tests in visual-regression.spec.ts pass with updated baselines
- [ ] Baselines committed to repository

### AC-003: Breakdown Panel Tests Pass
- [ ] UC-001 tests pass: breakdown-panel, paid-by-a-total, paid-by-b-total, calculation-formula visible
- [ ] UC-002 tests pass: past month breakdown accessible
- [ ] "詳細を見る" button present on SettlementSummary
- [ ] Formula display matches L-BR-001 calculation logic

### AC-004: Auth State Tests Pass
- [ ] All navigation tests have proper auth state
- [ ] All settlement tests have proper auth state
- [ ] Demo scenario tests continue to work with custom users

### AC-005: Sensitive Column Warning Test Passes
- [ ] Warning message displays when sensitive columns detected
- [ ] Excluded column names shown to user
- [ ] Test csv-column-mapping.spec.ts:65 passes

### AC-006: All 57 Tests Pass
- [ ] `npx playwright test` shows 0 failures
- [ ] No test skips added (except existing webkit skip)
- [ ] CI pipeline passes

---

## Non-Functional Requirements

### Performance
- L-CX-004: Breakdown panel toggle must respond within 100ms
- No impact on existing page load times

### Security
- L-BR-007: Breakdown panel must only show data from user's own group
- No exposure of calculation internals beyond defined formula

### Operability
- Breakdown panel state not persisted (resets on page reload)
- No new server endpoints required (client-side only)

---

## Implementation Plan

### Phase 1: Test Assertion Updates (Low Risk)
1. Update text assertions in auth tests (login, signup)
2. Update text assertions in dashboard tests
3. Update text assertions in navigation tests
4. Run tests: expect ~10-15 fewer failures

### Phase 2: VRT Baseline Updates (Low Risk)
1. Run VRT update command
2. Visually review baseline diffs
3. Commit new baselines
4. Run tests: expect 4 fewer failures

### Phase 3: Breakdown Panel Implementation (Medium Risk)
1. Add state to SettlementSummary component
2. Add "詳細を見る" button
3. Add breakdown panel UI with required testids
4. Add calculation formula display
5. Test manually in browser
6. Run traceability tests: expect 8-10 fewer failures

### Phase 4: Auth State Standardization (Low Risk)
1. Add `test.use()` to navigation.spec.ts
2. Add `test.use()` to settlement tests
3. Verify demo tests still work
4. Run tests: expect remaining failures resolved

### Phase 5: Sensitive Column Warning (Low Risk)
1. Verify column mapping UI shows warning
2. If missing, add warning display logic
3. Run csv-column-mapping test
4. Verify UC-004 passes

### Phase 6: Verification
1. Run full test suite: `npx playwright test`
2. Verify 0 failures
3. Check CI pipeline
4. Update documentation if needed

---

## Risk Assessment

### High Risk
None

### Medium Risk
- Breakdown panel implementation could conflict with existing SettlementSummary layout
  - Mitigation: Use collapsible/accordion pattern, test on multiple viewports

### Low Risk
- Text assertion updates (straightforward string replacements)
- VRT baseline updates (visual review required)
- Auth state standardization (pattern already established)
- Sensitive column warning (feature may already exist)

---

## Related Laws

- **L-CX-002**: UI Display Consistency → Japanese text throughout
- **L-CX-004**: Feedback Immediacy → 100ms response for breakdown toggle
- **L-BR-001**: Settlement Calculation → Formula in breakdown must match
- **L-BR-007**: Traceability → Breakdown panel requirement
- **L-LC-001**: PII Handling → Sensitive column exclusion warning
- **L-TA-001**: Evaluation Dataset → E2E tests cover all categories

---

## Follow-up Tasks

After all tests pass:
1. Review coverage report: ensure 80%+ maintained
2. Document breakdown panel usage for users
3. Consider accessibility (ARIA labels) for breakdown panel
4. Monitor CI for flaky tests in first week

---

## Appendix: Detailed Test Mapping

### Category 1: Text Matching (TEST-ONLY changes)

| File | Line | Current Assertion | Fixed Assertion |
|------|------|-------------------|-----------------|
| e2e/auth/login.spec.ts | 27 | `'Log In'` | `'ログイン'` |
| e2e/auth/login.spec.ts | 40 | `'Welcome'` | `/おはよう\|こんにちは\|こんばんは/` or user.name |
| e2e/auth/login.spec.ts | 66 | `'Create Account'` | `'新規登録'` |
| e2e/auth/signup.spec.ts | 24 | `'Create Account'` | `'新規登録'` |
| e2e/auth/signup.spec.ts | 53 | `'Welcome'` | user name or greeting |
| e2e/auth/signup.spec.ts | 100 | `'Log In'` | `'ログイン'` |
| e2e/settlement/dashboard.spec.ts | 8 | `'Dashboard'` | Remove or change to greeting |
| e2e/settlement/dashboard.spec.ts | 22 | `/transactions/i` | `'取引一覧'` |
| e2e/settlement/dashboard.spec.ts | 29 | `/group settings/i` | `'グループ設定'` |

### Category 2: VRT (BASELINE-ONLY changes)

| File | Test | Action |
|------|------|--------|
| e2e/vrt/visual-regression.spec.ts | login page visual appearance | Update baseline |
| e2e/vrt/visual-regression.spec.ts | login form elements | Update baseline |
| e2e/vrt/visual-regression.spec.ts | signup page visual appearance | Update baseline |
| e2e/vrt/visual-regression.spec.ts | error message styling | Update baseline |

### Category 3: Breakdown Panel (COMPONENT + TEST changes)

| File | Test | Required Element |
|------|------|------------------|
| e2e/settlement/traceability.spec.ts | UC-001: breakdown panel display | breakdown-panel testid |
| e2e/settlement/traceability.spec.ts | UC-001: paid amounts | paid-by-a-total, paid-by-b-total testids |
| e2e/settlement/traceability.spec.ts | UC-001: formula | calculation-formula testid |
| e2e/settlement/traceability.spec.ts | UC-002: past month trace | Same elements for past months |

**Component Changes**:
- src/components/settlement/SettlementSummary.tsx: Add breakdown panel section

**Test Changes**:
- Update to handle conditional button visibility (some tests may need `if (await button.isVisible())`)

### Category 4: Auth State (TEST-ONLY changes)

| File | Current State | Fix |
|------|---------------|-----|
| e2e/navigation.spec.ts | Uses default (may be undefined) | Add `test.use({ storageState: './e2e/.auth/user-chromium.json' })` |
| e2e/settlement/dashboard.spec.ts | Mixed | Standardize with storageState |
| e2e/settlement/traceability.spec.ts | Missing setup | Add `test.use({ storageState: './e2e/.auth/user-chromium.json' })` |
| e2e/demo/*.spec.ts | Custom users | Keep existing pattern (already correct) |

### Category 5: Sensitive Warning (COMPONENT + TEST changes)

| File | Test | Expected Behavior |
|------|------|-------------------|
| e2e/transactions/csv-column-mapping.spec.ts | UC-004: Warning | Display warning when sensitive columns detected |

**Verification Steps**:
1. Check if warning already exists in CSV column mapping component
2. If missing, add warning display
3. Ensure test assertion matches actual UI text

---

## VRT Update Commands

```bash
# Update all VRT baselines
npx playwright test e2e/vrt/visual-regression.spec.ts --update-snapshots

# Update specific baseline
npx playwright test e2e/vrt/visual-regression.spec.ts:4 --update-snapshots

# Review changes before committing
git diff e2e/vrt/visual-regression.spec.ts-snapshots/
```

---

## Testing Strategy

### Unit Tests
Not applicable (E2E test fixes only)

### Integration Tests
Not applicable (E2E test fixes only)

### E2E Tests
All 57 tests must pass:
```bash
# Run all E2E tests
npx playwright test

# Run by category
npx playwright test e2e/auth/
npx playwright test e2e/settlement/
npx playwright test e2e/vrt/
npx playwright test e2e/transactions/csv-column-mapping.spec.ts

# Run with UI (for debugging)
npx playwright test --ui

# Run specific test
npx playwright test e2e/settlement/traceability.spec.ts:5
```

### Manual Testing
After implementation:
1. Login/Signup flows (verify Japanese text)
2. Dashboard navigation (verify Japanese labels)
3. Settlement summary → Click "詳細を見る" → Verify breakdown panel
4. CSV upload with sensitive columns → Verify warning display
5. Test on Chrome, Firefox, Safari (webkit)

---

## Definition of Done

- [ ] All 57 E2E tests pass locally
- [ ] All tests pass in CI pipeline
- [ ] Code review completed
- [ ] Visual review of VRT baselines completed
- [ ] Manual testing checklist completed
- [ ] No new console errors or warnings
- [ ] Coverage remains ≥80%
- [ ] Documentation updated (if needed)
- [ ] Breakdown panel matches L-BR-007 requirements
- [ ] All text matches L-CX-002 (Japanese consistency)
