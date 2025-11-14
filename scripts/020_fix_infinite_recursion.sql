-- URGENT FIX: Drop policies causing infinite recursion
-- Run this script immediately in your Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Suspended users cannot access system" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin_view_all" ON profiles;

-- Verify the drop was successful
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND (policyname = 'Suspended users cannot access system' 
       OR policyname = 'profiles_super_admin_view_all');

-- This query should return 0 rows if policies were successfully dropped

COMMENT ON SCRIPT IS 'Removes RLS policies that cause infinite recursion by querying profiles table within profiles policies';
