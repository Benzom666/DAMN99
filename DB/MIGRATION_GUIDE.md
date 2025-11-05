# Database Migration Guide

This guide helps you migrate from an existing database or set up a new one.

## Fresh Installation

For a brand new database:

1. Open Supabase SQL Editor
2. Copy and paste `00_MASTER_SETUP.sql`
3. Execute the script
4. Create your first admin user (see README.md)

## Migrating Existing Database

If you already have some tables:

### Step 1: Backup Your Data
\`\`\`sql
-- Export your data first!
-- Use Supabase Dashboard → Database → Backups
\`\`\`

### Step 2: Check What Exists
\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
\`\`\`

### Step 3: Run Missing Scripts

Execute only the scripts for tables/features you don't have:

- Missing `profiles`? Run script 001
- Missing `pod_photos`? Run script 017
- Missing `failed_delivery_emails`? Run script 018
- Need RLS? Run script 002
- Need multi-tenancy? Run scripts 014-016

### Step 4: Verify
\`\`\`sql
-- Check all tables exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return 10 tables
\`\`\`

## Common Migration Scenarios

### Scenario 1: Adding Multi-Photo Support

If you have the old single-photo system:

\`\`\`sql
-- Run this script
\i 017_pod_photos_table.sql

-- Your existing PODs will still work
-- New deliveries can have up to 4 photos
\`\`\`

### Scenario 2: Adding Failed Delivery Emails

\`\`\`sql
-- Run this script
\i 018_failed_delivery_emails.sql

-- Failed deliveries will now send customer notifications
\`\`\`

### Scenario 3: Adding Multi-Tenancy

\`\`\`sql
-- Run these in order
\i 014_add_multi_tenancy.sql
\i 015_populate_admin_id.sql
\i 016_fix_multi_tenancy_data.sql

-- All existing data will be assigned to first admin
\`\`\`

## Rollback Procedures

### Remove Multi-Photo Support
\`\`\`sql
DROP TABLE IF EXISTS pod_photos CASCADE;
\`\`\`

### Remove Failed Delivery Emails
\`\`\`sql
DROP TABLE IF EXISTS failed_delivery_emails CASCADE;
\`\`\`

### Remove Multi-Tenancy
\`\`\`sql
ALTER TABLE orders DROP COLUMN IF EXISTS admin_id;
ALTER TABLE routes DROP COLUMN IF EXISTS admin_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS admin_id;
\`\`\`

## Data Integrity Checks

After migration, run these checks:

\`\`\`sql
-- Check for orphaned orders (no route)
SELECT COUNT(*) FROM orders WHERE route_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM routes WHERE routes.id = orders.route_id);

-- Check for orders without customer email
SELECT COUNT(*) FROM orders WHERE customer_email IS NULL OR customer_email = '';

-- Check for PODs without photos
SELECT COUNT(*) FROM pods WHERE photo_url IS NULL 
AND NOT EXISTS (SELECT 1 FROM pod_photos WHERE pod_photos.pod_id = pods.id);

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = FALSE;
\`\`\`

## Performance Optimization

After migration, analyze tables:

\`\`\`sql
ANALYZE profiles;
ANALYZE orders;
ANALYZE routes;
ANALYZE pods;
ANALYZE pod_photos;
ANALYZE stop_events;
ANALYZE driver_positions;
ANALYZE route_stops;
ANALYZE pod_emails;
ANALYZE failed_delivery_emails;
\`\`\`

## Troubleshooting

### Error: "relation already exists"
This is normal if running scripts multiple times. The scripts use `IF NOT EXISTS` to be idempotent.

### Error: "permission denied for table"
Ensure RLS policies are created (script 002) and user has proper role.

### Error: "foreign key violation"
Check that referenced tables exist first. Run scripts in numerical order.

### Error: "column already exists"
Safe to ignore. Scripts use `ADD COLUMN IF NOT EXISTS`.
