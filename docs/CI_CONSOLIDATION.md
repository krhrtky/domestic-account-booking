# CI Workflow Consolidation

## Overview

This document explains the consolidation of CI workflows into a unified `laws-validation.yml` workflow that aligns with L-TA-001 test categories.

## Phase 1: Core Validation (Implemented)

### Jobs Structure

```
static-analysis
    ├── unit-tests
    ├── integration-tests
    └── build
         └── validation-summary
```

### Job Details

#### 1. static-analysis

- Type check (L-OC-001, L-CN-003)
- Lint (L-OC-001)
- Architecture check (L-OC-002)
- Prohibited expressions check (L-LC-004)
- Runs first, gates all other jobs

#### 2. unit-tests

- Runs after static-analysis
- Executes unit tests with coverage
- Validates L-TA-002 coverage thresholds (80%)
- Uploads coverage artifacts

#### 3. integration-tests

- Runs after static-analysis (parallel with unit-tests)
- Sets up PostgreSQL service
- Applies database migrations
- Tests API specifications (L-AS-001, L-AS-002)
- Tests settlement calculation (L-CX-001, L-BR-001)

#### 4. build

- Runs after unit-tests and integration-tests
- Verifies production build succeeds
- Ensures deployability

#### 5. validation-summary

- Runs after all jobs (always)
- Reports results for all jobs
- Lists validated Laws
- Fails if any job failed

## Laws Validated

| Law      | Description                     | Validated By             |
| -------- | ------------------------------- | ------------------------ |
| L-OC-001 | Coding standards                | Type check, Lint         |
| L-OC-002 | Settlement logic centralization | Architecture check       |
| L-CN-003 | Coding agent restrictions       | Type check               |
| L-LC-004 | Prohibited expressions          | Check expressions        |
| L-TA-002 | Coverage thresholds             | Unit tests with coverage |
| L-CX-001 | Settlement calculation accuracy | Unit & integration tests |
| L-BR-001 | Settlement calculation rules    | Unit & integration tests |
| L-AS-001 | API response format             | Integration tests        |
| L-AS-002 | Input validation                | Integration tests        |

## Existing Workflows Status

### Kept as-is

- `storybook-deploy.yml`: Separate deployment workflow (unchanged)

### To be deprecated (Phase 2+)

- `ci.yml`: Functionality moved to `laws-validation.yml`
- `e2e.yml`: Will be reorganized by L-TA-001 categories in Phase 2
- `lighthouse.yml`: Will become `performance` job in Phase 2
- `chromatic.yml`: Will become `visual-regression` job in Phase 2

## Migration Plan

### Phase 1 (Current)

- [x] Create `laws-validation.yml` with core jobs
- [x] Implement static-analysis job
- [x] Implement unit-tests job
- [x] Implement integration-tests job
- [x] Implement build job
- [x] Implement validation-summary job

### Phase 2 (Future)

- [ ] Add E2E test jobs organized by L-TA-001 categories:
  - [ ] e2e-typical: Normal user journey tests
  - [ ] e2e-boundary: Edge case tests (max file size, etc.)
  - [ ] e2e-attack: Security tests (L-TA-003)
- [ ] Add accessibility job (from e2e.yml)
- [ ] Add visual-regression job (from chromatic.yml)
- [ ] Add performance job (from lighthouse.yml)

### Phase 3 (Future)

- [ ] Deprecate old workflows
- [ ] Update branch protection rules
- [ ] Update documentation

## Running Locally

### All Phase 1 jobs

```bash
npm run type-check
npm run lint
npm run check:arch
npm run check:expressions
npm test -- --run --coverage
npm run build
```

### Individual checks

```bash
npm run type-check           # Type checking
npm run lint                 # Linting
npm run check:arch           # Architecture validation
npm run check:expressions    # Prohibited expressions
npm test -- --run            # Unit tests
npm test -- --run --coverage # Unit tests with coverage
```

## Coverage Requirements (L-TA-002)

| Target                | Minimum | Goal |
| --------------------- | ------- | ---- |
| Overall               | 80%     | 90%  |
| src/lib/settlement.ts | 100%    | 100% |
| src/lib/csv-parser.ts | 90%     | 100% |
| src/components/\*\*   | 70%     | 85%  |

## Parallel Execution

Jobs run in parallel where possible:

- `unit-tests` and `integration-tests` run concurrently after `static-analysis`
- `build` runs after both test jobs complete
- Total execution time optimized for fast feedback

## Troubleshooting

### Coverage threshold failures

```bash
npm test -- --run --coverage
```

Check `coverage/coverage-summary.json` for details.

### Integration test failures

Ensure database migrations are applied:

```bash
npm run migrate:e2e
```

### Architecture check failures

Review dependency graph:

```bash
npm run check:arch:graph
```

## References

- [L-TA-001: Evaluation Dataset](../docs/laws/07-test-audit.md#l-ta-001-evaluation-dataset)
- [L-TA-002: Scoring Rubric](../docs/laws/07-test-audit.md#l-ta-002-scoring-rubric)
- [Laws README](../docs/laws/README.md)
