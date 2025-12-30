-- Migration: Single Schema Migration (custom_auth -> public)
-- Purpose: Consolidate all tables into public schema for deployment compatibility
-- Laws Compliance: L-SC-001 (Auth integrity), L-CX-001 (Zero data loss)
-- Created: 2025-12-30

-- Step 1: Create public.auth_users table
CREATE TABLE IF NOT EXISTS public.auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT auth_users_email_unique UNIQUE(email)
);

-- Step 2: Copy data from custom_auth.users to public.auth_users
INSERT INTO public.auth_users (id, email, password_hash, created_at, updated_at)
SELECT id, email, password_hash, created_at, updated_at
FROM custom_auth.users
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify data migration (L-CX-001: Accuracy - Zero data loss)
DO $$
DECLARE
  source_count int;
  target_count int;
BEGIN
  SELECT COUNT(*) INTO source_count FROM custom_auth.users;
  SELECT COUNT(*) INTO target_count FROM public.auth_users;
  
  IF source_count != target_count THEN
    RAISE EXCEPTION 'Migration failed: source=%, target=%', source_count, target_count;
  END IF;
  
  RAISE NOTICE 'Migration verified: % rows migrated successfully', target_count;
END $$;

-- Step 4: Create index
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users USING btree (email);

-- Step 5: Update foreign key from public.users to public.auth_users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_users_id_fk;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_id_auth_users_id_fk 
  FOREIGN KEY (id) REFERENCES public.auth_users(id) ON DELETE cascade;

-- Step 6: Verify foreign key integrity
DO $$
DECLARE
  orphan_count int;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.users u
  LEFT JOIN public.auth_users au ON u.id = au.id
  WHERE au.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Foreign key violation: % orphaned users found', orphan_count;
  END IF;
  
  RAISE NOTICE 'Foreign key integrity verified: No orphaned records';
END $$;

-- Step 7: Drop old schema (EXECUTE AFTER CODE DEPLOYMENT)
-- IMPORTANT: Only run after verifying application works with new schema
-- DROP TABLE IF EXISTS custom_auth.users CASCADE;
-- DROP SCHEMA IF EXISTS custom_auth CASCADE;

-- Migration complete - verify with:
-- SELECT COUNT(*) FROM public.auth_users;
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='auth_users';
-- \d public.users (check FK constraint)
