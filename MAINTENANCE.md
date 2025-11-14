# Maintenance Guide

This guide covers ongoing maintenance tasks for the Delivery Route Management System.

## Daily Tasks

### Monitor System Health

**Check Vercel Dashboard**
- Review error rates
- Check function execution times
- Monitor bandwidth usage
- Review deployment status

**Check Supabase Dashboard**
- Monitor database size
- Review connection pool usage
- Check for slow queries
- Review auth logs

**Check HERE Maps Usage**
- Monitor API transaction count
- Review rate limit warnings
- Check for geocoding failures

## Weekly Tasks

### Database Maintenance

**Analyze Database Performance**
\`\`\`sql
-- Find slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
\`\`\`

**Clean Up Old Data**
\`\`\`sql
-- Archive completed routes older than 90 days
-- Run during low-traffic hours
UPDATE routes
SET archived = true
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '90 days'
  AND archived = false;

-- Delete old driver positions (keep last 7 days)
DELETE FROM driver_positions
WHERE updated_at < NOW() - INTERVAL '7 days';
\`\`\`

### Review Logs

**Check for Recurring Errors**
- Review Vercel function logs
- Check Supabase logs for auth failures
- Monitor POD email delivery failures
- Review geocoding failures

**Action Items for Common Errors:**
- High error rate → Investigate and fix bugs
- Slow queries → Add indexes or optimize
- Rate limit errors → Implement backoff strategy

## Monthly Tasks

### Security Updates

**Update Dependencies**
\`\`\`bash
# Check for outdated packages
npm outdated

# Update all dependencies (test thoroughly)
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
\`\`\`

**Review Access**
- Audit admin accounts
- Remove inactive drivers
- Review API keys
- Rotate sensitive credentials if needed

### Performance Optimization

**Database Optimization**
\`\`\`sql
-- Vacuum and analyze tables
VACUUM ANALYZE orders;
VACUUM ANALYZE routes;
VACUUM ANALYZE delivery_stops;
VACUUM ANALYZE driver_positions;

-- Reindex tables if needed
REINDEX TABLE orders;
REINDEX TABLE routes;
\`\`\`

**Review Caching Strategy**
- Check cache hit rates
- Optimize revalidation times
- Review static asset caching

### Capacity Planning

**Review Usage Metrics**
- Database storage growth rate
- API request volume trends
- User growth trends
- Feature usage patterns

**Scaling Decisions**
- Upgrade Supabase tier if needed
- Upgrade HERE Maps plan if needed
- Scale Vercel resources if needed

## Quarterly Tasks

### Backup and Recovery Testing

**Test Database Restore**
1. Create test Supabase project
2. Restore latest backup
3. Verify data integrity
4. Test application functionality
5. Document any issues

**Test Disaster Recovery**
1. Simulate complete outage
2. Follow recovery procedures
3. Measure recovery time
4. Update recovery documentation

### Performance Audit

**Frontend Performance**
- Run Lighthouse audit
- Check Core Web Vitals
- Optimize bundle sizes
- Review image optimization

**Backend Performance**
- Profile slow API endpoints
- Optimize database queries
- Review caching effectiveness
- Load test critical paths

### Cost Optimization

**Review Service Costs**
- Vercel usage and costs
- Supabase usage and costs
- HERE Maps API costs
- SendGrid costs
- Vercel Blob storage costs

**Optimization Opportunities**
- Optimize database queries to reduce compute
- Implement better caching to reduce API calls
- Compress images to reduce bandwidth
- Archive old data to reduce storage

## Data Management

### Backup Strategy

**Automated Backups (Supabase)**
- Daily automatic backups enabled
- 7-day retention for free tier
- 30-day retention for pro tier
- Point-in-time recovery available (pro tier)

**Manual Backups**
\`\`\`bash
# Export database via Supabase dashboard
# Or use pg_dump for specific tables

pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -t orders -t routes -t delivery_stops \
  > backup_$(date +%Y%m%d).sql
\`\`\`

### Data Archival

**Archive Strategy**
- Keep active routes for 90 days
- Archive completed routes older than 90 days
- Delete POD images older than 1 year
- Maintain order history indefinitely

**Archival Script**
\`\`\`sql
-- Create archive table (one-time)
CREATE TABLE IF NOT EXISTS routes_archive (LIKE routes INCLUDING ALL);

-- Move old routes to archive
INSERT INTO routes_archive
SELECT * FROM routes
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '90 days';

-- Verify and delete from main table
DELETE FROM routes
WHERE id IN (SELECT id FROM routes_archive);
\`\`\`

### GDPR Compliance

**Data Deletion Requests**
\`\`\`sql
-- Delete user and all associated data
BEGIN;

-- Delete driver positions
DELETE FROM driver_positions WHERE driver_id = 'user_id';

-- Delete POD data
DELETE FROM pod_emails WHERE order_id IN (
  SELECT id FROM orders WHERE admin_id = 'user_id'
);

-- Delete stops
DELETE FROM delivery_stops WHERE route_id IN (
  SELECT id FROM routes WHERE driver_id = 'user_id' OR admin_id = 'user_id'
);

-- Delete routes
DELETE FROM routes WHERE driver_id = 'user_id' OR admin_id = 'user_id';

-- Delete orders
DELETE FROM orders WHERE admin_id = 'user_id';

-- Delete profile
DELETE FROM profiles WHERE id = 'user_id';

COMMIT;
\`\`\`

## Monitoring and Alerts

### Key Metrics to Monitor

**Application Health**
- Error rate < 1%
- Average response time < 500ms
- 99th percentile response time < 2s
- Uptime > 99.9%

**Database Health**
- Connection pool utilization < 80%
- Query execution time p95 < 100ms
- Database size growth rate
- Failed query rate < 0.1%

**External Services**
- HERE Maps API success rate > 99%
- SendGrid delivery rate > 95%
- Blob storage upload success > 99%

### Set Up Alerts

**Vercel Monitoring**
- Enable Vercel Analytics
- Set up error rate alerts
- Configure performance budgets

**Supabase Monitoring**
- Enable database usage alerts
- Set up connection pool alerts
- Configure slow query alerts

**Custom Monitoring**
\`\`\`javascript
// Example: Monitor route creation success rate
// Run daily via cron job
async function monitorRouteCreation() {
  const { data: routes, error } = await supabase
    .from('routes')
    .select('id, created_at, status')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const successRate = routes.filter(r => r.status !== 'failed').length / routes.length;

  if (successRate < 0.95) {
    // Send alert
    console.error(`Route creation success rate dropped to ${successRate * 100}%`);
  }
}
\`\`\`

## Incident Response

### Incident Severity Levels

**P0 - Critical (Respond immediately)**
- Complete site outage
- Data loss or corruption
- Security breach

**P1 - High (Respond within 1 hour)**
- Major feature broken
- Significant performance degradation
- Payment processing issues

**P2 - Medium (Respond within 4 hours)**
- Minor feature broken
- Affecting some users
- Non-critical bug

**P3 - Low (Respond within 24 hours)**
- Minor UI issues
- Enhancement requests
- Documentation updates

### Incident Response Checklist

1. **Acknowledge**
   - [ ] Acknowledge the incident
   - [ ] Assess severity
   - [ ] Notify stakeholders if P0/P1

2. **Investigate**
   - [ ] Check recent deployments
   - [ ] Review error logs
   - [ ] Check external service status
   - [ ] Identify root cause

3. **Resolve**
   - [ ] Implement fix or rollback
   - [ ] Verify fix in production
   - [ ] Monitor for recurrence

4. **Post-Mortem**
   - [ ] Document incident details
   - [ ] Identify preventive measures
   - [ ] Update runbooks
   - [ ] Implement monitoring improvements

## Contact Information

### Support Contacts

**Vercel Platform Issues**
- Support: https://vercel.com/help
- Status Page: https://vercel-status.com

**Supabase Issues**
- Support: https://supabase.com/support
- Status Page: https://status.supabase.com

**HERE Maps Issues**
- Support: https://developer.here.com/support
- Documentation: https://developer.here.com/documentation

**SendGrid Issues**
- Support: https://support.sendgrid.com
- Status Page: https://status.sendgrid.com
