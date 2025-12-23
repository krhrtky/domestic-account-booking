# CSV Payer Display Feature - Spec & Acceptance

**Issue:** #24
**Created:** 2025-12-22
**Status:** Specification Complete

## Scope

### Included
- Display `payer_name` column in `TransactionPreview` component when present in CSV data
- Add "Payer" column header to preview table
- Show "—" (em dash) when `payer_name` is absent or empty
- Maintain formula injection sanitization for payer field (per L-SC-002)

### Changes
- Single file modification: `src/components/transactions/TransactionPreview.tsx`
- Add new table column between "摘要" (Description) and "支払元" (Payment Source) columns

## Non-Goals

- Modifying CSV parsing logic (already handles `payer_name`)
- Changing column mapping detection for payer field
- Auto-populating "支払元" dropdown based on payer_name
- Editing payer_name values in preview screen
- Storing payer_name in database (only used for display reference)
- Changing sanitization rules for formula injection

## Constraints

### Business Rules (per L-BR-006)
| Constraint | Value | Reason |
|------------|-------|--------|
| Optional column | Yes | Payer is optional in CSV |
| Auto-detection patterns | "支払者", "Payer", "payer", "User", "ユーザー" | Standard patterns |
| Display when absent | "—" | Clarity for users |

### Security (per L-SC-002)
- **Formula injection prevention**: Display sanitized value (with `'` prefix if needed)
- **XSS prevention**: React automatic escaping (no `dangerouslySetInnerHTML`)

### User Experience (per L-CX-002, L-CX-003)
| Item | Value |
|------|-------|
| Column order | Date → Description → **Payer** → Payment Source → Amount |
| Header label | "Payer" |
| Empty value display | "—" (em dash U+2014) |
| Text alignment | Left-aligned |
| Font/styling | Same as Description column (neutral-700, text-sm) |

## Technical Design

### Current Component Structure

**File:** `src/components/transactions/TransactionPreview.tsx`

**Current columns:**
1. 日付 (Date)
2. 摘要 (Description)
3. 支払元 (Payment Source) - dropdown
4. 金額 (Amount)

**Data interface:**
```typescript
ParsedTransaction {
  date: string
  description: string
  amount: number
  source_file_name: string
  payer_name?: string  // Already parsed, not displayed
}
```

### Proposed Changes

#### 1. Add Column Header

**After 摘要, before 支払元:**
```typescript
<th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">
  Payer
</th>
```

#### 2. Add Table Cell for Payer

**After description cell, before dropdown cell:**
```typescript
<td className="px-4 py-2 text-sm text-neutral-700">
  {t.payer_name || '—'}
</td>
```

### Data/API Changes

**No changes required:**
- `ParsedTransaction` interface already includes `payer_name?: string`
- CSV parser already detects and populates `payer_name`
- CSV sanitization already applies formula injection prevention

## Non-Functional Requirements

### Performance (per L-CX-004)
| Operation | Target |
|-----------|--------|
| Render preview table | <100ms |
| Display payer column | <1ms (string access) |

### Security (per L-SC-002)
- Formula injection: Already sanitized by CSV parser
- XSS prevention: React JSX automatic escaping

## Acceptance Criteria

### AC-1: Payer Column Visibility
- [ ] "Payer" column header is visible in preview table
- [ ] Column appears between "摘要" and "支払元" columns
- [ ] Column is visible for all CSV uploads (with or without payer data)

### AC-2: Payer Value Display
- [ ] When `payer_name` is present, display exact value from CSV
- [ ] When `payer_name` is undefined/empty/null, display "—"
- [ ] Text styling is `text-sm text-neutral-700`

### AC-3: Security - Formula Injection
- [ ] Payer values starting with `=`, `+`, `-`, `@` display with `'` prefix
- [ ] Sanitization is applied by CSV parser (not component)

### AC-4: E2E Test Compliance
- [ ] Line 118: "L-BR-006: Auto-detects payer column" - PASS
- [ ] Line 143: "L-BR-006: Payer column is optional" - PASS
- [ ] Line 166: "L-SC-002: Formula injection is sanitized" - PASS

### AC-5: Backwards Compatibility
- [ ] CSV without payer column displays "—" in all rows
- [ ] Existing unit tests pass without modification
- [ ] Import flow continues unchanged after preview

## Verification Checklist

```bash
# 1. Type safety
npm run type-check

# 2. Code quality
npm run lint

# 3. Unit tests
npm test

# 4. E2E tests (3 tests should now pass)
npm run test:e2e -- csv-column-mapping.spec.ts
```

## Related Laws References

- **L-BR-006:** CSV Import Rules (payer column optional)
- **L-SC-002:** CSV Injection Prevention (formula sanitization)
- **L-CX-002:** UI Display Consistency (column formatting)
