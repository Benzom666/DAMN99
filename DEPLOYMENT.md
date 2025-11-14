# Deployment Guide

This guide covers deploying the Delivery Route Management System to production on Vercel.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] All TypeScript errors resolved
- [ ] Environment variables documented
- [ ] Database migrations tested

### 2. External Services Setup

#### Supabase
1. Create a new Supabase project at https://supabase.com
2. Note down your project URL and keys:
   - Project URL: `https://your-project.supabase.co`
   - Anon/Public Key
   - Service Role Key (keep secret)
3. Enable Email Auth in Authentication settings
4. Set up email templates (optional)

#### HERE Maps
1. Sign up at https://developer.here.com
2. Create a new project
3. Generate API keys:
   - Public API key (for frontend)
   - Server API key (for backend)
4. Enable the following APIs:
   - Geocoding & Search API
   - Routing API
   - Tour Planning API

#### Vercel Blob
1. Will be auto-configured when deploying to Vercel
2. Token will be automatically added to environment variables

#### SendGrid (Optional)
1. Sign up at https://sendgrid.com
2. Create API key with Mail Send permissions
3. Verify sender email address
4. Set up sender authentication (SPF/DKIM)

## Deployment Steps

### Step 1: Push to GitHub

\`\`\`bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
\`\`\`

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository
5. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### Step 3: Configure Environment Variables

In Vercel project settings, add all environment variables from `.env.example`:

**Critical Variables (Required):**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
HERE_API_KEY
NEXT_PUBLIC_HERE_API_KEY
\`\`\`

**Optional Variables:**
\`\`\`
SENDGRID_API_KEY
DELIVERY_FROM_EMAIL
NEXT_PUBLIC_ENABLE_POD_EMAIL=true
NEXT_PUBLIC_ENABLE_ROUTE_METRICS=true
NEXT_PUBLIC_ENABLE_DISPATCH_MAP=true
\`\`\`

**Note:** Vercel will automatically add:
- `BLOB_READ_WRITE_TOKEN` (when you enable Blob storage)
- `POSTGRES_*` variables (if using Vercel Postgres)

### Step 4: Deploy

Click "Deploy" in Vercel dashboard.

Wait for deployment to complete (typically 2-5 minutes).

### Step 5: Initialize Database

After first deployment:

1. Go to your deployed URL: `https://your-app.vercel.app`
2. Navigate to `/api/setup-database` or use the setup page at `/setup`
3. This will run all database migrations automatically
4. Verify success message appears

**Alternative: Manual Migration**

Run migrations in Supabase SQL Editor in this order:
\`\`\`
scripts/001_create_tables.sql
scripts/002_enable_rls.sql
scripts/003_create_profile_trigger.sql
scripts/004_add_geocoding_columns.sql
scripts/005_add_vrp_fields.sql
scripts/006_add_global_routing_fields.sql
scripts/007_create_driver_positions.sql
scripts/009_route_metrics.sql
scripts/010_pod_emails_idempotency.sql
scripts/011_require_customer_email.sql
scripts/012_add_order_number.sql
scripts/013_add_driver_active_status.sql
scripts/014_add_multi_tenancy.sql
\`\`\`

### Step 6: Post-Deployment Verification

Run through the verification checklist:

1. **Authentication**
   - [ ] Sign up new admin account works
   - [ ] Login works for admin
   - [ ] Password reset email arrives

2. **Admin Features**
   - [ ] Dashboard loads without errors
   - [ ] Can create orders manually
   - [ ] Can import orders via CSV
   - [ ] Can create routes
   - [ ] Can assign drivers
   - [ ] Bulk operations work

3. **Driver Features**
   - [ ] Driver can login
   - [ ] Driver sees assigned routes
   - [ ] Can mark deliveries complete
   - [ ] Can capture POD (signature/photo)
   - [ ] POD email sends (if enabled)

4. **Maps & Routing**
   - [ ] Maps render correctly
   - [ ] Geocoding works for addresses
   - [ ] Route optimization completes
   - [ ] Dispatch monitor shows routes

5. **Performance**
   - [ ] Pages load in < 3 seconds
   - [ ] No console errors
   - [ ] Mobile responsive design works

## Post-Deployment Configuration

### Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate to provision
5. Update `NEXT_PUBLIC_APP_URL` environment variable
6. Update Supabase redirect URLs

### Set Up Monitoring

1. Enable Vercel Analytics (automatic)
2. Set up error tracking (Sentry recommended)
3. Configure uptime monitoring (Vercel or third-party)
4. Set up log aggregation

### Configure Backup Strategy

1. Enable Supabase automatic backups
2. Set backup retention policy
3. Test restore procedure
4. Document recovery process

## Scaling Considerations

### Database Scaling

- Start with Supabase Free/Pro tier
- Monitor connection pool usage
- Enable connection pooling (Supavisor)
- Consider read replicas for high traffic

### Application Scaling

- Vercel automatically scales frontend
- Monitor function execution times
- Use Edge functions for critical paths
- Implement caching strategies

### API Rate Limits

**HERE Maps API:**
- Free tier: 250,000 transactions/month
- Monitor usage in HERE dashboard
- Implement fallback to local optimization
- Consider upgrading for high volume

**SendGrid:**
- Free tier: 100 emails/day
- Monitor usage in SendGrid dashboard
- Upgrade for production email volume

## Rollback Procedure

If deployment fails or has critical bugs:

1. **Instant Rollback in Vercel:**
   - Go to Deployments tab
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Database Rollback:**
   - If migration caused issues, restore from backup
   - Supabase: Dashboard → Database → Backups
   - Select backup before migration
   - Restore (this will create downtime)

3. **Notify Users:**
   - Post status update
   - Send email if prolonged downtime
   - Update status page

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys on every push to main branch.

To disable:
1. Project Settings → Git
2. Disable "Automatic Deployments"

### Preview Deployments

- Every pull request gets a preview URL
- Test features before merging
- Share preview links with team

### Environment-Specific Variables

Set different values for production vs preview:
1. Vercel Dashboard → Environment Variables
2. Select scope: Production, Preview, or Development
3. Add variable with appropriate value

## Troubleshooting Deployment Issues

### Build Fails

**Error: Module not found**
- Check all imports use correct paths
- Verify dependencies in package.json
- Clear npm cache: `npm cache clean --force`

**Error: TypeScript errors**
- Fix all TypeScript errors locally first
- Run `npm run build` locally to verify
- Check tsconfig.json configuration

### Runtime Errors

**500 Internal Server Error**
- Check Vercel function logs
- Verify environment variables are set
- Check database connection

**Database Connection Fails**
- Verify Supabase URL and keys
- Check RLS policies allow access
- Test connection in Supabase dashboard

**API Rate Limit Exceeded**
- Check HERE Maps API usage
- Implement rate limiting
- Add delays between API calls

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for errors
4. Review this guide's troubleshooting section
5. Contact Vercel support (for platform issues)
