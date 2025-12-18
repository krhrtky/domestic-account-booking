/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // =================================================================
    // L-OC-002: 精算ロジックの単一実装
    // Settlement logic must only exist in src/lib/settlement.ts
    // =================================================================
    {
      name: 'L-OC-002-no-settlement-duplication',
      comment: 'L-OC-002: 精算計算ロジックは src/lib/settlement.ts のみに集約',
      severity: 'error',
      from: {
        pathNot: '^src/lib/settlement\\.ts$'
      },
      to: {
        path: 'calculateSettlement|calculateBalance|SettlementResult',
        pathNot: '^src/lib/(settlement|types)\\.ts$'
      }
    },

    // =================================================================
    // Layer Architecture Rules
    // =================================================================
    {
      name: 'ARCH-no-lib-to-app',
      comment: 'lib/ must not import from app/ (layer violation)',
      severity: 'error',
      from: {
        path: '^src/lib/'
      },
      to: {
        path: '^app/'
      }
    },
    {
      name: 'ARCH-no-lib-to-components',
      comment: 'lib/ must not import from components/ (layer violation)',
      severity: 'error',
      from: {
        path: '^src/lib/'
      },
      to: {
        path: '^src/components/'
      }
    },
    {
      name: 'ARCH-no-components-to-db',
      comment: 'Components must not import db.ts directly (use server actions)',
      severity: 'error',
      from: {
        path: '^src/components/'
      },
      to: {
        path: '^src/lib/db\\.ts$'
      }
    },

    // =================================================================
    // L-SC-002: Database Access Control
    // =================================================================
    {
      name: 'L-SC-002-db-access-control',
      comment: 'L-SC-002: DB access only through src/lib/db.ts',
      severity: 'error',
      from: {
        pathNot: '^src/lib/db\\.ts$'
      },
      to: {
        path: '^node_modules/pg'
      }
    },

    // =================================================================
    // Circular Dependencies
    // =================================================================
    {
      name: 'no-circular',
      comment: 'Circular dependencies are not allowed',
      severity: 'error',
      from: {},
      to: {
        circular: true
      }
    },

    // =================================================================
    // Orphan Modules
    // =================================================================
    {
      name: 'no-orphans',
      comment: 'Modules should be imported somewhere',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$', // dotfiles
          '\\.d\\.ts$',                             // TypeScript declaration files
          '(^|/)tsconfig\\.json$',
          '(^|/)vitest\\.config\\.[cm]?ts$',
          '(^|/)playwright\\.config\\.[cm]?ts$',
          '(^|/)next\\.config\\.[cm]?js$',
          '(^|/)postcss\\.config\\.[cm]?js$',
          '(^|/)tailwind\\.config\\.[cm]?js$',
          '^app/layout\\.tsx$',
          '^app/page\\.tsx$',
          '^app/globals\\.css$',
          '^src/middleware\\.ts$',
          '^middleware\\.ts$',
          '\\.test\\.ts$',
          '\\.spec\\.ts$',
          '^tests/',
          '^e2e/',
          '^scripts/'
        ]
      },
      to: {}
    },

    // =================================================================
    // Test Isolation
    // =================================================================
    {
      name: 'no-prod-to-test',
      comment: 'Production code should not import test files',
      severity: 'error',
      from: {
        path: '^(src|app)/',
        pathNot: '\\.(test|spec)\\.'
      },
      to: {
        path: '\\.(test|spec)\\.|^tests/|^e2e/'
      }
    },

    // =================================================================
    // L-SC-003: No Direct Secret Access
    // =================================================================
    {
      name: 'L-SC-003-secret-isolation',
      comment: 'L-SC-003: Secrets should be accessed via environment only',
      severity: 'warn',
      from: {
        path: '^src/components/'
      },
      to: {
        path: 'process\\.env'
      }
    }
  ],

  options: {
    doNotFollow: {
      path: [
        'node_modules',
        '\\.next',
        'dist',
        'build',
        'coverage',
        'test-results',
        'playwright-report'
      ]
    },

    includeOnly: [
      '^src/',
      '^app/',
      '^tests/',
      '^e2e/'
    ],

    exclude: [
      '\\.d\\.ts$',
      'node_modules'
    ],

    tsPreCompilationDeps: true,

    tsConfig: {
      fileName: 'tsconfig.json'
    },

    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['main', 'types']
    },

    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho'
          }
        }
      },
      text: {
        highlightFocused: true
      }
    },

    cache: {
      strategy: 'content',
      folder: 'node_modules/.cache/dependency-cruiser'
    },

    progress: {
      type: 'performance-log'
    }
  }
};
