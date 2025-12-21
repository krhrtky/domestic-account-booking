// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextConfig from 'eslint-config-next';

const config = [...nextConfig, {
  rules: {
    'react-hooks/set-state-in-effect': 'warn',
  },
}, {
  ignores: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    '.vitest/**',
    'storybook-static/**',
  ],
}, ...storybook.configs["flat/recommended"]];

export default config;
