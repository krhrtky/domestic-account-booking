-- Rollback Script: Single Schema Migration
-- Purpose: Restore custom_auth schema if migration needs to be reverted
-- WARNING: Only use if migration failed or immediate rollback required
-- Created: 2025-12-30

-- Step 1: Recreate custom_auth schema
CREATE SCHEMA IF NOT EXISTS custom_auth;

-- Step 2: Recreate custom_auth.users table
CREATE TABLE IF NOT EXISTS custom_auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE(email)
);

-- Step 3: Copy data back from public.auth_users to custom_auth.users
INSERT INTO custom_auth.users (id, email, password_hash, created_at, updated_at)
SELECT id, email, password_hash, created_at, updated_at
FROM public.auth_users
ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify rollback data integrity
DO $$
DECLARE
  source_count int;
  target_count int;
BEGIN
  SELECT COUNT(*) INTO source_count FROM public.auth_users;
  SELECT COUNT(*) INTO target_count FROM custom_auth.users;
  
  IF source_count != target_count THEN
    RAISE EXCEPTION 'Rollback failed: source=%, target=%', source_count, target_count;
  END IF;
  
  RAISE NOTICE 'Rollback verified: % rows restored', target_count;
END $$;

-- Step 5: Recreate index
CREATE INDEX IF NOT EXISTS idx_custom_auth_users_email ON custom_auth.users USING btree (email);

-- Step 6: Update foreign key back to custom_auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_auth_users_id_fk;
ALTER TABLE public.users ADD CONSTRAINT users_id_users_id_fk 
  FOREIGN KEY (id) REFERENCES custom_auth.users(id) ON DELETE cascade;

-- Step 7: Verify foreign key integrity
DO $$
DECLARE
  orphan_count int;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.users u
  LEFT JOIN custom_auth.users cu ON u.id = cu.id
  WHERE cu.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Foreign key violation: % orphaned users found', orphan_count;
  END IF;
  
  RAISE NOTICE 'Rollback foreign key integrity verified';
END $$;

-- Step 8: Drop public.auth_users (optional - only after confirming rollback works)
-- DROP TABLE IF EXISTS public.auth_users CASCADE;

-- Rollback complete - verify with:
-- SELECT COUNT(*) FROM custom_auth.users;
-- \d public.users (check FK constraint points to custom_auth.users)
