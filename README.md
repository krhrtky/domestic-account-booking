# Household Settlement App - MVP

家計・立替精算アプリケーション

## Project Overview

共働き夫婦や同棲カップル向けの家計簿・精算アプリ。各個人のクレジットカード明細（CSV）を取り込み、家計支出と個人支出を仕分けることで、月末の精算額を自動算出します。

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library
- **Database:** Supabase (PostgreSQL) - 未実装
- **CSV Parsing:** PapaParse
- **Validation:** Zod
- **Date Handling:** date-fns

## Project Structure

```
domestic-account-booking/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── src/
│   ├── lib/               # Core business logic
│   │   ├── types.ts       # TypeScript interfaces
│   │   ├── settlement.ts  # Settlement calculation logic
│   │   └── csv-parser.ts  # CSV parsing logic
│   └── components/        # React components (TBD)
├── tests/
│   ├── fixtures/          # Sample CSV files
│   └── setup.ts
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables (Optional for now)

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials (once you create a Supabase project).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run type-check   # TypeScript type checking
```

## Testing

All core business logic is tested with Vitest:

- **Settlement Logic Tests:** `/src/lib/settlement.test.ts` (7 tests)
  - Test Case 1: Equal payments with 50:50 ratio
  - Test Case 2: Unequal payments with 60:40 ratio
  - Test Case 3: Reverse settlement scenario
  - Test Case 4: Common account only
  - Test Case 5: Mixed personal/household expenses
  - Month filtering
  - Empty transaction list

- **CSV Parser Tests:** `/src/lib/csv-parser.test.ts` (6 tests)
  - Generic bank statement format
  - Japanese credit card format
  - Negative amounts handling
  - Empty row skipping
  - Invalid CSV error handling
  - Empty file error handling

Run tests:

```bash
npm test
```

All tests are currently passing (13/13).

## Settlement Calculation Formula

Based on SPEC.md Section 4.1:

```typescript
// Filter household expenses for target month
const householdTransactions = transactions.filter(
  t => t.expense_type === 'Household' && t.date.startsWith(targetMonth)
)

// Aggregate by payer
const paidByA = sum(transactions where payer_type === 'UserA')
const paidByB = sum(transactions where payer_type === 'UserB')
const totalHousehold = paidByA + paidByB

// Calculate balance
const ratioA = group.ratio_a / 100  // e.g., 0.6
const balanceA = paidByA - (totalHousehold * ratioA)

// Interpretation:
// balanceA > 0: User B owes User A
// balanceA < 0: User A owes User B
// balanceA === 0: No settlement needed
```

**Note:** Common account payments are excluded from individual settlement calculations.

## CSV Format Support

The parser auto-detects the following formats:

**Format 1: Generic Bank Statement**
```csv
Date,Description,Amount,Balance
2025-01-15,Supermarket XYZ,5400,
2025-01-16,Coffee Shop,450,
```

**Format 2: Japanese Credit Card**
```csv
利用日,利用店名・商品名,利用金額
2025/01/15,スーパーXYZ,5400
2025/01/16,カフェ,450
```

Supported date formats:
- `YYYY-MM-DD`
- `YYYY/MM/DD`
- `MM/DD/YYYY`

## Current Implementation Status

### Completed (DA-1, DA-2)

- [x] Next.js 14+ with App Router and TypeScript
- [x] Tailwind CSS with mobile-first breakpoints
- [x] Core TypeScript interfaces (`/src/lib/types.ts`)
- [x] Settlement calculation logic with tests (100% passing)
- [x] CSV parser with format detection (100% passing)
- [x] Test fixtures for CSV parsing
- [x] Basic project structure
- [x] Environment configuration template

### Pending (DA-3 onwards)

- [ ] Supabase database setup
- [ ] Authentication flows (signup/login)
- [ ] File upload API endpoint
- [ ] Transaction list UI component
- [ ] Settlement dashboard UI
- [ ] Group settings page
- [ ] Integration tests
- [ ] E2E testing with real CSV files

## Next Steps

1. **Create Supabase Project**
   - Sign up at https://supabase.com
   - Create new project
   - Copy connection strings to `.env.local`

2. **Run Database Schema**
   - Execute SQL from SPEC.md Section 3.1 in Supabase SQL Editor
   - Configure Row-Level Security (RLS) policies

3. **Implement UI Components**
   - CSV upload interface
   - Transaction list with filtering
   - Settlement dashboard

4. **Add Authentication**
   - Supabase Auth integration
   - User registration/login flows
   - Protected routes

## License

ISC
