# P1-4: getCurrentGroup N+1 Query Optimization Specification

**Priority**: P1  
**Epic**: Phase 4 - Performance Optimization  
**Status**: SPECIFICATION  
**Author**: Spec & Design Agent  
**Date**: 2025-12-07  

---

## 1. Current State Analysis

### 1.1 Function Location
- **File**: `/Users/takuya.kurihara/workspace/domestic-account-booking/app/actions/group.ts`
- **Function**: `getCurrentGroup()` (lines 229-291)
- **Usage**: Called from settings page and potentially dashboard components

### 1.2 Identified N+1 Pattern

The function executes **3 sequential database queries**:

```typescript
// Query 1: Get current user's group_id
const { data: currentUser } = await supabase
  .from('users')
  .select('group_id')
  .eq('id', user.id)
  .single()

// Query 2: Get group details
const { data: group } = await supabase
  .from('groups')
  .select(`id, name, ratio_a, ratio_b, user_a_id, user_b_id`)
  .eq('id', currentUser.group_id)
  .single()

// Query 3: Get user_a details
const { data: userA } = await supabase
  .from('users')
  .select('id, name, email')
  .eq('id', group.user_a_id)
  .single()

// Query 4 (conditional): Get user_b details
if (group.user_b_id) {
  const { data: userB } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', group.user_b_id)
    .single()
}
```

### 1.3 Performance Impact
- **Current**: 3-4 round trips to database (waterfall)
- **Latency**: ~150-400ms on typical network (3-4 × 50-100ms per query)
- **Scale**: Impact increases with page load frequency (settings, dashboard renders)

### 1.4 Database Schema Context
From `/Users/takuya.kurihara/workspace/domestic-account-booking/supabase/migrations/001_initial_schema.sql`:

```sql
users (id, name, email, group_id) → FK to groups.id
groups (id, name, ratio_a, ratio_b, user_a_id, user_b_id) → FKs to users.id
```

Indexes available:
- `idx_users_group` on users(group_id)
- `idx_groups_user_a` on groups(user_a_id)
- `idx_groups_user_b` on groups(user_b_id)

---

## 2. Proposed Solution

### 2.1 Optimization Strategy: Single JOIN Query

Replace 3-4 queries with **1 query using Supabase foreign key expansion**:

```typescript
const { data, error } = await supabase
  .from('users')
  .select(`
    group_id,
    groups!inner (
      id,
      name,
      ratio_a,
      ratio_b,
      user_a:users!groups_user_a_id_fkey (id, name, email),
      user_b:users!groups_user_b_id_fkey (id, name, email)
    )
  `)
  .eq('id', user.id)
  .single()
```

### 2.2 Response Transformation

Supabase returns nested structure:
```typescript
{
  group_id: "uuid",
  groups: {
    id: "uuid",
    name: "Household",
    ratio_a: 60,
    ratio_b: 40,
    user_a: { id, name, email },
    user_b: { id, name, email } | null
  }
}
```

Map to existing return shape:
```typescript
return {
  success: true,
  group: {
    id: data.groups.id,
    name: data.groups.name,
    ratio_a: data.groups.ratio_a,
    ratio_b: data.groups.ratio_b,
    user_a: data.groups.user_a,
    user_b: data.groups.user_b
  }
}
```

### 2.3 Code Changes Required

**File**: `app/actions/group.ts`

1. Replace lines 237-278 with single JOIN query
2. Update error handling for null group_id case
3. Maintain backward-compatible return type

