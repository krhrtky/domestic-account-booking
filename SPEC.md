# Technical Specification: Household Settlement MVP (Phase 1)

**Version:** 1.0  
**Date:** 2025-12-07  
**Status:** Draft for Implementation

---

## 1. Scope & Non-Goals

### 1.1 In Scope (MVP Phase 1)

**Epic 1: User & Group Management**
- User registration and authentication
- Partner invitation mechanism (email-based)
- Single household group per user pair
- Configurable income ratio (default 50:50)

**Epic 2: CSV Data Ingestion**
- CSV file upload interface
- Payer type selection (User A / User B / Common)
- CSV parsing with basic validation
- Transaction persistence to database

**Epic 3: Transaction Classification**
- Transaction list view with filtering by month
- Manual toggle: Household vs Personal expense type
- Transaction deletion/exclusion capability
- Default classification (all imports default to Household)

**Epic 4: Settlement Calculation & Display**
- Monthly settlement calculation using simplified logic
- Dashboard showing who owes whom and how much
- Breakdown display: total household expenses, individual payments, balance

### 1.2 Explicitly Out of Scope (Phase 1)

- API integration with banks/credit cards (CSV only)
- Automatic transaction categorization (ML/AI)
- Settlement status tracking (paid/unpaid)
- Multi-currency support (JPY only)
- Receipt image upload
- Historical trend analysis
- Budget planning features
- Common account balance tracking (calculation assumes Common payments are already settled)
- Complex shared expense allocation (per-item ratio splits)

---

## 2. Constraints

### 2.1 Technical Constraints

**Performance**
- Page load time: < 2s on 4G mobile connection
- CSV parsing: support files up to 10,000 rows
- Transaction list rendering: virtualization required for >500 items

**Browser Support**
- Modern browsers only (Chrome/Safari/Firefox latest 2 versions)
- Mobile-first responsive design (320px minimum width)

**Data Retention**
- Transactions retained indefinitely unless user-deleted
- CSV source files not stored (parsed data only)

**Security**
- All API endpoints require authentication
- CSV upload limited to 5MB per file
- Rate limiting: 10 requests/minute per user for upload endpoints

### 2.2 Business Constraints

**User Model**
- Exactly 2 users per household group (no multi-partner households in MVP)
- Income ratio must sum to 100% (validation enforced)
- Ratio precision: integer percentages (e.g., 60:40, not 60.5:39.5)

**Transaction Model**
- Date range: 2020-01-01 to current date + 1 year
- Amount precision: integer yen (no decimal cents)
- Description length: max 200 characters

**Settlement Calculation**
- Monthly granularity only (no weekly/quarterly views)
- Timezone: JST (Asia/Tokyo) for date boundaries

---

## 3. API & Data Model

### 3.1 Database Schema

```sql
-- Users table (leverages Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  group_id UUID REFERENCES groups,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Household',
  ratio_a INTEGER NOT NULL DEFAULT 50 CHECK (ratio_a > 0 AND ratio_a < 100),
  ratio_b INTEGER NOT NULL DEFAULT 50 CHECK (ratio_b > 0 AND ratio_b < 100),
  user_a_id UUID NOT NULL REFERENCES users(id),
  user_b_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ratio_sum CHECK (ratio_a + ratio_b = 100)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL CHECK (length(description) <= 200),
  payer_type TEXT NOT NULL CHECK (payer_type IN ('UserA', 'UserB', 'Common')),
  expense_type TEXT NOT NULL DEFAULT 'Household' CHECK (expense_type IN ('Household', 'Personal')),
  source_file_name TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_group_date ON transactions(group_id, date DESC);
CREATE INDEX idx_transactions_expense_type ON transactions(group_id, expense_type);
CREATE INDEX idx_users_group ON users(group_id);
```

### 3.2 API Endpoints (Next.js Server Actions)

**Authentication (Supabase Auth)**
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

**Group Management**
- `POST /api/groups/create` - Create household group
  - Input: `{ name: string, ratio_a: number, ratio_b: number }`
  - Output: `{ group_id: UUID }`
- `POST /api/groups/invite` - Invite partner by email
  - Input: `{ email: string }`
  - Output: `{ invitation_sent: boolean }`
- `GET /api/groups/current` - Get current user's group
  - Output: `{ id, name, ratio_a, ratio_b, user_a, user_b }`
