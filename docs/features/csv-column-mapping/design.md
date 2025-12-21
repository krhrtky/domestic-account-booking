# CSV Column Mapping Feature Design

## Overview

This feature enables users to manually map CSV file columns to application transaction fields, even when auto-detection succeeds. Currently, users can only map columns when auto-detection fails to find required columns. This enhancement ensures users always have control over how their CSV data is imported.

## Business Context

**User Need:** Different banks and credit card companies use varying column names in their CSV exports. While auto-detection works for common patterns, users may need to:
- Override incorrect auto-detection results
- Map columns with non-standard names
- Verify mapping before importing data

**Current Pain Point:** If auto-detection successfully maps all required columns, users are taken directly to preview without a chance to verify or adjust the mapping.

## Current Behavior vs Proposed Behavior

### Current Flow
```
1. User uploads CSV file
2. System detects headers and suggests mapping
3. IF all required columns auto-detected:
   → Skip to preview step (no manual mapping option)
4. ELSE:
   → Show mapping form
   → User confirms
   → Show preview
5. User sets payer types
6. Import execution
```

### Proposed Flow
```
1. User uploads CSV file
2. System detects headers and suggests mapping
3. Show mapping form with auto-detected values pre-filled
4. User can:
   - Accept suggested mapping (click "次へ" or "プレビューを表示")
   - Modify mapping by changing dropdowns
5. User confirms mapping
6. Show preview with payer type selection
7. Import execution
```

## Technical Design

### Component Changes

#### 1. CSVUploadForm.tsx (Lines 93-114)

**Current Logic:**
```typescript
if (!hasDateColumn || !hasAmountColumn) {
  // Show error, stay on upload step
  setError(`必須列（${missingColumns.join('、')}）が見つかりません`)
  setStep('upload')
} else {
  const allRequiredFieldsMapped = 
    result.suggestedMapping.dateColumn &&
    result.suggestedMapping.amountColumn &&
    result.suggestedMapping.descriptionColumn

  if (allRequiredFieldsMapped) {
    setStep('preview')
    await handlePreview(result.suggestedMapping, content, selectedFile.name)
  } else {
    setStep('mapping')
  }
}
```

**Proposed Logic:**
```typescript
if (!hasDateColumn || !hasAmountColumn) {
  // Critical error: cannot proceed without date and amount detection
  const missingColumns = []
  if (!hasDateColumn) missingColumns.push('日付')
  if (!hasAmountColumn) missingColumns.push('金額')
  setError(`必須列（${missingColumns.join('、')}）が見つかりません`)
  setStep('upload')
} else {
  // Always show mapping step for user verification
  setStep('mapping')
}
```

**Rationale:**
- Simplifies logic by removing conditional branching
- Ensures consistent user experience
- Allows users to always verify auto-detection results
- Per L-CX-004: 100ms feedback requirement still met (mapping screen shows immediately)

#### 2. ColumnMappingForm.tsx (No changes required)

This component already supports:
- Pre-filled values from `suggestedMapping`
- Manual column selection via dropdowns
- Real-time validation
- Clear visual indication of required fields

#### 3. UI Flow Enhancement

**Mapping Step UI:**
```
┌─────────────────────────────────────────┐
│ 列マッピングの確認                         │
├─────────────────────────────────────────┤
│ [Auto-detection info box]               │
│ 以下のマッピングを検出しました。            │
│ 確認または変更してください。               │
├─────────────────────────────────────────┤
│ 日付列 *                                 │
│ [Date ▼]  ← Pre-filled from detection   │
│                                         │
│ 金額列 *                                 │
│ [Amount ▼]                              │
│                                         │
│ 摘要列 *                                 │
│ [Description ▼]                         │
│                                         │
│ 支払者列 (任意)                          │
│ [なし ▼]                                │
├─────────────────────────────────────────┤
│ [キャンセル]  [プレビューを表示]          │
└─────────────────────────────────────────┘
```

### Data Flow

```typescript
// No schema changes required
interface ColumnMapping {
  dateColumn: string | null;
  amountColumn: string | null;
  descriptionColumn: string | null;
  payerColumn: string | null;
}
```

### State Management

**Modified State Transitions:**
```
Step Flow:
'upload' → 'mapping' → 'preview' → (import execution)

State Updates:
1. File upload: 
   - Detect headers
   - Set suggestedMapping
   - Set columnMapping = suggestedMapping
   - setStep('mapping')

2. User modifies mapping:
   - Update columnMapping via setColumnMapping

3. User confirms:
   - Validate required fields
   - Call handlePreview(columnMapping, ...)
   - setStep('preview')
```

## Non-Functional Requirements

### Performance (per L-CX-004)
| Action | Target | Actual Impact |
|--------|--------|---------------|
| Show mapping form | <100ms | ~50ms (render only) |
| Dropdown selection | <100ms | Immediate (React state) |
| Validation feedback | <100ms | Synchronous |

### Security (per L-SC-002, L-LC-001)
- No changes to sanitization logic
- Sensitive column filtering still applies at detection phase
- User-selected columns are validated before parsing

### User Experience (per L-CX-002, L-CX-003)
- Consistent display of CSV headers
- Clear error messages when validation fails
- Visual feedback for required fields (marked with *)

### Business Rules (per L-BR-006)
- Required columns: Date, Amount, Description
- Optional column: Payer
- Auto-detection patterns remain unchanged
- Sensitive column exclusion happens before mapping

## Acceptance Criteria

