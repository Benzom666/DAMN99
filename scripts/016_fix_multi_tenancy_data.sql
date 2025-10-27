-- Fix multi-tenancy data issues
-- This script ensures all data has proper admin_id assignments

-- Get the first admin user (for assigning legacy data)
DO $$
DECLARE
  first_admin_id UUID;
BEGIN
  -- Find the first admin user
  SELECT id INTO first_admin_id
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF first_admin_id IS NOT NULL THEN
    -- Assign all orders without admin_id to the first admin
    UPDATE orders
    SET admin_id = first_admin_id
    WHERE admin_id IS NULL;

    -- Assign all routes without admin_id to the first admin
    UPDATE routes
    SET admin_id = first_admin_id
    WHERE admin_id IS NULL;

    -- Assign all drivers without admin_id to the first admin
    UPDATE profiles
    SET admin_id = first_admin_id
    WHERE role = 'driver' AND admin_id IS NULL;

    RAISE NOTICE 'Assigned legacy data to first admin: %', first_admin_id;
  ELSE
    RAISE NOTICE 'No admin users found';
  END IF;
END $$;

-- Reset all "assigned" orders to "pending" so they can be routed again
UPDATE orders
SET status = 'pending', route_id = NULL, stop_sequence = NULL
WHERE status = 'assigned';

-- Add index on admin_id for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_admin_id ON orders(admin_id);
CREATE INDEX IF NOT EXISTS idx_routes_admin_id ON routes(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_id ON profiles(admin_id);

-- Add index on status for better filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