- `PATCH /api/groups/ratio` - Update income ratio
  - Input: `{ ratio_a: number, ratio_b: number }`

**Transaction Management**
- `POST /api/transactions/upload` - CSV upload
  - Input: `FormData { file: File, payer_type: 'UserA' | 'UserB' | 'Common' }`
  - Output: `{ imported_count: number, errors: string[] }`
- `GET /api/transactions/list` - List transactions
  - Query: `?month=2025-01&expense_type=Household`
  - Output: `{ transactions: Transaction[], total: number }`
- `PATCH /api/transactions/:id/classify` - Update expense type
  - Input: `{ expense_type: 'Household' | 'Personal' }`
- `DELETE /api/transactions/:id` - Delete transaction

**Settlement Calculation**
- `GET /api/settlement/calculate` - Calculate monthly settlement
  - Query: `?month=2025-01`
  - Output: `Settlement` (schema below)

### 3.3 Key Data Types (TypeScript)

```typescript
type PayerType = 'UserA' | 'UserB' | 'Common';
type ExpenseType = 'Household' | 'Personal';

interface Transaction {
  id: string;
  group_id: string;
  date: string; // ISO date YYYY-MM-DD
  amount: number;
  description: string;
  payer_type: PayerType;
  expense_type: ExpenseType;
  source_file_name?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

interface Group {
  id: string;
  name: string;
  ratio_a: number;
  ratio_b: number;
  user_a_id: string;
  user_b_id?: string;
  created_at: string;
  updated_at: string;
}

interface Settlement {
  month: string; // YYYY-MM
  total_household: number;
  paid_by_a_household: number;
  paid_by_b_household: number;
  paid_by_common: number;
  balance_a: number; // positive = A receives, negative = A pays
  ratio_a: number;
  ratio_b: number;
}
```

### 3.4 CSV Format Specification

Supported formats (parser must auto-detect):

**Format 1: Generic Bank Statement**
```csv
Date,Description,Amount,Balance
2025-01-15,Supermarket XYZ,5400,
2025-01-16,Coffee Shop,-450,
```

**Format 2: Credit Card Statement**
```csv
利用日,利用店名・商品名,利用金額
2025/01/15,スーパーXYZ,5400
2025/01/16,カフェ,-450
```

**Parser Requirements**
- Detect column headers (date, description, amount) by pattern matching
- Support date formats: `YYYY-MM-DD`, `YYYY/MM/DD`, `MM/DD/YYYY`
- Handle negative amounts as expenses (some CSVs use `-` for withdrawals)
- Skip header rows and empty rows
- Fail gracefully with detailed error messages

---

## 4. Settlement Logic (Business Rules)

### 4.1 Simplified Formula (Phase 1)

Given a target month (e.g., 2025-01):

**Step 1: Filter Household Expenses**
```typescript
const householdTransactions = transactions.filter(
  t => t.expense_type === 'Household' && 
       t.date.startsWith(targetMonth)
);
```

**Step 2: Aggregate by Payer**
```typescript
const paidByA = householdTransactions
  .filter(t => t.payer_type === 'UserA')
  .reduce((sum, t) => sum + t.amount, 0);

const paidByB = householdTransactions
  .filter(t => t.payer_type === 'UserB')
  .reduce((sum, t) => sum + t.amount, 0);

const paidByCommon = householdTransactions
  .filter(t => t.payer_type === 'Common')
  .reduce((sum, t) => sum + t.amount, 0);
```

**Step 3: Calculate Total Household Expenses**
```typescript
const totalHousehold = paidByA + paidByB;
// Note: paidByCommon is excluded from settlement calculation
```

**Step 4: Calculate Balance**
```typescript
const ratioA = group.ratio_a / 100; // e.g., 0.6
const balanceA = paidByA - (totalHousehold * ratioA);
```

**Step 5: Interpret Result**
- If `balanceA > 0`: User B owes User A `balanceA` yen
- If `balanceA < 0`: User A owes User B `|balanceA|` yen
- If `balanceA === 0`: No settlement needed

### 4.2 Edge Cases

**Case 1: No Household Expenses**
- Result: `balanceA = 0`, display "No settlement needed for this month"

**Case 2: Only Common Account Payments**
- Result: `balanceA = 0`, Common payments don't affect individual settlement

