# Phase 15: ESLint v9 Setup with Next.js 15

## Product Context
**Product**: Household Settlement Application - A Next.js-based web app for couples to manage shared expenses and calculate monthly settlements.

**Business Goal**: Establish consistent code quality enforcement across the codebase to ensure maintainability, catch common errors early, and enforce Next.js best practices.

## Problem Statement
Current state:
- ESLint v9.39.1 and eslint-config-next v16.0.8 are installed but not configured
- `npm run lint` uses `next lint` which is deprecated in Next.js 16
- No `.eslintrc.*` or `eslint.config.mjs` file exists
- ESLint v9 no longer supports legacy `.eslintrc.*` format natively
- No CI/CD integration for linting

Impact:
- Inconsistent code style across 35+ TypeScript files
- No automated quality checks in development or CI
- Risk of Next.js anti-patterns (e.g., missing core-web-vitals rules)
- Future breaking changes when Next.js 16 removes `next lint`

## Scope

### In Scope
1. **ESLint Flat Config Setup**: Create `eslint.config.mjs` with ESLint v9 flat config format
2. **Next.js Integration**: Include `next/core-web-vitals` rules
3. **TypeScript Support**: Configure TypeScript parser and rules for `.ts`/`.tsx` files
4. **Script Migration**: Replace `next lint` with direct `eslint` CLI command
5. **CI Integration**: Add lint step to existing GitHub Actions workflows
6. **Baseline Establishment**: Ensure all existing code passes lint (no breaking changes)

### Out of Scope (Non-Goals)
1. Adding stricter rules beyond Next.js defaults (defer to future phases)
2. Prettier integration (assume separate tool)
3. Auto-fix on commit (pre-commit hooks)
4. Custom ESLint plugins or rule creation
5. Migration from TSLint or other linters (none exist)
6. ESLint IDE extensions configuration (developer-specific)

## Requirements

### Functional Requirements

#### FR-1: ESLint Flat Config File
- **File**: `eslint.config.mjs` at repository root
- **Format**: ESLint v9 flat config (JavaScript module with array export)
- **Content**:
  - Import `@eslint/js` recommended rules
  - Import `next/core-web-vitals` config
  - Configure TypeScript parser (`@typescript-eslint/parser`)
  - Set file patterns for `.ts`, `.tsx`, `.js`, `.jsx`
  - Exclude patterns: `node_modules`, `.next`, `out`, `dist`

#### FR-2: Package Scripts
- **Update `package.json` scripts**:
  ```json
  {
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix"
  }
  ```
- **Behavior**:
  - `npm run lint` must exit with code 1 if any errors/warnings found
  - `--max-warnings 0` ensures warnings are treated as errors in CI

#### FR-3: GitHub Actions Integration
- **Add lint step to CI workflows**:
  - `.github/workflows/e2e.yml` (before E2E tests)
  - `.github/workflows/lighthouse.yml` (before build)
- **Placement**: After `npm ci`, before test/build steps
- **Failure handling**: Fail CI if lint fails

#### FR-4: Baseline Compliance
- **All existing files must pass lint** without errors
- **If violations exist**: Document exceptions or add `// eslint-disable-next-line` with justification
- **No new warnings**: Aim for zero lint output on current codebase

### Non-Functional Requirements

#### NFR-1: Performance
- **Execution time**: `npm run lint` completes in < 10 seconds for current codebase (~35 files)
- **CI overhead**: Lint step adds < 30 seconds to workflow duration

#### NFR-2: Maintainability
- **Config clarity**: ESLint config should be self-documenting with comments explaining non-obvious rules
- **Extensibility**: Structure allows easy addition of custom rules in future phases

#### NFR-3: Developer Experience
- **Zero friction**: Developers can run lint locally without additional setup
- **Fast feedback**: Lint errors are clear and actionable

#### NFR-4: Future-Proof
- **Next.js 16 Ready**: No reliance on deprecated `next lint` command
- **ESLint v9 Native**: Pure flat config without legacy compatibility layers

## Proposed Solution

### Technical Approach

#### Option A: Pure Flat Config (Recommended)
Use native ESLint v9 flat config with modern plugins:
- `eslint-config-next` v16 supports flat config
- No need for `@eslint/eslintrc` compatibility layer
- Cleaner, future-proof configuration

**Pros**: Native, performant, less dependencies
**Cons**: Requires manual migration if adding legacy plugins later

#### Option B: Hybrid with Compatibility Layer
Use `@eslint/eslintrc` to support legacy plugins:
- Already installed in `package.json`
- Easier to add old plugins if needed

**Pros**: More flexible
**Cons**: Extra dependency, slower, not future-proof

**Decision**: **Option A** - Pure flat config (aligns with ESLint v9 philosophy)

### Configuration Structure

```javascript
// eslint.config.mjs
import js from '@eslint/js';
import nextPlugin from 'eslint-config-next';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    ...nextPlugin
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**']
  }
];
```

### Files to Create/Modify

#### Create
1. `/eslint.config.mjs` - Main ESLint configuration

#### Modify
1. `/package.json` - Update `lint` script
2. `/.github/workflows/e2e.yml` - Add lint step
3. `/.github/workflows/lighthouse.yml` - Add lint step

