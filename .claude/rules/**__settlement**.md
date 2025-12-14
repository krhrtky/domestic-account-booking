# Settlement Logic Rules

This rule applies to settlement calculation files (`**/settlement*`, `**/lib/settlement*`).

## Applicable Laws

Reference: [docs/laws/08-business-rules.md](../../docs/laws/08-business-rules.md)

### L-BR-001: Settlement Calculation

#### Formula (Simple Model)
```
Balance_A = PaidBy_A^{Household} - ((PaidBy_A^{Household} + PaidBy_B^{Household}) × Ratio_A)
```

| Condition | Result |
|-----------|--------|
| Balance_A > 0 | B pays A the Balance_A |
| Balance_A < 0 | A pays B the |Balance_A| |
| Balance_A = 0 | No settlement needed |

#### Business Constraints
| Constraint | Value | Reason |
|------------|-------|--------|
| Ratio sum | 100% | Logical consistency |
| Ratio unit | 1% | UI/UX simplicity |
| Rounding | Round half up | Fairness |
| Currency unit | 1 yen | Japanese yen minimum |

### L-CX-001: Accuracy
- Calculation results must be 100% compliant with defined logic
- Use `Math.round()` for rounding (no custom implementation)
- Never execute calculation if ratios don't sum to 100%
- Display amount must match calculation result

### L-OC-002: Single Implementation

**All settlement logic MUST be in `src/lib/settlement.ts`**

Forbidden:
- Frontend calculation logic
- Direct calculation in API handlers
- Hardcoded calculation results in tests (except for logic verification)

#### Canonical Implementation
```typescript
// src/lib/settlement.ts
export interface SettlementInput {
  paidByA: number;
  paidByB: number;
  ratioA: number;
  ratioB: number;
}

export interface SettlementResult {
  balanceA: number;
  direction: 'A_PAYS_B' | 'B_PAYS_A' | 'SETTLED';
  amount: number;
}

export function calculateSettlement(input: SettlementInput): SettlementResult {
  if (input.ratioA + input.ratioB !== 100) {
    throw new Error('負担割合の合計は100%である必要があります');
  }

  const totalHousehold = input.paidByA + input.paidByB;
  const balanceA = input.paidByA - (totalHousehold * input.ratioA / 100);

  return {
    balanceA: Math.round(balanceA),
    direction: balanceA > 0 ? 'B_PAYS_A' : balanceA < 0 ? 'A_PAYS_B' : 'SETTLED',
    amount: Math.abs(Math.round(balanceA)),
  };
}
```

### L-BR-002: Payer Rules
| Payer | Description | Settlement Impact |
|-------|-------------|-------------------|
| UserA | User A's personal wallet | Included in calculation |
| UserB | User B's personal wallet | Included in calculation |
| Common | Shared account | Excluded from calculation |

### L-BR-003: Expense Type Rules
| ExpenseType | Description | Settlement Target |
|-------------|-------------|-------------------|
| Household | Shared expenses | Included |
| Personal | Personal expenses | Excluded |
