# Drizzle ORM Migration

## Overview

This document describes the Drizzle ORM implementation for the domestic-account-booking application, completed as per specification from spec-design-agent (agent a80ed77).

## Implementation Summary

### 1. Dependencies Installed

```json
{
  "drizzle-orm": "^0.45.1",
  "drizzle-kit": "^0.31.8",
  "postgres": "^3.4.7"
}
```

### 2. Directory Structure Created

```
src/db/
├── schema.ts          # Drizzle schema definitions
├── client.ts          # Database client configuration
├── types.ts           # TypeScript type exports
└── __tests__/
    └── schema.test.ts # Schema validation tests
```

### 3. Files Modified

- `app/actions/group.ts` - Migrated to Drizzle ORM (pilot module)
- `package.json` - Added Drizzle scripts and dependencies
- `tsconfig.json` - Added `@/db/*` path alias
- Created `drizzle.config.ts` - Drizzle Kit configuration

### 4. Business Logic Preserved

- Settlement calculation logic (`src/lib/settlement.ts`) **UNTOUCHED** per L-OC-002
- All existing tests (237) pass without modification
- No breaking changes to API contracts

## Schema Validation

All database tables are defined in `src/db/schema.ts`:

- `custom_auth.users` - Authentication users
- `users` - Application users
- `groups` - Household groups with ratio constraints
- `transactions` - Financial transactions with payer tracking
- `invitations` - Group invitation system

### Key Constraints Preserved

- Ratio sum check: `ratio_a + ratio_b = 100`
- Unique user pair check: `user_a_id != user_b_id`
- Payer type constraints: `UserA | UserB | Common`
- Expense type constraints: `Household | Personal`

## Query Migration (Pilot Module)

`app/actions/group.ts` was successfully migrated:

### Before (Raw SQL with pg)
```typescript
const result = await query<{ group_id: string | null }>(
  'SELECT group_id FROM users WHERE id = $1',
  [user.id]
)
```

### After (Drizzle ORM)
```typescript
const existingUser = await db
  .select({ groupId: users.groupId })
  .from(users)
  .where(eq(users.id, user.id))
  .limit(1)
```

### Migration Benefits

1. Type-safe queries with IDE autocomplete
2. Automatic SQL generation
3. Query builder pattern reduces SQL injection risk
4. Better refactoring support with TypeScript

## Tests

### Unit Tests

- `src/db/__tests__/schema.test.ts` - Schema definition validation (6 tests)
- `app/actions/__tests__/group.test.ts` - Group actions business logic (8 tests)

### Coverage

- All existing tests pass: **237/237** ✓
- New Drizzle tests added: **14 tests**
- Total test count: **251 tests**

### Test Commands

```bash
npm test                              # Run all tests
npm test -- src/db                    # Run DB schema tests
npm test -- app/actions/__tests__/group.test.ts  # Run group action tests
```

## Code Quality

### Linting & Type Checking

```bash
npm run lint        # ✓ Passed
npm run type-check  # ✓ Passed
```

### Laws Compliance

- **L-OC-001**: Coding standards - ESLint/Prettier compliant
- **L-OC-002**: Settlement logic centralization - Untouched
- **L-BR-001**: Settlement calculation - Formula preserved
- **L-BR-002**: Payer rules - Schema constraints enforced
- **L-BR-003**: Expense type rules - Schema constraints enforced
- **L-SC-001**: Authentication - requireAuth() preserved
- **L-SC-003**: Secrets protection - DATABASE_URL in env vars
- **L-AS-002**: Input validation - Zod schemas preserved

## Deployment Notes

### Environment Variables

Required in `.env.local`:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

### Migration Strategy

1. **Current State**: Existing PostgreSQL migrations remain active
2. **Drizzle Schema**: Mirrors existing structure - no schema changes required
3. **Gradual Migration**: Other modules can be migrated incrementally

### Database Operations

```bash
# Generate migrations from schema
npm run db:generate

# Push schema changes to database (dev only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Production Deployment

1. No migration scripts need to run (schema matches existing DB)
2. Deploy code changes as normal
3. Existing PostgreSQL migrations continue to work
4. Drizzle and pg Pool can coexist during transition

## Runbook

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Run Tests Before Commit**
   ```bash
   npm test -- --run
   npm run lint
   npm run type-check
   ```

3. **Schema Changes**
   - Update `src/db/schema.ts`
   - Run `npm run db:generate` to create migration
   - Test locally with `npm run db:push`
   - Create SQL migration in `supabase/migrations/`

### Troubleshooting

#### Type Errors in Queries

```typescript
// ❌ Wrong
const result = await db.select().from(users)

// ✓ Correct
const result = await db
  .select({ id: users.id, name: users.name })
  .from(users)
```

#### Transaction Failures

```typescript
// Use Drizzle transactions
await db.transaction(async (tx) => {
  await tx.insert(groups).values(...)
  await tx.update(users).set(...)
})
```

#### Database Connection Issues

Check:
1. `DATABASE_URL` is set correctly
2. Database is running and accessible
3. Connection pool settings in `src/db/client.ts`

## Future Migration Path

### Phase 1: Complete (Pilot Module)
- ✓ Drizzle infrastructure setup
- ✓ Schema definitions
- ✓ `app/actions/group.ts` migration
- ✓ Tests passing

### Phase 2: Recommended Next Steps
1. Migrate `app/actions/transactions.ts`
2. Migrate `app/actions/auth.ts`
3. Migrate `app/actions/csv-mappings.ts`
4. Update `src/lib/db-cache.ts` to use Drizzle

### Phase 3: Complete Migration
1. Remove `src/lib/db.ts` (pg Pool)
2. Update all direct SQL queries to Drizzle
3. Consolidate migration systems

## Questions & Assumptions

### Assumptions Made

1. **Schema Compatibility**: Assumed existing database schema is stable and should not be modified
2. **Incremental Migration**: Assumed gradual migration is acceptable (Drizzle + pg coexistence)
3. **Type Safety**: Prioritized type safety over SQL flexibility
4. **Testing Strategy**: Assumed mocked tests are acceptable for pilot phase

### Open Questions

1. **Performance**: Should we benchmark Drizzle queries vs raw SQL for high-traffic endpoints?
2. **Migration Timeline**: What is the target completion date for full migration?
3. **Drizzle Migrations**: Should we fully adopt Drizzle migrations or keep PostgreSQL migrations?
4. **Connection Pooling**: Should we consolidate to one connection pool or maintain separate pools?

## Related Documentation

- [Laws/README.md](/docs/laws/README.md) - Development rules
- [L-OC-002](/docs/laws/05-organizational-consistency.md#l-oc-002-settlement-logic-centralization) - Settlement logic rules
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview) - Official documentation
- [PostgreSQL Migrations](/supabase/migrations/) - Existing migration files

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-28 | Initial Drizzle ORM implementation | Coding Agent |
| 2025-12-28 | Pilot migration: app/actions/group.ts | Coding Agent |
| 2025-12-28 | Tests added and passing (251 total) | Coding Agent |
