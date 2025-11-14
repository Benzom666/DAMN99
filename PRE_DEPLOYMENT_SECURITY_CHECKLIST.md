# Pre-Deployment Security Checklist

Complete this checklist before deploying to production.

## Database Security

- [ ] **Run ALL database migrations** in correct order (001-020)
- [ ] **Fix infinite recursion RLS policies**: Run `020_fix_infinite_recursion.sql`
- [ ] **Verify RLS is enabled** on all tables
- [ ] **Test RLS policies**:
  - Driver can only see their orders
  - Admin can only see their tenant's data
  - Super admin can see everything (via service role)
- [ ] **Enable Supabase database backups** (daily recommended)
- [ ] **Review audit log table** permissions

## Environment Variables

### Server-Side Only (NEVER client-side)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set and kept secret
- [ ] `SENDGRID_API_KEY` - Set for email delivery
- [ ] `HERE_API_KEY` - Set for geocoding
- [ ] `HERE_SERVER_API_KEY` - Set if different from HERE_API_KEY
- [ ] `DELIVERY_FROM_EMAIL` - Set sender email
- [ ] `SUPER_ADMIN_EMAIL` - Set to your email

### Public Variables (Safe to expose)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set correctly
- [ ] `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Set for development
- [ ] `NEXT_PUBLIC_ENABLE_POD_EMAIL` - Set to "true"
- [ ] `NEXT_PUBLIC_ENABLE_DISPATCH_MAP` - Set to "true" if needed
- [ ] `NEXT_PUBLIC_ENABLE_ROUTE_METRICS` - Set to "true" if needed
- [ ] `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` - Set to match SUPER_ADMIN_EMAIL

## Authentication & Authorization

- [ ] **Test super admin access**: Login and verify `/super-admin` works
- [ ] **Test admin access**: Create admin account, verify tenant isolation
- [ ] **Test driver access**: Create driver account, verify can only see assigned routes
- [ ] **Test cross-tenant isolation**: Admin A cannot see Admin B's data
- [ ] **Test suspended accounts**: Suspend a user, verify they cannot login
- [ ] **Test super admin protection**: Regular admin cannot modify super admin
- [ ] **Verify middleware** blocks unauthorized access to protected routes

## API Security

- [ ] **Test rate limiting**: Hit geocode endpoint 11 times rapidly, verify 429 error
- [ ] **Test authentication**: Call APIs without token, verify 401 error
- [ ] **Test authorization**: Driver tries to access another driver's order, verify 403
- [ ] **Test input validation**: Send invalid UUIDs, verify 400 errors
- [ ] **Test SQL injection**: Try malicious inputs, verify sanitization works
- [ ] **Test XSS**: Enter `<script>alert('xss')</script>` in forms, verify stripped

## File Upload Security

- [ ] **Verify Blob storage** is configured (`BLOB_READ_WRITE_TOKEN` set)
- [ ] **Test POD photo upload**: Upload large image, verify size limits work
- [ ] **Test POD signature upload**: Verify signature saves correctly
- [ ] **Check file URLs**: Verify they're unpredictable and not sequential
- [ ] **Test file access**: Verify anyone with URL can view (intended behavior)

## Email Security

- [ ] **Verify SendGrid API key** is valid
- [ ] **Test POD email delivery**: Complete a delivery, verify email sent
- [ ] **Check email content**: No sensitive data exposed, professional format
- [ ] **Verify from email**: Set to your domain, not personal email
- [ ] **Test email rate limits**: SendGrid quota checked
- [ ] **Check spam score**: Send test emails, verify not marked as spam

## HTTPS & Network Security

- [ ] **Enforce HTTPS**: HTTP should redirect to HTTPS automatically
- [ ] **Verify SSL certificate**: Valid and not expired
- [ ] **Test CORS**: Verify only authorized origins can call APIs
- [ ] **Check CSP headers**: Add Content Security Policy (see SECURITY_DOCUMENTATION.md)
- [ ] **Verify HSTS header**: Strict-Transport-Security enabled

## Logging & Monitoring

- [ ] **Remove debug logs**: All `console.log("[v0]...")` removed from production
- [ ] **Set up error tracking**: Sentry, LogRocket, or similar
- [ ] **Monitor Supabase logs**: Check for failed auth attempts
- [ ] **Set up uptime monitoring**: Pingdom, UptimeRobot, or similar
- [ ] **Review audit logs**: Super admin actions tracked

## User Data Protection

- [ ] **Privacy policy** created and linked
- [ ] **Terms of service** created and linked
- [ ] **Cookie consent** implemented (GDPR requirement)
- [ ] **Data retention policy** documented
- [ ] **User data export** functionality tested
- [ ] **Account deletion** functionality tested

## Super Admin Setup

- [ ] **Super admin account created**: Run `/setup-super-admin` once
- [ ] **Setup page disabled**: After super admin created, others cannot access
- [ ] **Super admin tested**: Can view/edit/delete all data
- [ ] **Audit logging verified**: Super admin actions are logged
- [ ] **Account suspension tested**: Super admin can suspend/restore accounts

## Testing Checklist

- [ ] **Authentication flow**: Login, logout, session expiry
- [ ] **Authorization**: Each role can access only their permitted data
- [ ] **Order management**: Create, edit, delete orders
- [ ] **Route optimization**: Create routes, assign drivers
- [ ] **Driver app**: View routes, complete deliveries, submit PODs
- [ ] **Admin dashboard**: View analytics, manage drivers
- [ ] **Super admin dashboard**: Manage all users, view audit log
- [ ] **Multi-tenancy**: Multiple admins with isolated data

## Performance & Scaling

- [ ] **Database indexes**: Verify indexes on foreign keys
- [ ] **Query optimization**: Review slow queries in Supabase dashboard
- [ ] **Vercel Edge Caching**: Configure caching for static assets
- [ ] **Image optimization**: POD photos compressed
- [ ] **Bundle size**: Check with `npm run build`, optimize if > 1MB

## Compliance

- [ ] **GDPR compliance**: Privacy policy, data rights implemented
- [ ] **Data processing agreement**: With Supabase, SendGrid
- [ ] **Security documentation**: SECURITY_DOCUMENTATION.md reviewed
- [ ] **Incident response plan**: Team knows what to do if breach occurs
- [ ] **Backup & recovery**: Database backups enabled, recovery tested

## Documentation

- [ ] **README.md** updated with production URLs
- [ ] **DEPLOYMENT.md** verified and tested
- [ ] **MAINTENANCE.md** reviewed by ops team
- [ ] **SECURITY_DOCUMENTATION.md** reviewed by security team
- [ ] **API documentation** created if needed

## Final Steps

- [ ] **Staging deployment**: Deploy to staging first, test everything
- [ ] **Load testing**: Test with expected traffic volume
- [ ] **Security scan**: Run OWASP ZAP or similar
- [ ] **Dependency audit**: Run `npm audit --production`, fix critical issues
- [ ] **Team review**: At least one other person reviews this checklist
- [ ] **Rollback plan**: Documented how to rollback if issues occur
- [ ] **Post-deployment monitoring**: Plan for first 24 hours after launch

## Post-Deployment (Within 24 Hours)

- [ ] **Monitor error rates**: Check Vercel/Supabase dashboards
- [ ] **Test in production**: Smoke test all critical paths
- [ ] **Check logs**: Review for unexpected errors
- [ ] **Verify emails**: POD emails being delivered
- [ ] **Monitor database**: Query performance, connection pool
- [ ] **User feedback**: Collect and address issues quickly

## Sign-Off

- [ ] **Developer**: [Your name] - Date: _______
- [ ] **Security Review**: [Name] - Date: _______
- [ ] **QA Testing**: [Name] - Date: _______
- [ ] **Product Owner**: [Name] - Date: _______

---

**CRITICAL**: Do not deploy to production until ALL items are checked.

If you discover any security issues during this checklist, document them in a security incident report before proceeding.
