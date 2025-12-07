# E2E Demo Test Suite - File Manifest

## Created Files (Absolute Paths)

### Test Specifications (15 files)
1. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/01-onboarding.spec.ts`
2. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/02-partner-invitation.spec.ts`
3. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/03-manual-transactions.spec.ts`
4. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/04-csv-upload.spec.ts`
5. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/05-transaction-classification.spec.ts`
6. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/06-filtering.spec.ts`
7. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/07-pagination.spec.ts`
8. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/08-deletion.spec.ts`
9. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/09-settlement-equal.spec.ts`
10. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/10-settlement-unequal.spec.ts`
11. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/11-settlement-common-account.spec.ts`
12. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/12-ratio-update.spec.ts`
13. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/13-logout-session.spec.ts`
14. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/14-error-handling.spec.ts`
15. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/15-edge-cases.spec.ts`

### Supporting Utilities
16. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/utils/demo-helpers.ts`
17. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/fixtures/demo-data.ts`

### Test Fixtures (CSV Files)
18. `/Users/takuya.kurihara/workspace/domestic-account-booking/tests/fixtures/demo-csvs/valid-transactions.csv`
19. `/Users/takuya.kurihara/workspace/domestic-account-booking/tests/fixtures/demo-csvs/large-dataset.csv`
20. `/Users/takuya.kurihara/workspace/domestic-account-booking/tests/fixtures/demo-csvs/invalid-missing-columns.csv`
21. `/Users/takuya.kurihara/workspace/domestic-account-booking/tests/fixtures/demo-csvs/special-characters.csv`

### Documentation
22. `/Users/takuya.kurihara/workspace/domestic-account-booking/e2e/demo/README.md`
23. `/Users/takuya.kurihara/workspace/domestic-account-booking/E2E-DEMO-DELIVERY.md`
24. `/Users/takuya.kurihara/workspace/domestic-account-booking/E2E-DEMO-FILE-MANIFEST.md`

## Modified Files (Absolute Paths)

1. `/Users/takuya.kurihara/workspace/domestic-account-booking/package.json`
   - Added: `test:e2e:demo` script
   - Added: `test:e2e:demo:ui` script

## Total Files
- Created: 24 files
- Modified: 1 file
- Total: 25 file operations

## Directory Structure
```
/Users/takuya.kurihara/workspace/domestic-account-booking/
├── e2e/
│   ├── demo/
│   │   ├── 01-onboarding.spec.ts
│   │   ├── 02-partner-invitation.spec.ts
│   │   ├── 03-manual-transactions.spec.ts
│   │   ├── 04-csv-upload.spec.ts
│   │   ├── 05-transaction-classification.spec.ts
│   │   ├── 06-filtering.spec.ts
│   │   ├── 07-pagination.spec.ts
│   │   ├── 08-deletion.spec.ts
│   │   ├── 09-settlement-equal.spec.ts
│   │   ├── 10-settlement-unequal.spec.ts
│   │   ├── 11-settlement-common-account.spec.ts
│   │   ├── 12-ratio-update.spec.ts
│   │   ├── 13-logout-session.spec.ts
│   │   ├── 14-error-handling.spec.ts
│   │   ├── 15-edge-cases.spec.ts
│   │   └── README.md
│   ├── fixtures/
│   │   └── demo-data.ts
│   └── utils/
│       └── demo-helpers.ts
├── tests/
│   └── fixtures/
│       └── demo-csvs/
│           ├── valid-transactions.csv
│           ├── large-dataset.csv
│           ├── invalid-missing-columns.csv
│           └── special-characters.csv
├── E2E-DEMO-DELIVERY.md
├── E2E-DEMO-FILE-MANIFEST.md
└── package.json (modified)
```
