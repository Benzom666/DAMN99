-- Populate admin_id for existing data
-- This script assigns existing orders, routes, and drivers to the first admin user
-- Run this ONCE after adding the admin_id column

DO $$
DECLARE
  first_admin_id uuid;
BEGIN
  -- Get the first admin user
  SELECT id INTO first_admin_id
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  -- If there's an admin, assign all NULL admin_id records to them
  IF first_admin_id IS NOT NULL THEN
    -- Update orders without admin_id
    UPDATE orders
    SET admin_id = first_admin_id
    WHERE admin_id IS NULL;

    -- Update routes without admin_id
    UPDATE routes
    SET admin_id = first_admin_id
    WHERE admin_id IS NULL;

    -- Update drivers without admin_id
    UPDATE profiles
    SET admin_id = first_admin_id
    WHERE role = 'driver' AND admin_id IS NULL;

    RAISE NOTICE 'Assigned % orders, routes, and drivers to admin %', 
      (SELECT COUNT(*) FROM orders WHERE admin_id = first_admin_id),
      first_admin_id;
  ELSE
    RAISE NOTICE 'No admin users found. Please create an admin user first.';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN orders.admin_id IS 'Links order to the admin who created it for multi-tenancy';
COMMENT ON COLUMN routes.admin_id IS 'Links route to the admin who created it for multi-tenancy';
COMMENT ON COLUMN profiles.admin_id IS 'Links driver to the admin who manages them for multi-tenancy';
