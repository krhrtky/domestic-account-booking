# Spec & Acceptance: Comprehensive E2E Demo for Household Settlement Application

## 1. Scope and Non-Goals

### In Scope
- Complete user journey from signup to settlement calculation across all implemented features
- Authentication flows (signup, login, logout, session persistence)
- Group lifecycle (create, invite, join, update ratios)
- Transaction management (manual entry, CSV upload, classification, filtering, pagination)
- Settlement calculation and visualization for different scenarios
- All UI interactions and user feedback mechanisms
- Error handling and validation for all user inputs
- Multi-browser compatibility (Chromium, Firefox, WebKit)

### Non-Goals
- Load/stress testing (deferred to dedicated performance testing phase)
- Mobile device-specific gestures (responsive layout validated but not touch interactions)
- API testing outside of E2E user flows
- Database migration/rollback testing
- Email delivery verification (email integration not yet implemented)
- Accessibility compliance testing (WCAG - separate initiative)
- Internationalization/localization testing

## 2. Test Scenario Outline

### Scenario 1: New User Onboarding & Group Creation
**User Story:** As a first-time user, I want to create an account and set up a household group so I can start tracking expenses.

**Steps:**
1. Navigate to application root (http://localhost:3000)
2. Verify redirect to /login page
3. Click "Sign Up" link
4. Fill signup form with valid data (name, email, password)
5. Submit form and verify redirect to /dashboard
6. Verify welcome message displays user name
7. Navigate to /settings
8. Verify "Create Group" form is displayed (no existing group)
9. Enter group name and set income ratio (e.g., 60/40)
10. Submit group creation form
11. Verify group settings page displays created group
12. Verify ratio sliders show correct values

**Expected Results:**
- User account created in Supabase auth.users
- User profile created in users table
- Group created with user_a_id set
- user_b_id is null
- Ratio values sum to 100

### Scenario 2: Partner Invitation & Group Joining
**User Story:** As a group creator, I want to invite my partner so we can share household expenses.

**Precondition:** User A has created a group from Scenario 1

**Steps:**
1. User A navigates to /settings
2. Verify "Invite Partner" section is visible
3. Enter partner email address
4. Submit invitation form
5. Verify invitation URL is displayed in UI
6. Copy invitation URL
7. Open new incognito browser window
8. Navigate to /signup in incognito window
9. Create User B account with different email
10. Close incognito window and paste invitation URL in new tab
11. Verify User B sees invitation acceptance page
12. Click "Accept Invitation" button
13. Verify redirect to /dashboard
14. Navigate to /settings
15. Verify group shows both User A and User B
16. In User A's browser, refresh /settings
17. Verify User A sees User B has joined

**Expected Results:**
- Invitation record created with valid token
- User B account created independently
- User B's group_id updated to match User A's group
- Group's user_b_id updated to User B's ID
- Both users see identical group settings
- Invitation marked as used (used_at timestamp set)

### Scenario 3: Manual Transaction Entry
**User Story:** As a group member, I want to manually record a transaction when I don't have a CSV file.

**Precondition:** Users A and B are in same group

**Steps:**
1. Login as User A
2. Navigate to /dashboard/transactions
3. Verify transaction list is empty or shows existing data
4. Click "Upload CSV" button
5. Verify CSV upload form is displayed
6. *Note: Manual entry UI not yet implemented - validate via database insert*
7. Use Supabase dashboard or SQL to insert test transaction:
   ```sql
   INSERT INTO transactions (group_id, user_id, date, amount, description, payer_type, expense_type)
   VALUES ('[group-id]', '[user-a-id]', '2025-12-01', 5000, 'Grocery Shopping', 'UserA', 'Household');
   ```
8. Refresh /dashboard/transactions
9. Verify transaction appears in list

**Expected Results:**
- Transaction visible to both User A and User B
- Transaction shows correct payer type badge
- Expense type toggle defaults to "Household"

### Scenario 4: CSV Upload & Transaction Import
**User Story:** As a user, I want to upload my credit card statement CSV so I don't have to enter transactions manually.

**Precondition:** Users A and B are in same group

**Steps:**
1. Login as User A
2. Navigate to /dashboard/transactions/upload
3. Verify CSV upload form displays:
   - File input field
   - Payer type selector (UserA, UserB, Common)
   - Submit button
4. Create test CSV file with content:
   ```csv
   date,description,amount
   2025-12-05,Restaurant Dinner,8500
   2025-12-06,Gas Station,4200
   2025-12-07,Clothing Store,12000
   ```
5. Select file in file input
6. Select "UserA" as payer type
7. Click "Preview" or verify preview displays
8. Verify preview shows first 10 rows of parsed data
9. Click "Upload" button
10. Verify loading state during upload
11. Verify redirect to /dashboard/transactions
12. Verify all 3 transactions appear in list
13. Verify all show "UserA" payer badge
14. Verify all default to "Household" expense type

**Expected Results:**
- CSV parsing uses existing parseCSV function
- All transactions inserted atomically (all-or-nothing)
- source_file_name stores original filename
- uploaded_by references User A's ID
- Transactions visible to both group members

### Scenario 5: Transaction Classification
**User Story:** As a user, I want to mark transactions as personal or household so the settlement calculation is accurate.

**Precondition:** Transactions exist from Scenario 4

**Steps:**
1. Login as User A
2. Navigate to /dashboard/transactions
3. Locate "Clothing Store" transaction
4. Verify expense type shows "Household" (blue/primary color)
5. Click expense type toggle button
6. Verify button shows loading state
7. Verify expense type changes to "Personal" (different color)
8. Click expense type toggle again
9. Verify it toggles back to "Household"
10. Login as User B in different browser
11. Navigate to /dashboard/transactions
12. Verify "Clothing Store" expense type reflects User A's changes

**Expected Results:**
- updateTransactionExpenseType server action called
- Database updated immediately
- UI updates optimistically or after confirmation
- Changes visible to all group members in real-time

### Scenario 6: Transaction Filtering
**User Story:** As a user, I want to filter transactions by month, payer, and type so I can analyze spending patterns.

**Precondition:** Multiple transactions exist across different months, payers, and types

**Steps:**
1. Login as User A
2. Navigate to /dashboard/transactions
3. Verify filter controls display:
   - Month selector
   - Expense type filter (All, Household, Personal)
   - Payer type filter (All, UserA, UserB, Common)
4. Select "December 2025" in month selector
5. Verify only December transactions display
6. Select "Household" in expense type filter
7. Verify only Household transactions display
8. Select "UserA" in payer type filter
9. Verify only UserA Household transactions from December display
10. Reset filters to "All"
11. Verify all transactions reappear

**Expected Results:**
- Filters applied via getTransactions server action
- URL query parameters updated for bookmarkability
- No full page reload (client-side filtering or server action)
- Empty state message if no transactions match filters

### Scenario 7: Transaction Pagination
**User Story:** As a user with many transactions, I want to load them incrementally so the page loads quickly.

**Precondition:** More than 50 transactions exist (pagination limit)

**Steps:**
1. Login as User A
2. Navigate to /dashboard/transactions
3. Verify first 50 transactions load immediately
4. Scroll to bottom of transaction list
5. Verify "Load More" button appears
6. Click "Load More" button
7. Verify loading spinner appears
8. Verify next 50 transactions append to list
9. Verify "Load More" button disappears if no more data
10. Apply a filter (e.g., month)
11. Verify pagination resets to first page
12. Verify "Load More" respects filter criteria

**Expected Results:**
- Cursor-based pagination using transaction ID
- getTransactions returns nextCursor and hasMore
- Smooth infinite scroll experience
- Filter changes reset cursor to beginning

### Scenario 8: Transaction Deletion
**User Story:** As a user, I want to delete incorrect transactions so my records are accurate.

**Precondition:** Transactions exist

**Steps:**
1. Login as User A
2. Navigate to /dashboard/transactions
3. Locate a test transaction
4. Click "Delete" button
5. Verify browser confirmation dialog appears
6. Click "Cancel" in dialog
7. Verify transaction still exists
8. Click "Delete" button again
9. Click "OK" in confirmation dialog
10. Verify transaction is removed from list
11. Refresh page
12. Verify transaction does not reappear

**Expected Results:**
- deleteTransaction server action called
- RLS policy allows deletion only by group members
- Transaction list updates immediately
- Deletion is permanent (soft delete not implemented)

### Scenario 9: Settlement Calculation - Equal Ratio
**User Story:** As a group with 50/50 ratio, I want to see who owes whom based on our household expenses.

**Precondition:** Users A and B in group with 50/50 ratio

**Setup Transactions:**
```sql
-- User A paid 60000 for household
INSERT INTO transactions VALUES (..., 'UserA', '2025-12-01', 30000, 'Rent', 'UserA', 'Household');
INSERT INTO transactions VALUES (..., 'UserA', '2025-12-05', 30000, 'Utilities', 'UserA', 'Household');

-- User B paid 20000 for household
INSERT INTO transactions VALUES (..., 'UserB', '2025-12-10', 20000, 'Groceries', 'UserB', 'Household');

-- Personal expenses (should not affect settlement)
INSERT INTO transactions VALUES (..., 'UserA', '2025-12-15', 10000, 'Hobby', 'UserA', 'Personal');
```

**Steps:**
1. Login as User A
2. Navigate to /dashboard
3. Verify SettlementDashboard component displays
4. Select "December 2025" in month selector
5. Verify settlement summary shows:
   - Total Household Expenses: 80,000
   - User A Paid: 60,000
   - User B Paid: 20,000
   - User A's Fair Share: 40,000 (50%)
   - User B's Fair Share: 40,000 (50%)
   - Settlement: User B owes User A 20,000

**Expected Calculation:**
```
Balance_A = 60000 - (80000 * 0.5) = 60000 - 40000 = 20000
User B owes User A: 20000 yen
```

**Expected Results:**
- Settlement amount calculated per REQUIREMENTS.md formula
- Personal expenses excluded from calculation
- Common payer transactions excluded from individual settlement
- Clear display of who owes whom

### Scenario 10: Settlement Calculation - Unequal Ratio
**User Story:** As a group with 60/40 ratio reflecting income difference, I want settlement to respect our agreed split.

**Precondition:** Users A and B in group with 60/40 ratio (User A pays more)

**Setup Transactions:**
```sql
-- User A paid 30000 for household
INSERT INTO transactions VALUES (..., 'UserA', '2025-12-01', 30000, 'Rent', 'UserA', 'Household');

-- User B paid 50000 for household
INSERT INTO transactions VALUES (..., 'UserB', '2025-12-05', 50000, 'Furniture', 'UserB', 'Household');
```

**Steps:**
1. Login as User A
2. Navigate to /dashboard
3. Select "December 2025"
4. Verify settlement summary shows:
   - Total Household Expenses: 80,000
   - User A Paid: 30,000
   - User B Paid: 50,000
   - User A's Fair Share: 48,000 (60%)
   - User B's Fair Share: 32,000 (40%)
   - Settlement: User A owes User B 18,000

**Expected Calculation:**
```
Balance_A = 30000 - (80000 * 0.6) = 30000 - 48000 = -18000
User A owes User B: 18000 yen
```

**Expected Results:**
- Calculation respects custom ratio
- Reverse payment direction when higher earner underpays

### Scenario 11: Settlement with Common Account
**User Story:** As a group using a shared account, I want common account expenses to be handled correctly.

**Precondition:** Users A and B in group with 50/50 ratio

**Setup Transactions:**
```sql
-- User A paid 40000 for household
INSERT INTO transactions VALUES (..., 'UserA', '2025-12-01', 40000, 'Rent', 'UserA', 'Household');

-- Common account paid 20000 for household
INSERT INTO transactions VALUES (..., 'Common', '2025-12-05', 20000, 'Utilities', 'Common', 'Household');
```

**Steps:**
1. Login as User A
2. Navigate to /dashboard
3. Select "December 2025"
4. Verify settlement calculation
5. Verify Common transactions are displayed but excluded from individual settlement

**Expected Calculation (per REQUIREMENTS.md):**
```
Only count UserA and UserB payer types for settlement:
Balance_A = 40000 - (40000 * 0.5) = 40000 - 20000 = 20000
User B owes User A: 20000 yen

Note: Common account's 20000 is already from shared pool, not part of individual settlement
```

**Expected Results:**
- Common transactions visible in list
- Common transactions excluded from Balance_A/Balance_B calculation
- Total household shows all types, but settlement only uses UserA/UserB payers

### Scenario 12: Ratio Update Impact
**User Story:** As a group, we want to update our income ratio when one person's salary changes.

**Precondition:** Users A and B in group with existing transactions

**Steps:**
1. Login as User A
2. Navigate to /settings
3. Note current settlement amount on /dashboard
4. Return to /settings
5. Drag ratio slider from 50/50 to 70/30
6. Verify complementary ratio updates automatically
7. Click "Save" button
8. Verify success message
9. Navigate to /dashboard
10. Verify settlement amount recalculates based on new ratio
11. Login as User B in different browser
12. Navigate to /settings
13. Verify ratio shows 70/30
14. Navigate to /dashboard
15. Verify settlement matches User A's view (opposite direction)

**Expected Results:**
- updateRatio server action validates sum = 100
- All future and historical settlements use new ratio
- Both users see consistent data after update

### Scenario 13: Logout & Session Persistence
**User Story:** As a user, I want my session to persist across page reloads but clear when I logout.

**Steps:**
1. Login as User A
2. Navigate to /dashboard
3. Refresh browser
4. Verify still logged in and on /dashboard
5. Close browser and reopen
6. Navigate to http://localhost:3000
7. Verify redirect to /dashboard (session persisted)
8. Click "Logout" button (if exists in UI) or navigate to logout action
9. Verify redirect to /login
10. Try to access /dashboard directly
11. Verify redirect to /login

**Expected Results:**
- Supabase SSR cookies maintain session
- Middleware enforces authentication on protected routes
- Logout clears session cookies
- Unauthenticated access denied

### Scenario 14: Error Handling - Validation Errors
**User Story:** As a user, I want clear error messages when I make mistakes.

**Test Cases:**
1. **Signup with existing email**
   - Attempt signup with duplicate email
   - Verify error message: "User already exists"

2. **Signup with invalid email**
   - Enter "notanemail" in email field
   - Verify HTML5 validation prevents submission

3. **Signup with short password**
   - Enter "short" in password field (< 8 chars)
   - Verify validation error

4. **Login with wrong password**
   - Enter correct email, wrong password
   - Verify error dialog/alert

5. **CSV upload with invalid format**
   - Upload CSV without required columns
   - Verify error message lists missing columns

6. **CSV upload exceeding size limit**
   - Attempt upload of 6MB file
   - Verify error: "File size must be less than 5MB"

7. **Ratio update with invalid sum**
   - Manually attempt to set ratios to 60/50 (sum 110)
   - Verify validation prevents submission

8. **Expired invitation token**
   - Manually set invitation expires_at to past
   - Attempt to accept invitation
   - Verify error: "Invitation expired"

**Expected Results:**
- All errors display user-friendly messages
- Validation happens both client and server-side
- Zod schema errors translated to readable format

### Scenario 15: Edge Cases & Data Boundaries
**User Story:** As QA, I want to verify the system handles edge cases gracefully.

**Test Cases:**
1. **Zero transactions**
   - New group with no transactions
   - Dashboard shows 0 settlement

2. **Exactly equal contributions**
   - UserA: 50000, UserB: 50000, 50/50 ratio
   - Settlement: 0 (neither owes)

3. **Single transaction**
   - Only UserA paid 10000
   - UserB owes UserA 5000 (50/50)

4. **Negative amounts** (should be prevented)
   - Attempt CSV with -5000 amount
   - Verify validation error

5. **Very large amounts**
   - Transaction with amount 999999999
   - Verify displays correctly (no overflow)

6. **Future dates**
   - Transaction dated 2099-12-31
   - Verify accepted but filterable by month

7. **Very long descriptions**
   - Description with 500 characters (max)
   - Verify truncation in UI if needed

8. **Special characters in description**
   - Description: "Café & Restaurant (50% off!)"
   - Verify no XSS or encoding issues

9. **Concurrent updates**
   - Two users toggle same transaction simultaneously
   - Verify last write wins or conflict resolution

10. **Empty group (no UserB)**
    - Settlement calculation with only UserA
    - Verify graceful handling (no division by zero)

**Expected Results:**
- All edge cases handled without crashes
- Clear error messages for invalid inputs
- Database constraints prevent invalid states

## 3. Acceptance Criteria Checklist

### Authentication (Epic 1)
- [ ] User can sign up with name, email, password (min 8 chars)
- [ ] Duplicate email shows error
- [ ] User can log in with email and password
- [ ] Invalid credentials show error message
- [ ] Session persists across page reloads
- [ ] Logout clears session and redirects to /login
- [ ] Unauthenticated users redirected from protected routes
- [ ] Authenticated users redirected from /login and /signup to /dashboard

### Group Management (Epic 1)
- [ ] User can create household group with custom name
- [ ] Group defaults to 50/50 ratio
- [ ] User can set custom ratio (e.g., 60/40)
- [ ] Ratio sliders update complementary value automatically
- [ ] Ratio sum must equal 100 (validation)
- [ ] User can invite partner via email
- [ ] Invitation generates unique URL with token
- [ ] Invitation URL displayed in UI (email sending not implemented)
- [ ] Partner can accept invitation via URL
- [ ] Accepted invitation updates both users' group_id
- [ ] Invitation marked as used after acceptance
- [ ] Expired invitations rejected (expires_at check)
- [ ] User cannot join second group while in first
- [ ] Both group members see identical group settings
- [ ] Ratio updates reflect immediately for all members

### Transaction Management (Epic 2)
- [ ] User can upload CSV file (max 5MB)
- [ ] CSV parsed using existing parseCSV function
- [ ] User selects payer type: UserA, UserB, or Common
- [ ] Preview shows first 10 rows of parsed data
- [ ] All transactions inserted atomically (all-or-nothing)
- [ ] Transactions default to "Household" expense type
- [ ] User can view transaction list
- [ ] User can toggle expense type between Household and Personal
- [ ] Expense type changes visible to all group members
- [ ] User can delete transactions with confirmation
- [ ] Deleted transactions removed permanently
- [ ] Only group members can view/edit group transactions (RLS)

### Transaction Filtering (P1 Priority)
- [ ] User can filter by month (YYYY-MM format)
- [ ] User can filter by expense type (All, Household, Personal)
- [ ] User can filter by payer type (All, UserA, UserB, Common)
- [ ] Multiple filters applied simultaneously
- [ ] Filter changes reflected in URL query parameters
- [ ] Filters reset when navigating to /upload and back
- [ ] Empty state shown when no transactions match filters

### Transaction Pagination (P1 Priority)
- [ ] First 50 transactions load on page load
- [ ] "Load More" button appears when hasMore = true
- [ ] Clicking "Load More" appends next 50 transactions
- [ ] Loading spinner shown during pagination
- [ ] nextCursor used for cursor-based pagination
- [ ] "Load More" button hidden when hasMore = false
- [ ] Pagination respects active filters
- [ ] Filter change resets pagination to first page

### Settlement Calculation (Epic 3)
- [ ] Dashboard displays settlement summary
- [ ] User can select target month for calculation
- [ ] Total household expenses calculated correctly
- [ ] Personal expenses excluded from settlement
- [ ] Common account expenses excluded from individual settlement
- [ ] User A's paid amount summed correctly
- [ ] User B's paid amount summed correctly
- [ ] Settlement uses formula: Balance_A = PaidBy_A^Household - (Total * Ratio_A)
- [ ] Positive balance: User B owes User A
- [ ] Negative balance: User A owes User B
- [ ] Zero balance: No payment required
- [ ] Settlement respects custom ratios (60/40, 70/30, etc.)
- [ ] Settlement updates when ratio changes
- [ ] Settlement updates when transactions added/removed
- [ ] Settlement updates when expense types toggled

### UI/UX
- [ ] Mobile-first responsive design (tested at 375px width)
- [ ] Loading states shown during async operations
- [ ] Success messages shown after mutations
- [ ] Error messages displayed clearly
- [ ] Forms validate inputs before submission
- [ ] Buttons disabled during loading
- [ ] Confirmation dialogs for destructive actions
- [ ] Navigation links work correctly
- [ ] Back button navigation works as expected

### Security
- [ ] RLS policies enforce group-based access control
- [ ] User can only see their own group's data
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (React escaping + validation)
- [ ] CSRF protection (Next.js default)
- [ ] File upload size limited to 5MB
- [ ] File type validated (CSV only)
- [ ] Passwords hashed (Supabase Auth handles)
- [ ] Session tokens HTTP-only cookies
- [ ] No sensitive data in client-side logs

### Performance
- [ ] Transaction list loads in < 2 seconds (50 items)
- [ ] CSV upload completes in < 5 seconds (100 rows)
- [ ] Settlement calculation completes in < 1 second
- [ ] Page navigation feels instant (client-side routing)
- [ ] No unnecessary re-renders (React optimization)

### Multi-browser Compatibility
- [ ] All scenarios pass on Chromium
- [ ] All scenarios pass on Firefox
- [ ] All scenarios pass on WebKit (Safari)
- [ ] No browser-specific bugs
- [ ] Consistent rendering across browsers

### E2E Test Infrastructure
- [ ] Playwright configured with all 3 browsers
- [ ] Test helpers create/cleanup test users
- [ ] Tests run in isolation (no shared state)
- [ ] Tests clean up data after execution
- [ ] CI/CD pipeline runs E2E tests on PR
- [ ] Test reports generated and stored as artifacts
- [ ] Flaky test retry logic configured (2 retries in CI)

## 4. Data Setup Requirements

### Test Users
Create two test user accounts with different roles:

**User A (Primary/Creator):**
- Email: `tester-a-{timestamp}@example.com`
- Password: `TestPassword123!`
- Name: `Test User A`
- Role: Group creator, primary test actor

**User B (Partner):**
- Email: `tester-b-{timestamp}@example.com`
- Password: `TestPassword123!`
- Name: `Test User B`
- Role: Invited partner, secondary test actor

### Test Groups
**Group 1 (Equal Split):**
- Name: `Test Household Equal`
- User A: tester-a
- User B: tester-b
- Ratio: 50/50

**Group 2 (Unequal Split):**
- Name: `Test Household 60-40`
- User A: tester-a
- User B: tester-b
- Ratio: 60/40

### Test Transactions
Create diverse transaction dataset covering all scenarios:

```typescript
const testTransactions = [
  // December 2025 - UserA Household
  { date: '2025-12-01', amount: 150000, description: 'Rent Payment', payer: 'UserA', type: 'Household' },
  { date: '2025-12-05', amount: 8500, description: 'Grocery Shopping', payer: 'UserA', type: 'Household' },
  { date: '2025-12-10', amount: 3200, description: 'Utility Bill', payer: 'UserA', type: 'Household' },
  
  // December 2025 - UserB Household
  { date: '2025-12-03', amount: 12000, description: 'Internet/Phone', payer: 'UserB', type: 'Household' },
  { date: '2025-12-15', amount: 25000, description: 'Furniture Purchase', payer: 'UserB', type: 'Household' },
  
  // December 2025 - Common Household
  { date: '2025-12-20', amount: 5000, description: 'Shared Account - Gas', payer: 'Common', type: 'Household' },
  
  // December 2025 - Personal (excluded from settlement)
  { date: '2025-12-07', amount: 15000, description: 'Personal Hobby Supplies', payer: 'UserA', type: 'Personal' },
  { date: '2025-12-12', amount: 8000, description: 'Personal Gym Membership', payer: 'UserB', type: 'Personal' },
  
  // November 2025 - For filter testing
  { date: '2025-11-25', amount: 145000, description: 'November Rent', payer: 'UserA', type: 'Household' },
  { date: '2025-11-28', amount: 6500, description: 'November Groceries', payer: 'UserB', type: 'Household' },
  
  // January 2026 - Future dates
  { date: '2026-01-05', amount: 150000, description: 'January Rent Prepay', payer: 'UserA', type: 'Household' },
  
  // Edge case amounts
  { date: '2025-12-25', amount: 50, description: 'Small Purchase', payer: 'UserA', type: 'Household' },
  { date: '2025-12-26', amount: 999999, description: 'Large Investment', payer: 'UserB', type: 'Household' },
]
```

### CSV Test Files
Prepare test CSV files for upload scenarios:

**valid-transactions.csv** (Standard format)
```csv
date,description,amount
2025-12-01,Restaurant Dinner,8500
2025-12-02,Gas Station,4200
2025-12-03,Supermarket,12000
```

**large-dataset.csv** (100+ rows for pagination testing)
```csv
date,description,amount
2025-12-01,Transaction 001,1000
2025-12-01,Transaction 002,1500
...
2025-12-31,Transaction 100,5000
```

**invalid-missing-columns.csv** (Error case)
```csv
date,amount
2025-12-01,5000
```

**invalid-bad-date.csv** (Error case)
```csv
date,description,amount
not-a-date,Invalid Transaction,5000
```

**special-characters.csv** (XSS/encoding test)
```csv
date,description,amount
2025-12-01,"Café & Restaurant (50% off!)",3500
2025-12-02,"<script>alert('XSS')</script>",1000
```

### Database Seed Script
```sql
-- Run after migrations to create test data
-- Assumes test users created via Supabase Auth

-- Insert test group
INSERT INTO groups (id, name, ratio_a, ratio_b, user_a_id, user_b_id)
VALUES (
  'test-group-uuid',
  'Test Household',
  50,
  50,
  '[user-a-uuid]',
  '[user-b-uuid]'
);

-- Update users' group_id
UPDATE users SET group_id = 'test-group-uuid' WHERE id IN ('[user-a-uuid]', '[user-b-uuid]');

-- Insert test transactions (see testTransactions array above)
```

## 5. Non-Functional Requirements

### Performance
- **Page Load Time:** < 2 seconds for initial page load
- **Transaction List Rendering:** < 1 second for 50 items
- **CSV Upload Processing:** < 5 seconds for 100 rows
- **Settlement Calculation:** < 500ms for 1000 transactions
- **Filter Application:** < 500ms response time
- **API Response Time:** < 1 second for 95th percentile

### Reliability
- **Test Pass Rate:** > 95% (allowing for environmental flakiness)
- **Test Retry Success:** < 5% tests require retry
- **Data Consistency:** 100% transactional integrity (atomicity)
- **Session Stability:** 0 unexpected logouts during normal operation
- **RLS Policy Enforcement:** 100% data isolation between groups

### Scalability (for E2E tests)
- **Concurrent Test Execution:** Up to 4 parallel workers in CI
- **Test Execution Time:** < 10 minutes for full suite
- **Test Data Cleanup:** 100% cleanup success rate
- **Database Connection Pooling:** No connection exhaustion

### Maintainability
- **Test Code Coverage:** E2E tests cover all user-facing features
- **Test Documentation:** Each test scenario has clear description
- **Test Naming:** Follows convention: `should [expected behavior] when [condition]`
- **Test Organization:** Grouped by feature (auth, group, transactions, settlement)
- **Shared Utilities:** DRY principle for user creation, cleanup, navigation

### Security (E2E specific)
- **Test User Isolation:** Each test run uses unique email addresses
- **Service Role Key:** Stored in environment variables, not hardcoded
- **Test Data Cleanup:** No test data leaks to production database
- **Sensitive Data Handling:** No real emails or payment info in tests

### Compatibility
- **Browser Coverage:** Chromium, Firefox, WebKit
- **Node.js Version:** 20+ (specified in package.json engines)
- **Playwright Version:** Latest stable (1.57.0+)
- **Operating Systems:** macOS, Linux, Windows (via CI matrix)

### Observability
- **Screenshot on Failure:** Automatically captured for debugging
- **Trace Recording:** Enabled on first retry for detailed analysis
- **HTML Test Report:** Generated after each run
- **Console Logs:** Captured for failed tests
- **Network Logs:** Available via Playwright trace viewer

## 6. Architecture Notes: E2E Testing Approach

### Framework Selection
**Playwright** selected over Cypress/Selenium for:
- Native multi-browser support (Chromium, Firefox, WebKit)
- Excellent TypeScript support
- Auto-waiting and retry logic built-in
- Modern async/await API
- Powerful debugging tools (trace viewer, inspector)
- CI-friendly architecture

### Test Structure
```
e2e/
├── auth/
│   ├── login.spec.ts
│   ├── signup.spec.ts
│   └── logout.spec.ts
├── group/
│   ├── create-group.spec.ts
│   ├── invite-partner.spec.ts
│   └── update-ratio.spec.ts
├── transactions/
│   ├── csv-upload.spec.ts
│   ├── classification.spec.ts
│   ├── filtering.spec.ts
│   ├── pagination.spec.ts
│   └── deletion.spec.ts
├── settlement/
│   ├── dashboard.spec.ts
│   ├── equal-split.spec.ts
│   ├── unequal-split.spec.ts
│   └── edge-cases.spec.ts
├── integration/
│   └── full-user-journey.spec.ts
└── utils/
    ├── test-helpers.ts
    ├── fixtures.ts
    └── matchers.ts
```

### Test Isolation Strategy
1. **Database Cleanup:** afterEach/afterAll hooks delete test users and associated data
2. **Unique Identifiers:** Email addresses use timestamp + random string
3. **Independent Tests:** No shared state between tests
4. **Parallel Execution:** Tests run in parallel via Playwright workers (disabled in CI for Supabase rate limits)

### Authentication Patterns
```typescript
// Pattern 1: Login via UI (for auth tests)
await page.goto('/login')
await page.fill('input[name="email"]', testUser.email)
await page.fill('input[name="password"]', testUser.password)
await page.click('button[type="submit"]')
await expect(page).toHaveURL('/dashboard')

// Pattern 2: API-based login (for non-auth tests)
// Create user via Supabase Admin API in beforeAll
// Use UI login once, then reuse session across tests in worker
```

### Data Setup Approach
**Hybrid Strategy:**
- **API-based:** User creation/deletion via Supabase Admin API (fast, reliable)
- **UI-based:** Group creation, transaction upload (validates full UX)
- **SQL-based:** Bulk transaction inserts for pagination tests (performance)

### Assertion Patterns
```typescript
// URL assertions
await expect(page).toHaveURL('/expected-path')

// Text presence
await expect(page.getByText('Expected Text')).toBeVisible()

// Form state
await expect(page.locator('button[type="submit"]')).toBeDisabled()

// Data-driven assertions
const settlementAmount = await page.locator('[data-testid="settlement-amount"]').textContent()
expect(parseFloat(settlementAmount)).toBe(20000)
```

### Error Handling Strategy
```typescript
// Expect errors in controlled scenarios
test('should show error for invalid login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'wrong@example.com')
  await page.fill('input[name="password"]', 'wrongpassword')
  
  const dialogPromise = page.waitForEvent('dialog')
  await page.click('button[type="submit"]')
  
  const dialog = await dialogPromise
  expect(dialog.message()).toContain('Invalid credentials')
  await dialog.accept()
})
```

### CI/CD Integration
**GitHub Actions Workflow:**
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps chromium firefox webkit
      - run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Debugging Workflow
```bash
# Run specific test with debug inspector
npm run test:e2e:debug -- e2e/auth/login.spec.ts

# Run with UI mode for interactive debugging
npm run test:e2e:ui

# View trace for failed test
npx playwright show-trace playwright-report/trace.zip
```

### Best Practices
1. **Use data-testid attributes** for stable selectors (not implemented yet - future enhancement)
2. **Avoid hard-coded waits** - use Playwright's auto-waiting
3. **Test user journeys, not implementation** - focus on business flows
4. **Keep tests independent** - no test should depend on another's side effects
5. **Mock external APIs** - isolate from email services, payment gateways (when integrated)
6. **Version lock browsers** - consistent browser versions in CI via Playwright install

### Known Limitations
1. **Email verification:** Cannot test email delivery (Supabase sends, but not verified in E2E)
2. **Rate limiting:** Tests may hit Supabase rate limits if run too frequently
3. **Real-time subscriptions:** Not tested (if implemented in future)
4. **Mobile gestures:** Only responsive layout validated, not touch events
5. **Accessibility:** ARIA attributes not comprehensively tested (separate audit needed)

### Metrics & Reporting
- **Test Duration:** Track per-test execution time
- **Flakiness Rate:** Monitor retry frequency
- **Coverage:** Map tests to acceptance criteria
- **Pass Rate:** Track across browsers and environments
- **Screenshot Artifacts:** Store for visual regression detection

---

## Appendix: Test Execution Checklist

### Pre-run Setup
- [ ] Supabase project running and accessible
- [ ] Environment variables set in .env.local
- [ ] Playwright browsers installed (npx playwright install)
- [ ] Database migrations applied
- [ ] Dev server running (or auto-start configured)

### Post-run Validation
- [ ] All tests passed or documented failures
- [ ] Test data cleaned up (verify in Supabase dashboard)
- [ ] No error logs in console
- [ ] Screenshots/traces reviewed for failures
- [ ] HTML report generated and archived

### Blocking Issues Workflow
1. Test fails → Capture screenshot/trace
2. Reproduce locally with --debug
3. Check if implementation bug or test bug
4. Document in issue tracker with reproduction steps
5. Mark test as `.skip()` with TODO comment if blocking
6. Create acceptance criteria update if needed

---

**Document Status:** DRAFT for Review
**Next Steps:** Review with QGA, validate against implementation, execute test run
**Owner:** Product Agent
**Last Updated:** 2025-12-07