### AC-1: Mapping Step Always Shown
- [ ] After successful file upload, mapping step is displayed
- [ ] Mapping form shows detected headers in dropdowns
- [ ] Suggested mapping values are pre-filled
- [ ] User can see all available CSV columns

### AC-2: User Can Modify Mapping
- [ ] User can change date column selection
- [ ] User can change amount column selection
- [ ] User can change description column selection
- [ ] User can change payer column selection (including "なし")
- [ ] Form validates that required columns are selected
- [ ] Validation error is shown when required field is empty

### AC-3: Mapping Confirmation
- [ ] "プレビューを表示" button is enabled when all required fields are selected
- [ ] Button is disabled when any required field is missing
- [ ] Clicking "プレビューを表示" triggers preview generation
- [ ] Preview uses user-confirmed column mapping
- [ ] "キャンセル" button resets to upload step

### AC-4: Auto-Detection Still Works
- [ ] System still auto-detects standard column names
- [ ] Japanese column names (日付, 金額, 摘要) are detected
- [ ] English column names (Date, Amount, Description) are detected
- [ ] Payer column variations (支払者, User, ユーザー) are detected
- [ ] Sensitive columns (カード番号, Account Number) are excluded per L-LC-001

### AC-5: Error Handling (per L-CX-003)
- [ ] Error when date and amount columns cannot be detected (upload step)
- [ ] Error message is specific: "必須列（日付、金額）が見つかりません"
- [ ] Validation error when user deselects required field: "必須列（日付、金額、摘要）を選択してください。"
- [ ] All error messages are in Japanese
- [ ] No technical error messages are shown to users

### AC-6: Performance (per L-CX-004)
- [ ] Mapping form appears within 100ms of file upload completion
- [ ] Dropdown selection provides immediate visual feedback
- [ ] "プレビューを表示" button shows loading state within 100ms of click

### AC-7: Security (per L-SC-002, L-LC-001)
- [ ] Sensitive columns are excluded before mapping
- [ ] Warning is shown when sensitive columns are detected
- [ ] User-selected columns are sanitized during parsing (formula injection prevention)
- [ ] No sensitive data is logged during mapping process

### AC-8: Backwards Compatibility
- [ ] Existing CSV files with standard formats still work
- [ ] Auto-detected mapping produces same results as before
- [ ] Preview and import logic remain unchanged
- [ ] No breaking changes to parseCSV function signature

### AC-9: UI Consistency (per L-CX-002)
- [ ] Mapping form follows existing design system
- [ ] Required fields are marked with red asterisk
- [ ] Dropdowns use consistent styling
- [ ] Button states (enabled/disabled) are visually clear

### AC-10: Traceability (per L-BR-007)
- [ ] Column mapping decisions are reflected in imported data
- [ ] source_file_name is correctly populated
- [ ] payer_name from CSV is correctly mapped when column is selected

## Implementation Notes

### Files to Modify
1. `/Users/takuya.kurihara/workspace/domestic-account-booking/src/components/transactions/CSVUploadForm.tsx`
   - Lines 93-114: Simplify conditional logic
   - Remove automatic skip to preview step

### Files NOT Modified
- `src/lib/csv-parser.ts` (no logic changes)
- `src/components/transactions/ColumnMappingForm.tsx` (already supports this flow)
- `src/components/transactions/TransactionPreview.tsx` (no changes needed)
- `src/app/actions/transactions.ts` (no changes needed)

### Testing Strategy
1. **Unit Tests:** No new tests required (existing parseCSV tests cover mapping)
2. **Integration Tests:** Update tests that expect direct jump to preview
3. **E2E Tests:** Add scenario for manual mapping override
4. **Manual Testing:** Verify with various CSV formats from different banks

### Rollout Plan
1. **Phase 1:** Code change (1 file, ~10 lines modified)
2. **Phase 2:** E2E test update
3. **Phase 3:** Deploy to staging for manual testing
4. **Phase 4:** Production deployment (low risk, UI-only change)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Users confused by extra step | Low | Low | Clear messaging about verification |
| Performance degradation | Very Low | Low | No additional processing, just UI flow |
| Breaking existing flows | Very Low | Medium | Comprehensive E2E tests before deploy |
| Regression in auto-detection | Very Low | High | Existing unit tests validate detection |

## Success Metrics

- **Functional:** 100% of CSV uploads allow manual mapping verification
- **UX:** No increase in support tickets about incorrect column mapping
- **Performance:** Mapping step renders within 100ms (per L-CX-004)
- **Adoption:** Users modify auto-detected mapping in <5% of cases (indicates good auto-detection)

## Related Rules and Laws

### Mandatory Compliance
- **L-BR-006:** CSV Import Rules (column mapping, format support)
- **L-LC-001:** Sensitive column filtering and warnings
- **L-SC-002:** CSV injection prevention (formula escaping, newline removal)
- **L-CX-002:** UI display consistency (error messages in Japanese)
- **L-CX-003:** Error message clarity (specific, actionable, non-technical)
- **L-CX-004:** Feedback immediacy (100ms UI response)

### Reference Documents
- `/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/08-business-rules.md`
- `/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/01-customer-experience.md`
- `/Users/takuya.kurihara/workspace/domestic-account-booking/docs/laws/04-security.md`
- `/Users/takuya.kurihara/workspace/domestic-account-booking/.claude/rules/**__csv**.md`

## Future Enhancements (Out of Scope)

- Save user's preferred column mappings per file pattern
- Show sample data from CSV in mapping form
- Support multi-file upload with same mapping
- Column mapping templates for popular banks
