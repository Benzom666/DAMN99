-- Add is_active column to profiles table for driver availability
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing drivers to active by default
UPDATE profiles SET is_active = true WHERE role = 'driver' AND is_active IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.is_active IS 'Whether the driver is active and available for route assignment';
