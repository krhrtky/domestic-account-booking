# Repository Guidelines

## Project Structure & Module Organization
- Central requirements live in `REQUIREMENTS.md`; treat it as the source-of-truth PRD for the household settlement app.
- When scaffolding the product, place application code under `src/` or `app/` (Next.js recommended), shared UI in `src/components/`, and domain logic in `src/lib/` (settlement calculations, CSV parsing).
- Keep tests parallel to code (`src/lib/settlement.test.ts`, `src/components/__tests__/…`) and store fixtures in `tests/fixtures/`.
- Assets such as CSV samples should sit in `public/` so they are web-accessible.

## Build, Test, and Development Commands
- After initializing the project: `npm install` (or `pnpm install`) to fetch dependencies.
- Local dev server: `npm run dev` for Next.js with hot reload.
- Type checking: `npm run type-check` when TypeScript is configured.
- Linting: `npm run lint` to enforce formatting and catch obvious issues.
- Tests: `npm test` for unit/integration; add `npm run test:watch` for TDD loops.

## Coding Style & Naming Conventions
- Language: TypeScript-first for both front-end and server actions.
- Formatting: Prettier with 2-space indentation; run via `npm run lint -- --fix` if configured.
- Components: use PascalCase (`HouseholdForm`); hooks and utilities in camelCase (`useSettlement`, `calculateBalance`).
- Files: keep React components in `.tsx`; pure logic in `.ts`; co-locate styles with components if using CSS modules.

## Testing Guidelines
- Prefer Vitest or Jest for unit coverage; use Testing Library for React behavior.
- Name tests after the unit under test (`settlement.test.ts`, `csv-import.spec.ts`).
- Cover the simple settlement logic described in the PRD, including edge cases for ratios and personal/common spend.
- Aim for high coverage on `src/lib/` (core calculations) before UI layers.

## Commit & Pull Request Guidelines
- Use clear, present-tense commit messages; conventional commits (e.g., `feat: add settlement calc`) are encouraged for clarity.
- PRs should link the relevant PRD section and include: summary, testing notes (`npm test`, `npm run lint`), and screenshots/GIFs for UI changes.
- Keep PRs scoped: separate data-model changes from UI work; add migration notes when adjusting schemas.

## Architecture & Security Notes
- Follow the PRD's recommended stack: Next.js + TypeScript + Tailwind with PostgreSQL.
- Keep business rules (settlement math, CSV normalization) in pure functions to enable deterministic testing.
- Store secrets in environment variables (`.env.local`); do not commit them. Document required keys in a `.env.example`.
- Validate CSV uploads server-side and strip/escape user input to avoid injection in rendered views.
