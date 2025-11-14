# Security Documentation

## Overview

This document outlines the security measures implemented in the Route Optimization and Delivery Management application.

## Authentication & Authorization

### Multi-Level Access Control

1. **Super Admin**
   - Full system access
   - Can manage all admins, drivers, orders, and routes
   - Can suspend/restore any account
   - Protected from modification by regular admins
   - Environment variable: `SUPER_ADMIN_EMAIL`

2. **Admin**
   - Manage orders, routes, and drivers within their tenant
   - Cannot access other tenants' data
   - Cannot modify super admin accounts
   - Multi-tenancy enforced via RLS policies

3. **Driver**
   - View assigned routes and orders only
   - Submit POD (Proof of Delivery)
   - Update delivery status
   - Cannot access other drivers' data

### Row Level Security (RLS)

All database tables have RLS enabled with policies that enforce:
- Users can only access their own data
- Admins can access data within their tenant
- Drivers can only access assigned routes and orders
- Super admin bypass uses service role client

## Data Protection

### Input Validation & Sanitization

All user inputs are validated and sanitized:
- Email validation (RFC compliant)
- Phone number validation
- UUID validation for database IDs
- HTML sanitization to prevent XSS
- Address and notes length limits
- Order number format validation

### SQL Injection Prevention

- All database queries use parameterized queries via Supabase client
- No raw SQL in application code
- RLS policies use security definer functions
- Input validation before database operations

### XSS Protection

- All user-generated content is sanitized using DOMPurify
- HTML is stripped from text inputs
- Content Security Policy headers recommended
- React's built-in XSS protection

## API Security

### Rate Limiting

Implemented rate limiting on sensitive endpoints:
- Geocoding API: 10 requests per minute
- Configurable per endpoint
- IP-based tracking
- Automatic cleanup of expired entries

### Authentication Checks

All API routes require authentication:
- JWT token validation via Supabase
- Role-based authorization
- Order ownership verification
- Tenant isolation

### Secure Headers

Recommended headers (add to `next.config.js`):
\`\`\`javascript
headers: [
  {
    source: '/:path*',
    headers: [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
    ]
  }
]
\`\`\`

## Environment Variables

### Critical Security Variables

**NEVER** expose these client-side:
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS, server-only
- `SENDGRID_API_KEY` - Email service authentication
- `HERE_API_KEY` - Geocoding service authentication
- `SUPER_ADMIN_EMAIL` - Super admin identifier

### Safe Public Variables

These are safe to expose (prefixed with `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key with RLS
- Feature flags (e.g., `NEXT_PUBLIC_ENABLE_POD_EMAIL`)

## Sensitive Data Handling

### Personal Identifiable Information (PII)

PII is protected:
- Customer emails, names, addresses encrypted in transit (HTTPS)
- RLS policies prevent unauthorized access
- Audit logging for super admin actions
- GDPR-compliant data retention

### File Uploads

Proof of Delivery photos and signatures:
- Uploaded to Vercel Blob with public access
- URLs are unpredictable (UUID-based)
- Content type validation
- Size limits enforced
- No executable files allowed

### Session Management

- JWT tokens stored in HTTP-only cookies
- Automatic token refresh
- Session expiration enforced
- Logout clears all tokens

## Audit Logging

Super admin actions are logged:
- All modifications to profiles
- Account suspensions/restorations
- Deletions
- Timestamps and actor tracking
- Immutable audit trail

## GDPR Compliance

### Data Subject Rights

1. **Right to Access**: Users can view their own data
2. **Right to Rectification**: Users can update their profile
3. **Right to Erasure**: Super admin can delete accounts
4. **Right to Data Portability**: Data can be exported

### Data Retention

- Active users: Data retained indefinitely
- Suspended users: Data retained with flag
- Deleted users: Hard delete or anonymization recommended

## Security Best Practices

### Pre-Deployment Checklist

- [ ] Run database migration `020_fix_infinite_recursion.sql`
- [ ] All environment variables configured
- [ ] HTTPS enforced in production
- [ ] Service role key never exposed client-side
- [ ] Super admin email set correctly
- [ ] Rate limiting tested
- [ ] RLS policies verified
- [ ] Test account permissions
- [ ] Verify multi-tenancy isolation
- [ ] Enable Supabase auth email verification

### Ongoing Security

- Monitor Supabase logs for suspicious activity
- Review audit logs regularly
- Update dependencies monthly
- Rotate API keys annually
- Test RLS policies after schema changes
- Review super admin access quarterly
- Enable Supabase database backups

## Incident Response

### Data Breach Protocol

1. **Identify**: Determine scope of breach
2. **Contain**: Suspend affected accounts
3. **Investigate**: Review audit logs
4. **Notify**: Inform affected users (GDPR requirement)
5. **Remediate**: Patch vulnerability
6. **Monitor**: Watch for further incidents

### Emergency Contacts

- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/help
- Security team: [Your security contact]

## Vulnerability Reporting

If you discover a security vulnerability:
1. Do not disclose publicly
2. Contact: [Your security email]
3. Provide detailed steps to reproduce
4. Allow 90 days for remediation

## Compliance & Certifications

### GDPR (General Data Protection Regulation)

- Data processing agreement with Supabase
- Privacy policy required
- Cookie consent required
- Data subject rights implemented

### PCI DSS (If accepting payments)

- Do not store credit card numbers
- Use payment processor (Stripe recommended)
- Never log payment details

## Security Testing

### Recommended Tests

1. **Authentication Bypass**: Try accessing protected routes
2. **Authorization**: Test cross-tenant access
3. **SQL Injection**: Test with malicious inputs
4. **XSS**: Test with script tags in inputs
5. **CSRF**: Verify token validation
6. **Rate Limiting**: Hammer endpoints
7. **Session Fixation**: Test session handling
8. **File Upload**: Try malicious files

### Tools

- OWASP ZAP - Automated security testing
- Burp Suite - Manual penetration testing
- Supabase dashboard - Review RLS policies
- Browser DevTools - Inspect network traffic

## Updates & Patching

- Check for dependency updates weekly: `npm audit`
- Apply security patches immediately
- Test in staging before production
- Document all changes

## Contact

For security concerns:
- Email: [Your security team]
- Response time: 24 hours for critical issues
