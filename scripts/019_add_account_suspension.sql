-- Add account suspension capability
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);

-- Removed the problematic RLS policies that caused infinite recursion
-- The existing RLS policies already handle user access correctly
-- Super admin access will be enforced at the application level, not in RLS
-- This avoids querying profiles table within profiles RLS policies

COMMENT ON COLUMN profiles.is_suspended IS 'Whether the account is suspended (cannot login)';
COMMENT ON COLUMN profiles.suspended_at IS 'When the account was suspended';
COMMENT ON COLUMN profiles.suspended_by IS 'Super admin who suspended the account';
COMMENT ON COLUMN profiles.suspension_reason IS 'Reason for suspension';
