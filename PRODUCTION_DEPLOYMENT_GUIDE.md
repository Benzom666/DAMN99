# Production Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Database Preparation

**CRITICAL: Fix RLS Policies First**

Before deploying, you MUST remove the problematic RLS policies that cause infinite recursion:

\`\`\`sql
-- Run in Supabase SQL Editor
DROP POLICY IF EXISTS "profiles_super_admin_view_all" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all_operations" ON profiles;
\`\`\`

**Run All Migrations**

Execute all migration scripts in the `scripts/` directory in numerical order (001-020).

### 2. Environment Variables Setup

Set these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HERE_API_KEY=your-here-api-key
BLOB_READ_WRITE_TOKEN=auto-generated-by-vercel
\`\`\`

**Optional (for POD emails):**
\`\`\`
SENDGRID_API_KEY=your-sendgrid-key
DELIVERY_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_ENABLE_POD_EMAIL=true
\`\`\`

**Super Admin:**
\`\`\`
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=your@email.com
SUPER_ADMIN_EMAIL=your@email.com
\`\`\`

**Feature Flags:**
\`\`\`
NEXT_PUBLIC_ENABLE_ROUTE_METRICS=true
NEXT_PUBLIC_ENABLE_DISPATCH_MAP=true
\`\`\`

### 3. Code Quality Check

- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] No console errors in browser
- [ ] All features tested locally
- [ ] Debug logs removed from production code

### 4. Security Review

- [ ] Service role key is never exposed to client
- [ ] All API routes have authentication checks
- [ ] RLS policies properly configured
- [ ] Super admin email set correctly

## 🚀 Deployment Steps

### Step 1: Push to GitHub

\`\`\`bash
git add .
git commit -m "Production ready deployment"
git push origin main
\`\`\`

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Configure Environment Variables

1. Go to Project Settings → Environment Variables
2. Add all variables listed above
3. Set scope to "Production" for sensitive keys

### Step 4: Deploy

Click "Deploy" and wait 2-5 minutes.

### Step 5: Post-Deployment Setup

**1. Verify Deployment**
- Visit your deployed URL
- Check no console errors
- Test basic navigation

**2. Set Up Super Admin**
- Sign up with your SUPER_ADMIN_EMAIL
- Navigate to `/setup-super-admin`
- Click "Activate Super Admin"
- Verify access to `/super-admin` dashboard

**3. Test Core Features**
- [ ] Admin signup/login works
- [ ] Driver signup/login works
- [ ] Order creation works
- [ ] Route optimization works
- [ ] Driver can see routes
- [ ] POD submission works (if enabled)
- [ ] Dispatch monitor loads

## 📊 Post-Launch Monitoring

### Day 1 Checklist

- [ ] Monitor Vercel function logs for errors
- [ ] Check Supabase dashboard for query performance
- [ ] Verify email delivery (if enabled)
- [ ] Test from mobile devices
- [ ] Monitor HERE Maps API usage

### Week 1 Checklist

- [ ] Review error logs daily
- [ ] Monitor database connection pool
- [ ] Check API rate limits
- [ ] Gather user feedback
- [ ] Plan any hotfixes needed

### Ongoing Maintenance

**Daily:**
- Check error logs in Vercel dashboard
- Monitor system health in super admin dashboard

**Weekly:**
- Review database backup status
- Check API usage and costs
- Monitor performance metrics

**Monthly:**
- Database maintenance (vacuum, analyze)
- Review and optimize slow queries
- Update dependencies
- Security patch review

## 🔧 Troubleshooting

### Common Issues

**Routes not creating**
- Check HERE Maps API key and quota
- Verify orders have valid coordinates
- Check rate limiting logs

**Drivers can't see routes**
- Verify driver is active
- Check driver assignment
- Verify multi-tenancy admin_id is set

**POD emails not sending**
- Verify SENDGRID_API_KEY is set
- Check `NEXT_PUBLIC_ENABLE_POD_EMAIL=true`
- Verify sender email in SendGrid

**Super admin can't access dashboard**
- Verify email matches SUPER_ADMIN_EMAIL
- Check profile role is 'super_admin'
- Run setup page again if needed

## 🔐 Security Best Practices

1. **Never commit secrets to Git**
2. **Use Vercel's secure environment variables**
3. **Keep service role key private (server-side only)**
4. **Enable Vercel's automatic security updates**
5. **Review Supabase audit logs regularly**
6. **Use super admin account only when needed**

## 📈 Scaling Considerations

**Database:**
- Start with Supabase Pro tier for production
- Enable connection pooling (Supavisor)
- Monitor query performance

**Application:**
- Vercel scales automatically
- Monitor function execution times
- Use Edge functions for critical paths

**API Limits:**
- HERE Maps: Monitor usage, upgrade if needed
- SendGrid: Upgrade tier based on email volume

## 🆘 Emergency Rollback

If critical issues occur:

1. **Instant Rollback:**
   - Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Database Rollback:**
   - Supabase Dashboard → Database → Backups
   - Select backup before issues
   - Restore (causes downtime)

3. **Notify Users:**
   - Post status update
   - Send email if prolonged

## 📞 Support Resources

- **Vercel Support:** https://vercel.com/help
- **Supabase Support:** https://supabase.com/support
- **HERE Maps Support:** https://developer.here.com/support
- **Application Logs:** Vercel Dashboard → Deployments → Function Logs

---

## Final Verification

Before marking deployment complete:

- [ ] Application loads without errors
- [ ] All core features functional
- [ ] Super admin dashboard accessible
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Team has access credentials
- [ ] Documentation updated

**Your delivery management system is now production-ready! 🎉**
