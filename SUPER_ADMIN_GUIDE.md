# Super Admin Guide

## Overview

The Super Admin system provides complete control over the entire delivery management platform. As a super admin, you have "god mode" access to view, edit, suspend, restore, and delete any data across all admins, drivers, orders, and routes.

## Getting Started

### Initial Setup

1. **Sign Up**: Create an account with your designated super admin email (configured in `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` environment variable)
2. **Activate**: Navigate to `/setup-super-admin` and click "Activate Super Admin"
3. **Access**: Visit `/super-admin` to access the Super Admin Control Center

Your account will now have the `super_admin` role with unrestricted access to all system features.

## Features

### 1. Dashboard (`/super-admin`)

The main control center displays:
- **System Statistics**: Total admins, drivers, routes, orders, suspended accounts
- **Quick Access**: Navigate to all management sections
- **Real-time Counts**: Active routes, completed orders, system health

### 2. Admin Management (`/super-admin/admins`)

**Capabilities:**
- View all administrator accounts across the system
- Suspend admin accounts (prevents login, preserves data)
- Restore suspended accounts
- Delete admin accounts permanently
- View account creation dates and status

**Actions:**
- **Suspend**: Provide a reason, account is immediately blocked from login
- **Restore**: Re-enable a suspended account with one click
- **Delete**: Permanently remove admin and associated data (requires confirmation)

**Use Cases:**
- Security incidents: Immediately suspend compromised accounts
- Policy violations: Suspend accounts pending investigation
- Offboarding: Remove departed administrators

### 3. Driver Management (`/super-admin/drivers`)

**Capabilities:**
- View all driver accounts across all admins
- See which admin each driver belongs to
- Suspend/restore driver accounts
- Delete driver accounts
- View driver activity and assignment status

**Actions:**
- **Suspend**: Block driver from accessing app and completing deliveries
- **Restore**: Re-enable driver access
- **Delete**: Remove driver and reassign their routes to unassigned

**Use Cases:**
- Performance issues: Suspend drivers pending review
- Safety concerns: Immediately block problematic drivers
- Driver offboarding: Clean up inactive accounts

### 4. Order Management (`/super-admin/orders`)

**Capabilities:**
- View all orders across all admins (latest 500)
- See order details, customer info, and status
- Track which admin and route each order belongs to
- Delete orders and associated data

**Actions:**
- **View**: See complete order details including customer info, address, status
- **Delete**: Remove orders from the system (cascades to stop events, PODs)

**Use Cases:**
- Data cleanup: Remove test or duplicate orders
- Privacy requests: Delete customer data
- Error correction: Remove incorrectly created orders

### 5. Route Management (`/super-admin/routes`)

**Capabilities:**
- View all routes across all admins (latest 200)
- See route progress, driver assignments, and status
- Reassign routes to different drivers
- Delete routes and reset orders

**Actions:**
- **Reassign Driver**: Move route to different driver or set as unassigned
- **Delete**: Remove route and reset all orders to pending status

**Use Cases:**
- Driver issues: Quickly reassign routes when drivers are unavailable
- Route optimization: Redistribute work across drivers
- Error recovery: Delete problematic routes and recreate

### 6. Audit Log (`/super-admin/audit-log`)

**Capabilities:**
- View all super admin actions (latest 100)
- See who performed each action and when
- Track changes to profiles, orders, routes
- Review suspension/restoration history

**Information Tracked:**
- Timestamp of action
- Super admin who performed it
- Action type (suspend, restore, delete, update, etc.)
- Target table and record ID
- Additional details (JSON)

**Use Cases:**
- Compliance: Track all privileged actions
- Security: Audit suspicious activity
- Troubleshooting: Understand what changes were made

### 7. System Health (`/super-admin/system`)

**Capabilities:**
- View database statistics
- Monitor total records in each table
- Track system growth over time

**Metrics Displayed:**
- Total profiles in system
- Total orders (all-time)
- Total routes (all-time)
- Total proof of deliveries

**Use Cases:**
- Capacity planning: Monitor system growth
- Performance: Track database size
- Health checks: Verify system is operating normally

## Security Features

### Account Suspension

**How It Works:**
1. Super admin suspends account from Admins or Drivers page
2. Reason for suspension is recorded in database
3. User is immediately logged out if currently active
4. All future login attempts are blocked
5. Middleware checks suspension status on every request

**Database Changes:**
- `is_suspended`: Set to `true`
- `suspended_at`: Timestamp recorded
- `suspended_by`: Your super admin ID
- `suspension_reason`: Text explanation

