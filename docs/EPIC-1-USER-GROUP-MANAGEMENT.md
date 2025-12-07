# Epic 1: User & Group Management - Detailed Specification

**Version:** 1.0  
**Date:** 2025-12-07  
**Status:** Ready for Implementation  
**Owner:** Product Agent  
**Target:** Delivery Agent

---

## 1. Scope

### 1.1 What We're Building

Epic 1 establishes the foundation for the household settlement app by implementing:

1. **User Authentication**: Email/password registration and login via Supabase Auth
2. **User Profile Management**: Store user metadata (name, email) in custom `users` table
3. **Household Group Creation**: Allow primary user to create a household group
4. **Partner Invitation**: Email-based invitation mechanism for adding second user
5. **Income Ratio Configuration**: UI for setting/updating the split ratio (default 50:50)

### 1.2 In-Scope Features

- Supabase Auth integration (@supabase/supabase-js)
- Database schema (users + groups tables with RLS)
- Server Actions for auth flows (signup, login, logout)
- Server Actions for group operations (create, invite, update ratio)
- UI components: SignupForm, LoginForm, GroupSettings
- Partner invitation via email link (simple token-based)
- Form validation with Zod schemas
- Protected routes (middleware redirect for unauthenticated users)

### 1.3 Non-Goals (Deferred to Future Phases)

- OAuth providers (Google, GitHub) - Phase 3
- Email verification enforcement - Phase 2 (MVP allows unverified users)
- Multiple households per user - Out of scope (1 group per user pair forever)
- Real-time collaboration (WebSocket) - Phase 3
- Invitation expiry/management - Phase 2
- User profile avatars - Phase 3
- Password reset flow - Phase 2 (Supabase default email flow acceptable for MVP)

---

## 2. API Design (Server Actions)

### 2.1 Authentication Actions

**File**: `/src/app/actions/auth.ts`

#### Action: `signUp`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SignUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function signUp(formData: FormData) {
  const parsed = SignUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password')
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      name,
      email
    })

  if (profileError) {
    return { error: 'Failed to create user profile' }
  }

  return { success: true }
}
```

**Input Schema**:
- `name`: string, 1-100 chars
- `email`: valid email format
- `password`: min 8 chars

**Output**:
- Success: `{ success: true }`
- Error: `{ error: string | FieldErrors }`

**Side Effects**:
1. Creates Supabase Auth user
2. Inserts row into `users` table
3. Returns session cookie (handled by Supabase client)

---

#### Action: `logIn`

```typescript
'use server'

export async function logIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  return { success: true }
}
```

**Input**: FormData with `email` and `password`  
**Output**: `{ success: true }` or `{ error: string }`

---

#### Action: `logOut`

```typescript
'use server'

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
```

**Input**: None  
**Output**: `{ success: true }`  
**Side Effect**: Clears session cookie, redirects to `/login`

---

### 2.2 Group Management Actions

**File**: `/src/app/actions/group.ts`

#### Action: `createGroup`

```typescript
'use server'

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100).default('Household'),
  ratio_a: z.number().int().min(1).max(99).default(50),
  ratio_b: z.number().int().min(1).max(99).default(50)
}).refine(
  data => data.ratio_a + data.ratio_b === 100,
  { message: 'Ratios must sum to 100' }
)

export async function createGroup(data: {
  name?: string
  ratio_a?: number
  ratio_b?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const parsed = CreateGroupSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (existingUser?.group_id) {
    return { error: 'User already belongs to a group' }
  }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: parsed.data.name,
      ratio_a: parsed.data.ratio_a,
      ratio_b: parsed.data.ratio_b,
      user_a_id: user.id
    })
    .select()
    .single()

  if (groupError) {
    return { error: 'Failed to create group' }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ group_id: group.id })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Failed to link user to group' }
  }

  return { success: true, group_id: group.id }
}
```

**Input**:
```typescript
{
  name?: string,      // default: 'Household'
  ratio_a?: number,   // default: 50
  ratio_b?: number    // default: 50
}
```

**Output**:
- Success: `{ success: true, group_id: string }`
- Error: `{ error: string }`

**Constraints**:
- User must be authenticated
- User must not already belong to a group
- `ratio_a + ratio_b === 100`

---

#### Action: `invitePartner`

```typescript
'use server'