#### Optional Create
1. `/.eslintignore` - If additional ignore patterns needed (redundant if using `ignores` in config)

### Implementation Steps

#### Step 1: Verify Dependencies
```bash
npm list eslint eslint-config-next @typescript-eslint/parser
```
Expected:
- `eslint@^9.39.1`
- `eslint-config-next@^16.0.8`
- `@typescript-eslint/parser` (if not installed, add)

#### Step 2: Create Flat Config
Create `eslint.config.mjs` with structure above.

#### Step 3: Test Locally
```bash
npm run lint
```
Review output, fix or document violations.

#### Step 4: Update CI Workflows
Add lint step:
```yaml
- name: Run ESLint
  run: npm run lint
```

#### Step 5: Validate CI
Push to branch, verify workflows pass.

## API/Data Model Changes

**None** - This is a tooling/infrastructure change with no runtime impact.

## Security Considerations

### SEC-1: No Security Impact
- ESLint runs statically on source code, no runtime changes
- No new dependencies beyond already installed packages

### SEC-2: CI Security
- Lint failures will block PRs, preventing low-quality code from merging
- No secrets or sensitive data exposed in lint output

## Acceptance Criteria

### Checklist for Delivery Agent

- [ ] `eslint.config.mjs` created at repository root
- [ ] File uses ESLint v9 flat config array format
- [ ] Configuration includes `next/core-web-vitals` rules
- [ ] TypeScript files (`.ts`, `.tsx`) are linted
- [ ] `package.json` scripts updated: `lint` and `lint:fix`
- [ ] `npm run lint` exits with code 0 on current codebase
- [ ] `npm run lint` completes in < 10 seconds
- [ ] `.github/workflows/e2e.yml` includes lint step before tests
- [ ] `.github/workflows/lighthouse.yml` includes lint step before build
- [ ] CI lint step fails workflow if lint errors present
- [ ] No new warnings or errors introduced in existing code
- [ ] All 35+ TypeScript source files pass lint
- [ ] `node_modules`, `.next`, `out` directories excluded from linting
- [ ] Configuration comments explain non-obvious rules (if any)
- [ ] `npm run lint:fix` auto-fixes safe issues (e.g., formatting)

### Success Metrics

1. **Zero Lint Errors**: `npm run lint` output is clean on `master` branch
2. **CI Integration**: At least 1 CI run shows lint passing
3. **Performance**: Lint completes in < 10 seconds locally
4. **Coverage**: All `.ts`/`.tsx` files in `src/` and `app/` are linted

## Follow-up Tasks

### For Future Phases
1. **Phase 16**: Add custom ESLint rules for domain-specific patterns (e.g., transaction validation)
2. **Phase 17**: Integrate Prettier for auto-formatting with ESLint
3. **Phase 18**: Add pre-commit hooks with Husky + lint-staged
4. **Phase 19**: Configure ESLint for test files with testing-library plugin

### For Quality Gate Agent
- Verify no performance regression in CI workflows
- Check for false positives in lint errors (should be none)
- Validate that lint errors are actionable for developers

## Dependencies

### Upstream Dependencies
- ESLint v9.39.1 (installed)
- eslint-config-next v16.0.8 (installed)
- @eslint/eslintrc v3.3.3 (installed, but unused in Option A)

### Downstream Impact
- Developers must run `npm run lint` before pushing (workflow enforcement)
- Future PRs will require lint passing to merge

## Constraints

### Technical Constraints
1. **ESLint v9 Compatibility**: Must use flat config format (no `.eslintrc.*`)
2. **Next.js 15 Support**: Config must work with Next.js 15.1.3
3. **TypeScript Strict Mode**: Lint rules must align with `tsconfig.json` strict settings
4. **Existing Code**: Cannot introduce breaking changes requiring large refactors

### Operational Constraints
1. **CI Budget**: Lint step should not exceed 30 seconds in workflows
2. **Developer Friction**: Zero additional setup beyond `npm ci`

## Open Questions

### For Delivery Agent Resolution
1. **Q**: Should we install `@typescript-eslint/parser` explicitly?
   **A**: Check if `eslint-config-next` includes it, otherwise add to `devDependencies`.

2. **Q**: Should we enforce specific rule severity (error vs warn)?
   **A**: Start with `next/core-web-vitals` defaults, defer customization to Phase 16.

3. **Q**: Should we add `.eslintignore` file or rely on `ignores` in config?
   **A**: Use `ignores` in flat config (more modern), skip `.eslintignore`.

## References

### Technical Documentation
- [ESLint v9 Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [eslint-config-next Documentation](https://nextjs.org/docs/basic-features/eslint)
- [TypeScript ESLint Parser](https://typescript-eslint.io/packages/parser)

### Related Specs
- Phase 14: ESLint v9 Installation (prerequisite)
- Phase 16: Custom ESLint Rules (follow-up)

### Existing Codebase
- `package.json` - Current dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode enabled)
- `.github/workflows/*.yml` - CI workflows to modify

---

**Spec Version**: 1.0
**Author**: Product Agent
**Date**: 2025-12-09
**Status**: Ready for Implementation