**Case 3: One User Paid Everything**
- Example: `paidByA = 100000`, `paidByB = 0`, `ratioA = 0.6`
- Result: `balanceA = 100000 - 60000 = 40000` (B owes A 40,000 yen)

**Case 4: Personal Expenses Mixed In**
- Personal expenses are filtered out before calculation
- No impact on settlement

---

## 5. Non-Functional Requirements

### 5.1 Performance Targets

**SLO (Service Level Objectives)**
- P95 page load time: < 2 seconds
- CSV upload processing: < 5 seconds for 1000 rows
- Settlement calculation: < 500ms for 12 months of data
- Database query response: < 100ms (with proper indexing)

**Scalability (Phase 1)**
- Support up to 100 concurrent users
- Max 50,000 transactions per group
- Max 100 groups total

### 5.2 Security Requirements

**Authentication**
- Email + password with Supabase Auth
- Email verification required before group creation
- Session timeout: 7 days

**Authorization**
- Row-Level Security (RLS) policies:
  - Users can only read/write their own group's data
  - Group members can view all transactions in their group
  - Only group creators can invite partners

**Data Privacy**
- CSV files not stored server-side (parse and discard)
- Transaction descriptions stored as-is (no sanitization that loses data)
- No transaction data shared between groups

**Input Validation**
- All API inputs validated with Zod schemas
- CSV upload: antivirus scan (if Vercel supports), file type check
- XSS prevention: sanitize transaction descriptions on display

### 5.3 Operability

**Monitoring**
- Error tracking: Sentry or similar
- Metrics: Vercel Analytics for page views, API response times
- Alerts: notify on failed CSV uploads, DB connection errors

**Backup & Recovery**
- Supabase automatic daily backups
- Point-in-time recovery window: 7 days

**Deployment**
- Zero-downtime deployments via Vercel
- Rollback capability within 5 minutes
- Environment: staging + production

---

## 6. Acceptance Criteria Checklist

### Epic 1: User & Group Management

**AC-1.1 User Registration**
- [ ] User can sign up with email and password
- [ ] Email verification required before access
- [ ] User profile created in `users` table with `name` and `email`
- [ ] Error shown for duplicate email

**AC-1.2 Group Creation**
- [ ] Authenticated user can create a household group
- [ ] Group defaults to 50:50 ratio if not specified
- [ ] User is assigned as `user_a_id` in the group
- [ ] User cannot create multiple groups (1 group per user)

**AC-1.3 Partner Invitation**
- [ ] User can invite partner via email input
- [ ] Invitation email sent with signup/join link
- [ ] Partner joins as `user_b_id` in existing group
- [ ] Error shown if partner email already in another group

**AC-1.4 Ratio Configuration**
- [ ] Group creator can update `ratio_a` and `ratio_b`
- [ ] Validation enforces `ratio_a + ratio_b = 100`
- [ ] Both users can view the current ratio
- [ ] Ratio change updates `updated_at` timestamp

---

### Epic 2: CSV Data Ingestion

**AC-2.1 CSV Upload Interface**
- [ ] User sees file upload button on dashboard
- [ ] User selects payer type via dropdown: User A / User B / Common
- [ ] File size validation: max 5MB, error shown on exceed
- [ ] Supported formats: `.csv` only (reject other file types)

**AC-2.2 CSV Parsing**
- [ ] Parser detects date column (formats: YYYY-MM-DD, YYYY/MM/DD)
- [ ] Parser detects amount column (handles negative values)
- [ ] Parser detects description column
- [ ] Parser skips header rows and empty rows
- [ ] Detailed error message for unparseable files

**AC-2.3 Transaction Persistence**
- [ ] Parsed transactions inserted into `transactions` table
- [ ] Each transaction linked to `group_id`
- [ ] `payer_type` set from user's selection
- [ ] `expense_type` defaults to `Household`
- [ ] `source_file_name` stored for reference

**AC-2.4 Upload Feedback**
- [ ] Success message: "X transactions imported"
- [ ] Error summary: "Y rows failed: [reasons]"
- [ ] Transaction list auto-refreshes after upload

---

### Epic 3: Transaction Classification

