# Happy Path E2E Tests

## Purpose

This directory contains comprehensive end-to-end tests that verify the complete user journey through the household settlement application, from signup to settlement calculation and cleanup.

## Tests

### complete-user-journey.spec.ts

**Category:** L-TA-001 Typical Test Case

**Purpose:** Validates the entire application flow in a single integrated test scenario.

**Test Flow:**

1. **AC-001: User A Signup**
   - Creates new User A account
   - Verifies L-CX-004 (feedback <100ms)
   - Confirms successful authentication

2. **AC-010: Group Creation**
   - Creates household group with 60/40 ratio
   - Validates ratio storage in database
   - Verifies L-CX-004 feedback timing

3. **AC-020: Partner Invitation**
   - User A invites User B
   - User B creates account and accepts invitation
   - Verifies group membership linkage

4. **AC-030: CSV Upload**
   - Uploads valid-transactions.csv (3 transactions)
   - Validates Payer assignment (UserA)
   - Confirms all imported as Household expenses
   - Verifies L-CX-004 feedback timing

5. **AC-035: Manual Transaction**
   - Creates manual transaction via UI
   - Assigns to UserB with Household type
   - Validates database persistence

6. **AC-040: Transaction Type Toggle**
   - Changes manual transaction from Household to Personal
   - Confirms immediate database update

7. **AC-045: Settlement Calculation**
   - Validates L-BR-001 formula: Balance_A = PaidBy_A - (Total × Ratio_A)
   - Expected values:
     - PaidBy_A: ¥24,700 (CSV: ¥8,500 + ¥4,200 + ¥12,000)
     - PaidBy_B: ¥0 (manual entry now Personal, excluded)
     - Total: ¥24,700
     - Ratio_A: 60%
     - Balance_A: ¥9,880 (B pays A)
   - Verifies L-CX-002 currency formatting (¥)

8. **AC-046: Traceability Display**
   - Verifies L-BR-007 breakdown panel
   - Confirms paid-by-a-total, paid-by-b-total display
   - Validates calculation-formula visibility

9. **AC-047: Month Navigation**
   - Tests month selector functionality
   - Validates YYYY-MM format

10. **AC-050: Logout**
    - Logs out User A
    - Confirms redirect to login page

11. **AC-051: Database Cleanup**
    - Verifies data exists before cleanup
    - Executes cleanupTestData for both users
    - Confirms complete removal from database

## Law Compliance

| Law | Description | Verification |
|-----|-------------|--------------|
| L-TA-001 | Typical test case category | Test structure |
| L-BR-001 | Settlement calculation formula | AC-045 |
| L-BR-007 | Traceability requirements | AC-046 |
| L-CX-002 | Currency formatting (¥) | AC-045 |
| L-CX-004 | Feedback immediacy (<100ms) | AC-001, AC-010, AC-035 |

## Expected Execution Time

Total: <60 seconds

- Signup & auth: ~5s
- Group setup: ~3s
- Partner invitation: ~5s
- CSV upload: ~5s
- Manual transaction: ~3s
- Type toggle: ~2s
- Settlement verification: ~3s
- Traceability: ~2s
- Month navigation: ~2s
- Logout: ~2s
- Cleanup: ~3s
- Overhead: ~25s (waits, browser context switches)

## Running the Test

```bash
# Run all happy path tests
npx playwright test e2e/happy-path/

# Run with UI
npx playwright test e2e/happy-path/ --ui

# Run in specific browser
npx playwright test e2e/happy-path/ --project=chromium-unauth

# Debug mode
npx playwright test e2e/happy-path/ --debug
```

## Dependencies

- Database: PostgreSQL with test data isolation
- CSV Fixture: `tests/fixtures/demo-csvs/valid-transactions.csv`
- Helpers:
  - `e2e/utils/test-helpers.ts`: Database operations
  - `e2e/utils/demo-helpers.ts`: Login, group creation

## Notes

- Uses unauthenticated storage state to test from scratch
- Creates unique timestamped emails for isolation
- Cleans up all test data after execution
- Validates both UI state and database state at each step
- Tests L-CX-004 performance requirements for critical user interactions