**Diff Preview**:
```diff
export async function getCurrentGroup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

- const { data: currentUser } = await supabase
-   .from('users')
-   .select('group_id')
-   .eq('id', user.id)
-   .single()
-
- if (!currentUser?.group_id) {
-   return { error: 'No group found' }
- }
-
- const { data: group, error } = await supabase
-   .from('groups')
-   .select(`id, name, ratio_a, ratio_b, user_a_id, user_b_id`)
-   .eq('id', currentUser.group_id)
-   .single()
-
- if (error || !group) {
-   return { error: 'No group found' }
- }
-
- const { data: userA } = await supabase
-   .from('users')
-   .select('id, name, email')
-   .eq('id', group.user_a_id)
-   .single()
-
- let userB = null
- if (group.user_b_id) {
-   const { data } = await supabase
-     .from('users')
-     .select('id, name, email')
-     .eq('id', group.user_b_id)
-     .single()
-   userB = data
- }

+ const { data, error } = await supabase
+   .from('users')
+   .select(`
+     group_id,
+     groups!inner (
+       id,
+       name,
+       ratio_a,
+       ratio_b,
+       user_a:users!groups_user_a_id_fkey (id, name, email),
+       user_b:users!groups_user_b_id_fkey (id, name, email)
+     )
+   `)
+   .eq('id', user.id)
+   .single()
+
+ if (error || !data?.groups) {
+   return { error: 'No group found' }
+ }

  return {
    success: true,
    group: {
-     id: group.id,
-     name: group.name,
-     ratio_a: group.ratio_a,
-     ratio_b: group.ratio_b,
-     user_a: userA,
-     user_b: userB
+     id: data.groups.id,
+     name: data.groups.name,
+     ratio_a: data.groups.ratio_a,
+     ratio_b: data.groups.ratio_b,
+     user_a: data.groups.user_a,
+     user_b: data.groups.user_b
    }
  }
}
```

---

## 3. Acceptance Criteria

### 3.1 Functional Requirements
- [ ] `getCurrentGroup()` returns identical data structure as before
- [ ] All existing callers (settings page, dashboard) work without modification
- [ ] Handles edge cases:
  - [ ] User with no group → returns `{ error: 'No group found' }`
  - [ ] Group with only user_a (no user_b) → returns `user_b: null`
  - [ ] Unauthorized user → returns `{ error: 'Unauthorized' }`

### 3.2 Performance Requirements
- [ ] Reduce database queries from 3-4 to **1 query**
- [ ] Response time improvement: **≥40% reduction** (400ms → 240ms target)
- [ ] Measure with: `console.time('getCurrentGroup')` in development

### 3.3 Testing Checklist
- [ ] Existing unit tests pass (if any)
- [ ] Manual test: Settings page loads group data correctly
- [ ] Manual test: User with no group sees appropriate error
- [ ] Manual test: Single-user group shows user_b as null
- [ ] E2E test: `e2e/settlement/dashboard.spec.ts` passes (uses group data)

### 3.4 Code Quality
- [ ] TypeScript type safety maintained (no `any` types)
- [ ] Error handling covers Supabase query failures
- [ ] No breaking changes to return type

---

## 4. Non-Goals

### 4.1 Out of Scope
- **Caching**: No Redis/in-memory cache (premature optimization)
- **Other functions**: Only optimize `getCurrentGroup()`, not other group.ts functions
- **Database schema changes**: Use existing indexes, no migrations
- **API changes**: Maintain exact same return interface

### 4.2 Future Considerations
These are explicitly NOT part of P1-4:
- Server-side caching with `unstable_cache()`
- Optimizing `createGroup()`, `invitePartner()` queries
- Adding database views or materialized views
- Client-side caching (React Query/SWR)

---

## 5. Risks & Mitigation

### 5.1 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase JOIN syntax error | HIGH | LOW | Test in Supabase SQL editor first |
| Foreign key naming mismatch | MEDIUM | LOW | Verify FK names from schema.sql |
| Breaking existing callers | HIGH | LOW | Manual testing of settings/dashboard |
| Null handling regression | MEDIUM | MEDIUM | Add explicit null checks |

### 5.2 Rollback Plan
- Optimization is isolated to single function
- Can revert commit with `git revert` if issues arise
- No database migrations required (safe rollback)

