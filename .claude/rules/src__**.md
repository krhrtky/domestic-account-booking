# General Source Code Rules

This rule applies to all source code files in `src/`.

## Applicable Laws

Reference: [docs/laws/README.md](../../docs/laws/README.md)

### L-CN: Basic Principles
- **L-CN-001**: Data classification (Public/Internal/Confidential/PII)
- **L-CN-003**: Coding Agent restrictions apply

### L-OC: Organizational Consistency
- **L-OC-001**: Follow coding standards (ESLint + Prettier, TypeScript strict mode)
- **L-OC-003**: Use unified error handling pattern with `AppError` class

### L-SC-003: Secrets Protection
- Store secrets in environment variables only
- Never log sensitive information
- No hardcoded passwords, API keys, or connection strings

### L-LC: Legal Compliance
- **L-LC-001**: Minimize PII collection, no bank/card numbers
- **L-LC-004**: No prohibited expressions (superlatives, discrimination, fear appeals)
- **L-LC-005**: No tax/investment/legal advice features

### L-RV: Revenue
- **L-RV-001**: No payment/billing code implementation
- **L-RV-003**: No stubs or placeholders for monetization

## Key Constraints

```typescript
// Naming conventions
Component: PascalCase        // SettlementDashboard
Function/Variable: camelCase // calculateSettlement
Constant: SCREAMING_SNAKE    // MAX_FILE_SIZE
Type/Interface: PascalCase   // Transaction
```

## Validation

- `npm run lint`
- `npm run type-check`
- `npx ts-node scripts/check-secrets.ts`