**AC-3.1 Transaction List View**
- [ ] Transactions displayed in table: Date | Description | Amount | Payer | Type
- [ ] Filter by month (dropdown or date picker)
- [ ] Filter by expense type: All / Household / Personal
- [ ] Sort by date (newest first by default)
- [ ] Pagination or infinite scroll for >100 items

**AC-3.2 Expense Type Toggle**
- [ ] Each transaction row has toggle: Household <-> Personal
- [ ] Toggle updates `expense_type` via API
- [ ] Visual feedback on toggle (loading spinner, then updated state)
- [ ] Error handling: revert toggle on API failure

**AC-3.3 Transaction Deletion**
- [ ] Each transaction row has delete button (trash icon)
- [ ] Confirmation dialog: "Delete this transaction?"
- [ ] Successful deletion removes row from list
- [ ] Deleted transactions excluded from settlement calculation

**AC-3.4 Bulk Operations (Optional for MVP)**
- [ ] Select multiple transactions (checkboxes)
- [ ] Bulk toggle to Household or Personal
- [ ] Bulk delete with confirmation

---

### Epic 4: Settlement Calculation & Display

**AC-4.1 Settlement Dashboard**
- [ ] User selects target month (default: current month)
- [ ] Dashboard displays:
  - [ ] Total household expenses
  - [ ] Amount paid by User A (Household only)
  - [ ] Amount paid by User B (Household only)
  - [ ] Amount paid by Common account (informational)
  - [ ] Current income ratio (A:B)
  - [ ] Final settlement: "B owes A: ¥X" or "A owes B: ¥X"

**AC-4.2 Settlement Logic Correctness**
- [ ] Test Case 1: A paid 60k, B paid 40k, ratio 50:50
  - Expected: Balance = 0 (no settlement)
- [ ] Test Case 2: A paid 80k, B paid 20k, ratio 60:40
  - Expected: `balanceA = 80000 - (100000 * 0.6) = 20000` (B owes A 20k)
- [ ] Test Case 3: A paid 30k, B paid 70k, ratio 50:50
  - Expected: `balanceA = 30000 - 50000 = -20000` (A owes B 20k)
- [ ] Test Case 4: Only Common account payments
  - Expected: `balanceA = 0`
- [ ] Test Case 5: Mixed Personal and Household
  - Expected: Personal expenses excluded from calculation

**AC-4.3 Edge Cases**
- [ ] No transactions in selected month: display "No data"
- [ ] All transactions are Personal: display "No household expenses"
- [ ] Ratio = 100:0: User B owes all household expenses
- [ ] Negative amounts in CSV: handled correctly (expense vs income)

**AC-4.4 UI/UX**
- [ ] Settlement result displayed prominently (large font, color-coded)
- [ ] Breakdown details collapsible/expandable
- [ ] Export button: download settlement summary as PDF or text
- [ ] Mobile-responsive: readable on 375px width screens

---

## 7. Implementation Sequence

**Phase 1A: Foundation (Week 1)**
1. Setup Next.js + TypeScript + Tailwind project
2. Configure Supabase (Auth + Database)
3. Implement database schema with RLS policies
4. Create authentication flows (signup, login, logout)

**Phase 1B: Data Layer (Week 2)**
5. Build CSV parser utility (`src/lib/csv-parser.ts`)
6. Implement upload API endpoint
7. Create transaction CRUD operations
8. Write unit tests for parser and settlement logic

**Phase 1C: UI Components (Week 3)**
9. Build dashboard layout
10. Create transaction list component with filters
11. Implement expense type toggle UI
12. Add group settings page (ratio configuration)

**Phase 1D: Settlement (Week 4)**
13. Implement settlement calculation function
14. Build settlement dashboard with breakdown
15. Add month selector and result display
16. End-to-end testing with real CSV files

---

## 8. Follow-Up Tasks for Delivery Agent

**DA-1: Environment Setup**
- [ ] Initialize Next.js 14+ with App Router
- [ ] Configure Tailwind CSS with mobile-first breakpoints
- [ ] Setup Supabase project and copy connection strings to `.env.local`
- [ ] Install dependencies: `zod`, `date-fns`, `papaparse`, `react-hook-form`

**DA-2: Database Initialization**
- [ ] Run SQL schema in Supabase SQL Editor
- [ ] Configure RLS policies for multi-tenancy
- [ ] Seed test data: 2 users, 1 group, 50 sample transactions