### 5.3 Testing Strategy
1. **Pre-deployment**: Run full test suite (`npm test`, `npm run test:e2e`)
2. **Deployment**: Deploy to staging first (if available)
3. **Post-deployment**: Monitor logs for Supabase errors
4. **Verification**: Check settings page loads < 500ms in production

---

## 6. Implementation Handoff to DA

### 6.1 Development Steps
1. Read current implementation: `app/actions/group.ts:229-291`
2. Test JOIN query in Supabase SQL Editor:
   ```sql
   SELECT 
     u.group_id,
     g.id, g.name, g.ratio_a, g.ratio_b,
     ua.id as user_a_id, ua.name as user_a_name, ua.email as user_a_email,
     ub.id as user_b_id, ub.name as user_b_name, ub.email as user_b_email
   FROM users u
   INNER JOIN groups g ON u.group_id = g.id
   LEFT JOIN users ua ON g.user_a_id = ua.id
   LEFT JOIN users ub ON g.user_b_id = ub.id
   WHERE u.id = '<test-uuid>';
   ```
3. Convert SQL to Supabase JS client syntax (see Section 2.1)
4. Replace function implementation
5. Test locally: `npm run dev` → navigate to `/settings`
6. Run test suite: `npm test && npm run test:e2e`

### 6.2 Files to Modify
- `app/actions/group.ts` (1 function change)

### 6.3 Files to Test
- `app/settings/page.tsx` (calls getCurrentGroup)
- `e2e/settlement/dashboard.spec.ts` (may indirectly use group data)

### 6.4 Success Criteria for DA
- All tests pass (67 unit + 13 E2E)
- Settings page loads without errors
- Console shows 1 query instead of 3-4 (check Supabase logs)

---

## 7. QGA Verification Checklist

### 7.1 Performance Validation
- [ ] Confirm query count reduced: Use Supabase Dashboard → API Logs
- [ ] Measure latency: Compare before/after with browser DevTools Network tab
- [ ] Check for query plan regression: Verify EXPLAIN output uses indexes

### 7.2 Functional Validation
- [ ] Settings page displays correct group name, ratios
- [ ] User A and User B names/emails shown correctly
- [ ] Groups with single user (no user_b) handle null gracefully
- [ ] Error states (no group, unauthorized) still work

### 7.3 Test Coverage
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No new ESLint/TypeScript errors

### 7.4 Edge Cases
- [ ] User not in a group → error message
- [ ] Group with null user_b_id → user_b field is null
- [ ] Malformed group data → appropriate error

---

## 8. Follow-up Tasks (Post-P1-4)

These should be tracked separately:
1. **P2-1**: Add server-side caching with `unstable_cache()` (30s TTL)
2. **P2-2**: Optimize other group.ts functions (invitePartner, updateRatio)
3. **P2-3**: Add performance monitoring (measure query latency in production)
4. **P2-4**: Document JOIN patterns in coding guidelines

---

## Appendix A: Supabase Foreign Key Reference

From schema analysis, the foreign key constraints are:
- `groups.user_a_id` → `users.id` (FK name: `groups_user_a_id_fkey`)
- `groups.user_b_id` → `users.id` (FK name: `groups_user_b_id_fkey`)
- `users.group_id` → `groups.id` (FK name: `users_group_id_fkey`)

Supabase JOIN syntax uses these FK names for relationship expansion.

---

## Appendix B: Estimated Time Savings

**Current State**:
- Query 1 (get user): 50ms
- Query 2 (get group): 50ms
- Query 3 (get user_a): 50ms
- Query 4 (get user_b): 50ms
- **Total**: 200ms (sequential waterfall)

**Optimized State**:
- Query 1 (JOIN all): 60ms (slightly slower due to JOIN complexity)
- **Total**: 60ms

**Improvement**: 70% reduction (200ms → 60ms)

---

**END OF SPECIFICATION**