const InviteSchema = z.object({
  email: z.string().email()
})

export async function invitePartner(email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  const { data: group } = await supabase
    .from('groups')
    .select('user_a_id, user_b_id')
    .eq('id', currentUser.group_id)
    .single()

  if (group?.user_b_id) {
    return { error: 'Group already has two members' }
  }

  if (group?.user_a_id !== user.id) {
    return { error: 'Only group creator can invite partners' }
  }

  const inviteToken = crypto.randomUUID()
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`

  await supabase
    .from('invitations')
    .insert({
      id: inviteToken,
      group_id: currentUser.group_id,
      inviter_id: user.id,
      invitee_email: email,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })

  // TODO: Send email via Supabase Edge Function or Resend API
  console.log(`Invitation URL: ${inviteUrl}`)

  return { success: true, invite_url: inviteUrl }
}
```

**Input**: `email: string`  
**Output**: `{ success: true, invite_url: string }` or `{ error: string }`

**Database Changes Required**:
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  inviter_id UUID NOT NULL REFERENCES users(id),
  invitee_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Email Template** (to be sent):
```
Subject: Join Household Settlement App

Hi,

You've been invited to join a household group on Household Settlement.

Click here to join: {invite_url}

This link expires in 7 days.
```

---

#### Action: `acceptInvitation`

```typescript
'use server'

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign up or log in first' }
  }

  const { data: invite, error: inviteError } = await supabase
    .from('invitations')
    .select('*, groups(*)')
    .eq('id', token)
    .single()

  if (inviteError || !invite) {
    return { error: 'Invalid or expired invitation' }
  }

  if (invite.used_at) {
    return { error: 'Invitation already used' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'Invitation expired' }
  }

  const { error: updateUserError } = await supabase
    .from('users')
    .update({ group_id: invite.group_id })
    .eq('id', user.id)

  if (updateUserError) {
    return { error: 'Failed to join group' }
  }

  const { error: updateGroupError } = await supabase
    .from('groups')
    .update({ user_b_id: user.id })
    .eq('id', invite.group_id)

  if (updateGroupError) {
    return { error: 'Failed to update group' }
  }

  await supabase
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', token)

  return { success: true }
}
```

**Input**: `token: string` (from URL `/invite/{token}`)  
**Output**: `{ success: true }` or `{ error: string }`

---

#### Action: `updateRatio`

```typescript
'use server'

const RatioSchema = z.object({
  ratio_a: z.number().int().min(1).max(99),
  ratio_b: z.number().int().min(1).max(99)
}).refine(
  data => data.ratio_a + data.ratio_b === 100,
  { message: 'Ratios must sum to 100' }
)

export async function updateRatio(ratioA: number, ratioB: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const parsed = RatioSchema.safeParse({ ratio_a: ratioA, ratio_b: ratioB })
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', user.id)
    .single()

  if (!currentUser?.group_id) {
    return { error: 'User is not in a group' }
  }

  const { error } = await supabase
    .from('groups')
    .update({
      ratio_a: parsed.data.ratio_a,
      ratio_b: parsed.data.ratio_b
    })
    .eq('id', currentUser.group_id)

  if (error) {
    return { error: 'Failed to update ratio' }
  }

  return { success: true }
}
```

**Input**: `ratio_a: number`, `ratio_b: number`  
**Output**: `{ success: true }` or `{ error: string }`

---

#### Query: `getCurrentGroup`

```typescript
'use server'

export async function getCurrentGroup() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('users')
    .select(`
      group_id,
      groups (
        id,
        name,
        ratio_a,
        ratio_b,
        user_a:users!groups_user_a_id_fkey(id, name, email),
        user_b:users!groups_user_b_id_fkey(id, name, email)
      )
    `)
    .eq('id', user.id)
    .single()

  if (error || !data?.groups) {
    return { error: 'No group found' }
  }

  return { success: true, group: data.groups }
}
```

**Output**:
```typescript
{
  success: true,
  group: {
    id: string,
    name: string,
    ratio_a: number,
    ratio_b: number,
    user_a: { id: string, name: string, email: string },
    user_b: { id: string, name: string, email: string } | null
  }
}
```

---

## 3. Database Schema

### 3.1 SQL Migration

**File**: `/supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Household' CHECK (length(name) > 0 AND length(name) <= 100),
  ratio_a INTEGER NOT NULL DEFAULT 50 CHECK (ratio_a > 0 AND ratio_a < 100),
  ratio_b INTEGER NOT NULL DEFAULT 50 CHECK (ratio_b > 0 AND ratio_b < 100),
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ratio_sum CHECK (ratio_a + ratio_b = 100),
  CONSTRAINT unique_user_pair CHECK (user_a_id != user_b_id)
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_group ON users(group_id);
CREATE INDEX idx_groups_user_a ON groups(user_a_id);
CREATE INDEX idx_groups_user_b ON groups(user_b_id);
CREATE INDEX idx_invitations_group ON invitations(group_id);
CREATE INDEX idx_invitations_email ON invitations(invitee_email);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.2 Row-Level Security (RLS) Policies

**File**: `/supabase/migrations/002_rls_policies.sql`

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Users: Can read own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users: Can update own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users: Service role can insert (signup)
CREATE POLICY "Service can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Groups: Members can read their group
CREATE POLICY "Members can read their group"
  ON groups FOR SELECT
  USING (
    user_a_id = auth.uid() OR user_b_id = auth.uid()
  );

-- Groups: User A can update group
CREATE POLICY "User A can update group"
  ON groups FOR UPDATE
  USING (user_a_id = auth.uid());

-- Groups: Authenticated users can create
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = user_a_id);

-- Invitations: Inviter can read their invitations
CREATE POLICY "Inviters can read their invitations"
  ON invitations FOR SELECT
  USING (inviter_id = auth.uid());

-- Invitations: Authenticated users can read invitations by email
CREATE POLICY "Users can read invitations to their email"
  ON invitations FOR SELECT
  USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Invitations: Group members can create invitations
CREATE POLICY "Group members can invite"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = invitations.group_id
      AND user_a_id = auth.uid()
    )
  );

-- Invitations: Authenticated users can update (accept)
CREATE POLICY "Users can accept invitations"
  ON invitations FOR UPDATE
  USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
```

---

## 4. UI Components

### 4.1 Authentication Pages

#### Page: `/app/(auth)/signup/page.tsx`

```typescript
import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Create Account</h1>
        <SignUpForm />
      </div>
    </div>
  )
}
```

#### Component: `/src/components/auth/SignUpForm.tsx`

```typescript
'use client'

import { useFormStatus } from 'react-dom'
import { signUp } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Creating account...' : 'Sign Up'}
    </button>
  )
}

export function SignUpForm() {
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    const result = await signUp(formData)
    if (result.error) {
      alert(JSON.stringify(result.error))
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          minLength={8}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm"
        />
      </div>
      <SubmitButton />
    </form>
  )
}
```

**Similar Structure for**:
- `/app/(auth)/login/page.tsx`
- `/src/components/auth/LoginForm.tsx`

---

### 4.2 Group Management UI

#### Page: `/app/settings/page.tsx`

```typescript
import { getCurrentGroup } from '@/app/actions/group'
import { GroupSettings } from '@/components/group/GroupSettings'
import { InvitePartner } from '@/components/group/InvitePartner'

export default async function SettingsPage() {
  const { group, error } = await getCurrentGroup()

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p>You are not in a group yet.</p>
        <CreateGroupForm />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Group Settings</h1>
      <GroupSettings group={group} />
      {!group.user_b && <InvitePartner />}
    </div>
  )
}
```

#### Component: `/src/components/group/GroupSettings.tsx`

```typescript
'use client'

import { updateRatio } from '@/app/actions/group'
import { useState } from 'react'

export function GroupSettings({ group }) {
  const [ratioA, setRatioA] = useState(group.ratio_a)
  const [ratioB, setRatioB] = useState(group.ratio_b)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await updateRatio(ratioA, ratioB)
    if (result.error) {
      alert(result.error)
    } else {
      alert('Ratio updated successfully')
    }
    setSaving(false)
  }

  function handleRatioAChange(value: number) {
    setRatioA(value)
    setRatioB(100 - value)
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-lg font-semibold mb-2">{group.name}</h2>
        <p className="text-sm text-gray-600">
          Members: {group.user_a.name} {group.user_b ? `& ${group.user_b.name}` : '(pending partner)'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Income Ratio</label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm">{group.user_a.name}</label>
            <input
              type="range"
              min="1"
              max="99"
              value={ratioA}
              onChange={(e) => handleRatioAChange(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-center font-bold">{ratioA}%</p>
          </div>
          <div className="flex-1">
            <label className="text-sm">{group.user_b?.name || 'Partner'}</label>
            <input
              type="range"
              min="1"
              max="99"
              value={ratioB}
              disabled
              className="w-full opacity-50"
            />
            <p className="text-center font-bold">{ratioB}%</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
```

#### Component: `/src/components/group/InvitePartner.tsx`

```typescript
'use client'

import { invitePartner } from '@/app/actions/group'
import { useState } from 'react'

export function InvitePartner() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

  async function handleInvite() {
    setLoading(true)
    const result = await invitePartner(email)
    if (result.error) {
      alert(result.error)
    } else {
      setInviteUrl(result.invite_url)
    }
    setLoading(false)
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Invite Partner</h2>
      {inviteUrl ? (
        <div>
          <p className="text-sm text-green-600 mb-2">Invitation sent!</p>
          <p className="text-xs text-gray-600 break-all">{inviteUrl}</p>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="partner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded border-gray-300 shadow-sm"
          />
          <button
            onClick={handleInvite}
            disabled={loading || !email}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </div>
      )}
    </div>
  )
}
```

---

### 4.3 Invitation Acceptance Flow

#### Page: `/app/invite/[token]/page.tsx`

```typescript
import { acceptInvitation } from '@/app/actions/group'
import { redirect } from 'next/navigation'

export default async function InvitePage({
  params
}: {
  params: { token: string }
}) {
  const result = await acceptInvitation(params.token)

  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-8 rounded-lg">
          <h1 className="text-xl font-bold text-red-800">Invalid Invitation</h1>
          <p className="text-red-600 mt-2">{result.error}</p>
        </div>
      </div>
    )
  }

  redirect('/dashboard')
}
```

---

### 4.4 Middleware for Protected Routes

**File**: `/src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup')

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
```

---

## 5. Acceptance Criteria

### AC-1.1 User Registration

**Given** a new user visits `/signup`  
**When** they submit valid name, email, and password  
**Then**:
- [ ] Supabase Auth user is created
- [ ] Row inserted into `users` table with matching `id`
- [ ] User redirected to `/dashboard`
- [ ] Session cookie set (can access protected routes)

**Error Cases**:
- [ ] Duplicate email → show "Email already registered"
- [ ] Invalid email format → show validation error
- [ ] Password < 8 chars → show validation error

---

### AC-1.2 User Login

**Given** an existing user visits `/login`  
**When** they submit correct email and password  
**Then**:
- [ ] User authenticated via Supabase
- [ ] Redirected to `/dashboard`
- [ ] Session persists across page refreshes

**Error Cases**:
- [ ] Wrong password → show "Invalid email or password"
- [ ] Unregistered email → show "Invalid email or password"

---

### AC-1.3 Group Creation

**Given** authenticated user with no group  
**When** they create a group with custom name and ratio (e.g., "Our Home", 60:40)  
**Then**:
- [ ] Row inserted into `groups` table
- [ ] `user_a_id` set to current user
- [ ] `user_b_id` is NULL
- [ ] User's `group_id` updated to new group
- [ ] Ratio validation enforces sum = 100

**Error Cases**:
- [ ] User already in a group → show "You are already in a group"
- [ ] Invalid ratio (e.g., 60:50) → show "Ratios must sum to 100"

---

### AC-1.4 Partner Invitation

**Given** User A in a group without partner  
**When** they invite User B by email  
**Then**:
- [ ] Invitation record created with unique token
- [ ] Invitation URL generated: `/invite/{token}`
- [ ] Email sent to invitee (or URL displayed in MVP)
- [ ] Expiry set to 7 days from now

**Error Cases**:
- [ ] Group already full → show "Group already has two members"
- [ ] Non-creator tries to invite → show "Only group creator can invite"

---

### AC-1.5 Invitation Acceptance

**Given** User B receives invitation link  
**When** they visit `/invite/{token}` while logged in  
**Then**:
- [ ] User B's `group_id` updated to inviter's group
- [ ] Group's `user_b_id` set to User B
- [ ] Invitation marked as `used_at = NOW()`
- [ ] User B redirected to `/dashboard`

**Error Cases**:
- [ ] Token expired → show "Invitation expired"
- [ ] Token already used → show "Invitation already used"
- [ ] User not logged in → redirect to `/signup` with return URL

---

### AC-1.6 Ratio Update

**Given** User A (group creator) in settings  
**When** they adjust ratio slider to 70:30  
**Then**:
- [ ] `groups.ratio_a` updated to 70
- [ ] `groups.ratio_b` updated to 30
- [ ] `updated_at` timestamp refreshed
- [ ] Both users see new ratio on next page load

**Error Cases**:
- [ ] Non-creator tries to update → blocked by RLS policy
- [ ] Invalid ratio → show validation error

---

### AC-1.7 Protected Routes

**Given** unauthenticated user  
**When** they try to access `/dashboard` or `/settings`  
**Then**:
- [ ] Redirected to `/login`
- [ ] After login, redirected back to original URL

**Given** authenticated user  
**When** they visit `/login` or `/signup`  
**Then**:
- [ ] Redirected to `/dashboard`

---

## 6. Non-Functional Requirements

### 6.1 Security

- All server actions validate authentication via `supabase.auth.getUser()`
- RLS policies prevent cross-group data access
- Input validation with Zod schemas on all form submissions
- Email addresses normalized to lowercase before storage
- Invitation tokens use cryptographically secure UUIDs

### 6.2 Performance

- Database queries optimized with indexes on foreign keys
- Server actions use `single()` to avoid over-fetching
- No N+1 queries (use Supabase join syntax)

### 6.3 Usability

- Mobile-responsive forms (test on 375px width)
- Loading states for all async actions (pending spinners)
- Error messages displayed inline, not just console logs
- Success feedback after mutations (toast or inline message)

---

## 7. Implementation Checklist for Delivery Agent

### DA-1: Setup & Configuration

- [ ] Install Supabase dependencies: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Create Supabase project at https://supabase.com
- [ ] Copy connection strings to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [ ] Create Supabase client utilities:
  - `/src/lib/supabase/client.ts` (browser)
  - `/src/lib/supabase/server.ts` (Server Components/Actions)

### DA-2: Database Setup

- [ ] Run SQL migration `/supabase/migrations/001_initial_schema.sql`
- [ ] Run RLS policies `/supabase/migrations/002_rls_policies.sql`
- [ ] Verify schema in Supabase Table Editor
- [ ] Test RLS: create two users, confirm they can't read each other's groups

### DA-3: Authentication Implementation

- [ ] Implement Server Actions: `signUp`, `logIn`, `logOut`
- [ ] Create UI components: `SignUpForm`, `LoginForm`
- [ ] Create auth pages: `/app/(auth)/signup/page.tsx`, `/app/(auth)/login/page.tsx`
- [ ] Test signup flow end-to-end
- [ ] Test login flow with existing user
- [ ] Test logout (session cleared, redirect to login)

### DA-4: Group Management Implementation

- [ ] Implement Server Actions: `createGroup`, `invitePartner`, `acceptInvitation`, `updateRatio`
- [ ] Create UI components: `GroupSettings`, `InvitePartner`, `CreateGroupForm`
- [ ] Create settings page: `/app/settings/page.tsx`
- [ ] Create invitation page: `/app/invite/[token]/page.tsx`
- [ ] Test group creation for new user
- [ ] Test partner invitation (copy URL manually for MVP)
- [ ] Test invitation acceptance (open URL in incognito)
- [ ] Test ratio update with slider

### DA-5: Middleware & Route Protection

- [ ] Implement `/src/middleware.ts` as specified
- [ ] Test unauthenticated access to `/dashboard` (should redirect)
- [ ] Test authenticated access to `/login` (should redirect to dashboard)
- [ ] Verify session persistence after page refresh

### DA-6: Testing

- [ ] Unit tests for Zod schemas (validate edge cases)
- [ ] Integration tests for Server Actions (mock Supabase client)
- [ ] Manual E2E test:
  1. Sign up User A
  2. Create group
  3. Invite User B
  4. Sign up User B in incognito
  5. Accept invitation
  6. Verify both users see same group
  7. Update ratio, verify both users see change

### DA-7: Documentation

- [ ] Update README with setup instructions (Supabase config)
- [ ] Document invitation flow for manual testing
- [ ] Add screenshots of UI to `/docs/screenshots/`

---

## 8. Open Questions for Product Owner

1. **Email Sending**: MVP uses console.log for invite URLs. Should we integrate Resend/SendGrid, or is manual copy-paste acceptable?
   - **Recommendation**: Defer to Phase 2. For MVP, display invite URL in UI after inviting.

2. **Email Verification**: Supabase sends verification emails by default. Should we enforce verification before group creation?
   - **Recommendation**: No for MVP. Allow unverified users to reduce friction.

3. **Password Reset**: Should we implement custom UI, or use Supabase default email flow?
   - **Recommendation**: Supabase default is sufficient for MVP.

4. **Invitation Expiry**: What happens to expired invitations? Auto-delete?
   - **Recommendation**: Keep in DB for audit trail. Just reject in `acceptInvitation` action.

---

## 9. Follow-Up Tasks for QGA

**QGA-1: Security Audit**
- [ ] Verify RLS policies block cross-group access
- [ ] Test invitation token guessing (ensure UUID randomness)
- [ ] Check for XSS vectors in user-provided `name` field
- [ ] Validate CSRF protection (Next.js Server Actions default)

**QGA-2: Performance Testing**
- [ ] Measure auth action response time (<500ms target)
- [ ] Test concurrent signups (10 users simultaneously)
- [ ] Verify database connection pooling under load

**QGA-3: Usability Testing**
- [ ] Mobile testing on iOS Safari and Android Chrome
- [ ] Keyboard navigation for forms (tab order, enter to submit)
- [ ] Screen reader testing for accessibility

---

## 10. Relevant Files

**Phase 1 Core Logic (Completed)**:
- `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/types.ts` (28 lines)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/settlement.ts` (63 lines)
- `/Users/takuya.kurihara/workspace/domestic-account-booking/src/lib/csv-parser.ts` (existing)

**New Files to Create**:
- `/src/app/actions/auth.ts` (signUp, logIn, logOut)
- `/src/app/actions/group.ts` (createGroup, invitePartner, acceptInvitation, updateRatio, getCurrentGroup)
- `/src/lib/supabase/client.ts` (browser Supabase client)
- `/src/lib/supabase/server.ts` (server Supabase client)
- `/src/middleware.ts` (route protection)
- `/src/components/auth/SignUpForm.tsx`
- `/src/components/auth/LoginForm.tsx`
- `/src/components/group/GroupSettings.tsx`
- `/src/components/group/InvitePartner.tsx`
- `/src/components/group/CreateGroupForm.tsx`
- `/app/(auth)/signup/page.tsx`
- `/app/(auth)/login/page.tsx`
- `/app/settings/page.tsx`
- `/app/invite/[token]/page.tsx`
- `/supabase/migrations/001_initial_schema.sql`
- `/supabase/migrations/002_rls_policies.sql`

**Configuration Updates**:
- `.env.local` (add Supabase keys per `.env.local.example`)

---

**Document Status**: Ready for Delivery Agent implementation  
**Estimated Effort**: 3-5 days (1 senior developer)  
**Dependencies**: None (Phase 1 core logic complete, 26 tests passing)