**Restoration:**
- One-click restore from same management page
- All suspension fields are cleared
- User can immediately login again

### Super Admin Protection

**Safeguards:**
- Super admin accounts cannot be suspended by other super admins
- Super admin accounts cannot be deleted through the UI
- RLS policies prevent modification of super admin profiles
- Only super admins can access `/super-admin` routes

### Audit Trail

**All Actions Are Logged:**
- Who: Super admin user ID and email
- What: Action type (suspend, restore, delete, update)
- When: Exact timestamp
- Where: Target table and record ID
- Why: Additional details (suspension reason, changes made)

**Log Retention:**
- Logs are permanent and cannot be deleted via UI
- Latest 100 shown in UI, all stored in database
- Can be exported for compliance/security reviews

## Best Practices

### 1. Use Suspension Before Deletion

Always suspend accounts first instead of immediately deleting:
- Allows time to investigate issues
- Preserves data for potential restoration
- Gives users chance to appeal
- Prevents accidental data loss

### 2. Document Suspension Reasons

Always provide clear, specific reasons when suspending:
- "Security concern: unusual login activity from foreign IP"
- "Policy violation: driver falsified delivery photos"
- "Administrative: duplicate account for same person"

### 3. Review Audit Logs Regularly

Check the audit log periodically to:
- Verify only authorized actions are occurring
- Identify patterns of suspicious activity
- Ensure compliance with data handling policies
- Train new super admins on proper procedures

### 4. Coordinate with Regular Admins

Before taking action on accounts:
- Contact the admin who manages the user
- Understand the context and situation
- Coordinate on resolution approach
- Document decisions in suspension reasons

### 5. Use Reassignment, Not Deletion

For driver issues, reassign their routes instead of deleting:
- Preserves delivery data and history
- Prevents disruption to active deliveries
- Allows admin to assign routes to replacement driver
- Maintains data integrity

## Troubleshooting

### Cannot Access Super Admin Area

**Symptoms:** Redirected to `/admin` when visiting `/super-admin`

**Solution:**
1. Verify your email matches `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`
2. Check your profile role: `SELECT role FROM profiles WHERE email = 'your@email.com'`
3. If role is not `super_admin`, visit `/setup-super-admin` to activate
4. If still failing, run the SQL script: `scripts/018_promote_super_admin.sql`

### Account Shows as Suspended But User Can Login

**Symptoms:** User with `is_suspended = true` can still access system

**Solution:**
1. Check middleware is properly checking suspension status
2. Verify RLS policies are enforced
3. Force logout: `UPDATE auth.users SET raw_user_meta_data = '{}' WHERE email = 'user@email.com'`
4. User must re-login (will be blocked by middleware)

### Audit Log Not Recording Actions

**Symptoms:** Actions performed but not appearing in audit log

**Solution:**
1. Verify `super_admin_audit_log` table exists
2. Check RLS policies allow insert for super admins
3. Ensure server actions call `logAuditAction()` function
4. Check browser console for any error messages

### Cannot Delete Orders/Routes

**Symptoms:** Delete button doesn't work or shows error

**Solution:**
1. Check browser console for specific error
2. Verify RLS policies allow super admin to delete
3. Ensure cascading deletes are working (check foreign key constraints)
4. Try deleting associated data first (route_stops, pods, etc.)

## Environment Variables

Required for super admin functionality:

\`\`\`env
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=your@email.com
\`\`\`

This email will be automatically promoted to super_admin role when:
- Creating account via signup
- Running the setup script
- Visiting `/setup-super-admin` while logged in

## Database Schema

### Suspension Fields (profiles table)

\`\`\`sql
is_suspended BOOLEAN DEFAULT FALSE
suspended_at TIMESTAMP WITH TIME ZONE
suspended_by UUID REFERENCES profiles(id)
suspension_reason TEXT
\`\`\`

### Audit Log Table

\`\`\`sql
CREATE TABLE super_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  super_admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## Support

For issues with the super admin system:

1. Check this guide for common issues
2. Review audit logs for recent changes
3. Check database for data integrity
4. Contact development team if needed

## Security Notice

**Super admin access is powerful and should be restricted to trusted personnel only.**

- Limit super admin accounts to minimum necessary personnel
- Use strong, unique passwords and 2FA if available
- Monitor audit logs regularly for unauthorized access
- Never share super admin credentials
- Revoke access immediately when personnel change roles
