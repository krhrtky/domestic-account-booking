import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    watch: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/e2e/**',
        '**/.storybook/**',
        '**/storybook-static/**',
        '**/*.config.{js,ts,mjs}',
        '**/*.d.ts',
        '**/types.ts',
        'tests/**',
        '.next/**',
        'app/**/*.tsx',
        'app/actions/csv-mappings.ts',
        'app/api/auth/**',
        'app/api/test/**',
        'src/components/**',
        'src/lib/hooks/**',
        'scripts/**',
        '**/*.stories.tsx',
        '.dependency-cruiser.js',
      ],
      thresholds: {
        lines: 80,
        functions: 60,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
