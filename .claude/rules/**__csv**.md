# CSV Processing Rules

This rule applies to CSV-related files (`**/csv*`, `**/import*`).

## Applicable Laws

Reference: [docs/laws/08-business-rules.md](../../docs/laws/08-business-rules.md)

### L-BR-006: CSV Import Rules

#### Supported Format
| Item | Requirement |
|------|-------------|
| Encoding | UTF-8 (with/without BOM) |
| Delimiter | Comma (,) |
| Header row | Required |
| Required columns | Date, Amount |
| Recommended columns | Description/Memo |

#### Column Mapping
| CSV Header Examples | Maps To |
|--------------------|---------|
| 日付, 利用日, Date | date |
| 金額, 利用金額, Amount | amount |
| 摘要, 内容, メモ, Description | description |

#### Business Constraints
| Constraint | Value | Reason |
|------------|-------|--------|
| File size limit | 5MB | L-RV-002 |
| Row limit | 10,000 | L-RV-002 |
| Duplicate detection | Date + Amount + Description | Prevent double import |
| On duplicate | Show warning (import proceeds) | User decision priority |

### L-LC-001: PII Handling in CSV

#### Auto-excluded Columns
Columns matching these patterns are automatically excluded:
- カード番号
- 口座番号
- Card Number
- Account Number

#### Auto-masking Patterns
Sensitive patterns in description are masked:
```typescript
// Account number pattern
'振込 1234567' → '振込 ***'

// Card number pattern
'4111111111111111' → '************1111'
```

### L-SC-002: CSV Injection Prevention

#### Formula Injection
Sanitize fields starting with: `=`, `+`, `-`, `@`
```typescript
// Escape with single quote prefix
'=CMD|calc.exe|A0' → "'=CMD|calc.exe|A0"
```

#### Newline Injection
Remove embedded newlines from fields:
```typescript
'テスト\n悪意のある行' → 'テスト悪意のある行'
```

### Implementation Pattern

```typescript
export async function parseCSV(content: string): Promise<ParseResult> {
  // 1. Detect and handle BOM
  // 2. Parse with header row
  // 3. Map columns to schema
  // 4. Filter sensitive columns
  // 5. Mask sensitive patterns
  // 6. Sanitize formula injection
  // 7. Detect duplicates
  // 8. Return with warnings
}
```

### Validation Tests

```typescript
describe('L-BR-006: CSV Import', () => {
  it('rejects files over 5MB');
  it('rejects files over 10,000 rows');
  it('detects duplicate entries');
  it('excludes card number columns');
  it('masks account number patterns');
  it('escapes formula injection');
});
```
