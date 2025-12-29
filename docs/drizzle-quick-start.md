# Drizzle ORM Quick Start Guide

## Import Drizzle Client

```typescript
import { db } from '@/db/client'
import { users, groups, transactions } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
```

## Common Query Patterns

### SELECT Queries

```typescript
// Select specific columns
const result = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
  })
  .from(users)
  .where(eq(users.id, userId))

// Select all columns
const allUsers = await db.select().from(users)

// With JOIN
const result = await db
  .select({
    userId: users.id,
    userName: users.name,
    groupName: groups.name,
  })
  .from(users)
  .innerJoin(groups, eq(users.groupId, groups.id))
  .where(eq(users.id, userId))
```

### INSERT Queries

```typescript
// Insert single record
const [newGroup] = await db
  .insert(groups)
  .values({
    name: 'My Group',
    ratioA: 60,
    ratioB: 40,
    userAId: userId,
  })
  .returning({ id: groups.id })

// Insert multiple records
await db.insert(transactions).values([
  { groupId, userId, date: '2025-01-01', amount: '1000', ... },
  { groupId, userId, date: '2025-01-02', amount: '2000', ... },
])
```

### UPDATE Queries

```typescript
// Update with WHERE clause
await db
  .update(groups)
  .set({ ratioA: 60, ratioB: 40 })
  .where(eq(groups.id, groupId))

// Update with RETURNING
const [updated] = await db
  .update(users)
  .set({ name: 'New Name' })
  .where(eq(users.id, userId))
  .returning()
```

### DELETE Queries

```typescript
// Delete with WHERE clause
await db
  .delete(transactions)
  .where(eq(transactions.id, transactionId))

// Delete with complex conditions
await db
  .delete(transactions)
  .where(and(
    eq(transactions.groupId, groupId),
    gte(transactions.date, '2025-01-01'),
    lte(transactions.date, '2025-01-31')
  ))
```

### Transactions

```typescript
const result = await db.transaction(async (tx) => {
  // All queries must use 'tx' instead of 'db'
  const [newGroup] = await tx
    .insert(groups)
    .values({ name: 'Group', ratioA: 50, ratioB: 50, userAId })
    .returning({ id: groups.id })

  await tx
    .update(users)
    .set({ groupId: newGroup.id })
    .where(eq(users.id, userId))

  return newGroup.id
})
```

## Filter Operators

```typescript
import { eq, ne, gt, gte, lt, lte, like, and, or, not, isNull, isNotNull } from 'drizzle-orm'

// Comparison
.where(eq(users.id, userId))           // id = userId
.where(ne(users.name, 'Admin'))        // name != 'Admin'
.where(gt(transactions.amount, '100')) // amount > 100
.where(gte(transactions.amount, '100')) // amount >= 100

// Logical operators
.where(and(
  eq(users.groupId, groupId),
  eq(users.active, true)
))

.where(or(
  eq(users.role, 'admin'),
  eq(users.role, 'owner')
))

// NULL checks
.where(isNull(groups.userBId))
.where(isNotNull(groups.userBId))

// LIKE pattern matching
.where(like(users.email, '%@example.com'))
```

## Type Safety

```typescript
import type { User, NewUser, Transaction } from '@/db/types'

// Inferred types from schema
const user: User = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .then(rows => rows[0])

// Insert types
const newUser: NewUser = {
  id: 'uuid-here',
  name: 'John Doe',
  email: 'john@example.com',
  groupId: null,
}

await db.insert(users).values(newUser)
```

## Migration from Raw SQL

### Before (pg Pool)

```typescript
import { query } from '@/lib/db'

const result = await query<{ id: string, name: string }>(
  'SELECT id, name FROM users WHERE email = $1',
  [email]
)

const user = result.rows[0]
```

### After (Drizzle)

```typescript
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const result = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .where(eq(users.email, email))

const user = result[0]
```

## Best Practices

### 1. Always Specify Selected Columns

```typescript
// ❌ Avoid - Returns all columns
const users = await db.select().from(users)

// ✓ Preferred - Explicit column selection
const users = await db
  .select({ id: users.id, name: users.name })
  .from(users)
```

### 2. Use Transactions for Multiple Operations

```typescript
// ✓ Correct - Atomic operation
await db.transaction(async (tx) => {
  await tx.insert(groups).values(...)
  await tx.update(users).set(...)
})
```

### 3. Type-Safe Filters

```typescript
// ✓ Use Drizzle operators
import { eq } from 'drizzle-orm'
.where(eq(users.id, userId))

// ❌ Avoid raw SQL
.where(sql`id = ${userId}`)
```

### 4. Handle Null Results

```typescript
const result = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))

if (result.length === 0) {
  return { error: 'User not found' }
}

const user = result[0]
```

## Testing with Drizzle

```typescript
import { vi } from 'vitest'

vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockData])
      })
    })
  }
}))
```

## Common Pitfalls

### 1. Forgetting to Await

```typescript
// ❌ Wrong - Returns a promise
const users = db.select().from(users)

// ✓ Correct
const users = await db.select().from(users)
```

### 2. Using db in Transactions

```typescript
// ❌ Wrong - Uses global db
await db.transaction(async (tx) => {
  await db.insert(groups).values(...)  // Won't rollback!
})

// ✓ Correct - Uses transaction tx
await db.transaction(async (tx) => {
  await tx.insert(groups).values(...)  // Will rollback on error
})
```

### 3. Missing Where Clause

```typescript
// ⚠️ Warning - Updates ALL rows
await db.update(users).set({ active: false })

// ✓ Correct - Updates specific rows
await db.update(users)
  .set({ active: false })
  .where(eq(users.id, userId))
```

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Query Examples](https://orm.drizzle.team/docs/select)
- [Schema Definition](https://orm.drizzle.team/docs/sql-schema-declaration)
- [Migration Guide](/docs/drizzle-migration.md)
