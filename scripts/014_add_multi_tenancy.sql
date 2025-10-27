-- Add admin_id column to all relevant tables for multi-tenancy
-- Each admin will only see their own data

-- Add admin_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id);

-- Add admin_id to routes table
ALTER TABLE routes ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id);

-- Add admin_id to profiles table (for drivers to link them to their admin)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_admin_id ON orders(admin_id);
CREATE INDEX IF NOT EXISTS idx_routes_admin_id ON routes(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_id ON profiles(admin_id);

-- For existing data, set admin_id to NULL (will need manual assignment or cleanup)
-- Admins will have admin_id = NULL (they are the top level)
-- Drivers will have admin_id = their admin's ID

COMMENT ON COLUMN orders.admin_id IS 'The admin who owns this order';
COMMENT ON COLUMN routes.admin_id IS 'The admin who owns this route';
COMMENT ON COLUMN profiles.admin_id IS 'For drivers: the admin they belong to. For admins: NULL';
