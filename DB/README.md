# Database Setup Guide

This folder contains all SQL scripts needed to set up the delivery management system database from scratch.

## Quick Start

### Option 1: Run Master Setup (Recommended)
Execute the master setup script in your Supabase SQL Editor:
\`\`\`sql
-- Copy and paste the contents of 00_MASTER_SETUP.sql
\`\`\`

This single script creates all tables, indexes, triggers, RLS policies, and functions.

### Option 2: Run Individual Scripts
Execute scripts in numerical order (001 through 016) if you prefer granular control.

## Database Structure

### Core Tables
- **profiles** - User accounts (admin/driver roles)
- **orders** - Delivery orders with customer information
- **routes** - Delivery routes assigned to drivers
- **pods** - Proof of delivery records
- **pod_photos** - Multiple photos per delivery (up to 4)
- **stop_events** - Delivery attempt tracking
- **driver_positions** - Real-time GPS tracking
- **route_stops** - Optimized route sequences
- **pod_emails** - Email delivery tracking (idempotency)
- **failed_delivery_emails** - Failed delivery notifications

### Key Features
- **Row Level Security (RLS)** - All tables protected with role-based policies
- **Multi-tenancy** - Admin isolation with admin_id foreign keys
- **Geocoding** - Address validation and coordinate storage
- **Route Optimization** - VRP fields for advanced routing
- **Email Tracking** - Idempotent email delivery with SendGrid
- **Real-time Tracking** - Live driver position updates

## Script Execution Order

1. **00_MASTER_SETUP.sql** - Complete database setup (all-in-one)

OR execute individually:

1. **001_create_tables.sql** - Core table structure
2. **002_enable_rls.sql** - Row Level Security policies
3. **003_create_profile_trigger.sql** - Auto-create user profiles
4. **004_add_geocoding_columns.sql** - Geocoding metadata
5. **005_add_vrp_fields.sql** - Vehicle routing fields
6. **006_add_global_routing_fields.sql** - Global routing support
7. **007_create_driver_positions.sql** - GPS tracking table
8. **009_route_metrics.sql** - Route performance metrics
9. **010_pod_emails_idempotency.sql** - Email tracking
10. **011_require_customer_email.sql** - Email validation
11. **012_add_order_number.sql** - Order number tracking
12. **013_add_driver_active_status.sql** - Driver availability
13. **014_add_multi_tenancy.sql** - Admin isolation
14. **015_populate_admin_id.sql** - Assign legacy data
15. **016_fix_multi_tenancy_data.sql** - Data cleanup
16. **017_pod_photos_table.sql** - Multi-photo support
17. **018_failed_delivery_emails.sql** - Failed delivery tracking

## Environment Variables Required

\`\`\`env
# Supabase Connection
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Postgres Direct Connection
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
DELIVERY_FROM_EMAIL=noreply@yourdomain.com

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=your_blob_token

# HERE Maps API (for geocoding and routing)
HERE_API_KEY=your_here_api_key
NEXT_PUBLIC_HERE_API_KEY=your_here_api_key

# Development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

## Creating Your First Admin User

After running the database scripts, create an admin user via Supabase Auth:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Add user metadata:
   \`\`\`json
   {
     "role": "admin",
     "display_name": "Admin Name"
   }
   \`\`\`

The profile trigger will automatically create the profile record.

## Verification

After setup, verify your database:

\`\`\`sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
\`\`\`

## Troubleshooting

### RLS Errors
If you get "permission denied" errors, ensure:
1. RLS is enabled on all tables
2. Policies are created correctly
3. User has proper role in profiles table

### Missing Tables
If tables don't exist:
1. Run 00_MASTER_SETUP.sql
2. Check for SQL errors in Supabase logs
3. Verify you're using the correct database

### Email Not Sending
1. Verify SENDGRID_API_KEY is set
2. Check DELIVERY_FROM_EMAIL is verified in SendGrid
3. Run scripts 010 and 018 for email tracking tables

## Support

For issues or questions, refer to:
- Supabase Documentation: https://supabase.com/docs
- Project Documentation: See main README.md