**DA-3: Core Implementation**
- [ ] Implement `/src/lib/settlement.ts` with formula from Section 4.1
- [ ] Write tests: `/src/lib/settlement.test.ts` (TDD approach)
- [ ] Implement `/src/lib/csv-parser.ts` with format detection
- [ ] Write tests: `/src/lib/csv-parser.test.ts` with fixture files

**DA-4: API Routes**
- [ ] Create Server Actions in `/src/app/actions/`
- [ ] Implement rate limiting middleware
- [ ] Add Zod validation for all inputs
- [ ] Error handling with structured responses

**DA-5: UI Development**
- [ ] Component library: Transaction Card, Toggle Switch, Month Picker
- [ ] Dashboard page: `/app/dashboard/page.tsx`
- [ ] Transactions page: `/app/transactions/page.tsx`
- [ ] Settlement page: `/app/settlement/page.tsx`
- [ ] Settings page: `/app/settings/page.tsx`

**DA-6: Testing & QA Handoff**
- [ ] Unit test coverage >80% for `src/lib/`
- [ ] Integration tests for API endpoints
- [ ] Manual QA checklist based on Section 6 acceptance criteria
- [ ] Performance profiling: check page load times
- [ ] Document known limitations in `/docs/LIMITATIONS.md`

---

## 9. Questions for Quality Gate Agent

**QGA-1: Performance Validation**
- Verify settlement calculation completes <500ms for 10,000 transactions
- Load test: 50 concurrent CSV uploads

**QGA-2: Security Audit**
- Confirm RLS policies prevent cross-group data access
- Test CSV upload with malicious files (XSS payloads, SQL injection)
- Validate API rate limiting under stress

**QGA-3: Usability Testing**
- Mobile device testing (iOS Safari, Android Chrome)
- Accessibility audit (keyboard navigation, screen reader)
- User testing: ask 2-3 real couples to complete workflow

**QGA-4: Data Integrity**
- Verify settlement calculations match Excel manual calculations
- Test edge cases from AC-4.2 and AC-4.3
- Confirm transaction deletion cascades properly

---

## 10. Open Issues & Decisions Needed

**Issue 1: Common Account Handling**
- Current spec excludes Common payments from settlement
- Alternative: track Common account balance separately
- **Decision:** Defer to Phase 2, keep MVP simple

**Issue 2: Currency & Localization**
- MVP assumes JPY only
- Date/number formatting hardcoded to Japanese locale
- **Decision:** Acceptable for MVP, i18n in Phase 2

**Issue 3: CSV Format Variations**
- Many banks have unique CSV formats
- **Decision:** Support 2-3 major formats in MVP, provide CSV template for manual reformatting

**Issue 4: Data Migration**
- What if users want to change income ratio mid-month?
- **Decision:** Ratio changes apply to future calculations only, past months use ratio at time of settlement view

---

## Appendix A: Test Data Fixtures

**Fixture: `/tests/fixtures/sample-transactions.csv`**
```csv
Date,Description,Amount
2025-01-05,Grocery Store A,8500
2025-01-10,Restaurant Dinner,12000
2025-01-15,Personal Clothing,-4500
2025-01-20,Utility Bill Payment,15000
2025-01-25,Coffee Shop,-800
```

**Fixture: Expected Settlement for January 2025**
- User A uploaded above CSV (payer_type = UserA)
- User A toggles "Personal Clothing" to Personal
- User B uploaded separate CSV with 50,000 yen household expenses
- Ratio: 60:40 (A:B)
- Expected Calculation:
  - Total Household = 8500 + 12000 + 15000 + 800 + 50000 = 86,300
  - Paid by A (Household) = 8500 + 12000 + 15000 + 800 = 36,300
  - Paid by B (Household) = 50,000
  - Balance A = 36,300 - (86,300 * 0.6) = 36,300 - 51,780 = -15,480
  - **Result:** A owes B 15,480 yen

---

**Document Version Control**
- v1.0 (2025-12-07): Initial specification based on REQUIREMENTS.md
- Future updates: increment version and add changelog section

---

**Approval Checklist**
- [ ] Business stakeholder review (PRD alignment)
- [ ] Technical lead review (feasibility, architecture)
- [ ] Security review (RLS policies, input validation)
- [ ] Delivery agent acknowledged scope and timeline
