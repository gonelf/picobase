# Phase 5: Production Readiness

This document describes the Phase 5 implementation of the PicoBase integration plan, focusing on production readiness features including monitoring, alerting, automated backups, and security.

## Overview

Phase 5 adds production-critical features to make PicoBase reliable and secure for real-world applications:

- **Health Monitoring** - Automated health checks with uptime tracking
- **Request Metrics** - Performance monitoring (latency, throughput, errors)
- **Automated Backups** - Scheduled backups with configurable retention
- **Alerting System** - Real-time notifications for critical events
- **API Key Rotation** - Secure key rotation with grace periods
- **IP Allowlisting** - IP-based access control
- **Audit Logging** - Complete audit trail of administrative actions

## Architecture

```
┌─────────────────────────────────────────────┐
│         Production Features Layer           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Health   │  │ Metrics  │  │ Backups │  │
│  │ Monitor   │  │ Tracking │  │Scheduler│  │
│  └─────┬─────┘  └────┬─────┘  └────┬────┘  │
│        │             │              │        │
│  ┌─────┴─────────────┴──────────────┴────┐  │
│  │        Scheduler (Cron Jobs)          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Alerts    │  │  Audit   │  │   IP    │  │
│  │ System    │  │  Logs    │  │Allowlist│  │
│  └───────────┘  └──────────┘  └─────────┘  │
│                                             │
└─────────────────────────────────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │  Turso Database │
          └─────────────────┘
```

## Features Implemented

### 1. Health Monitoring (`lib/health-monitor.ts`)

Periodic health checks to track instance uptime and performance.

**Key Functions:**
- `checkInstanceHealth(instanceId, url)` - Ping instance health endpoint
- `recordHealthCheck(result)` - Store health check results
- `getHealthMetrics(instanceId, hoursBack)` - Get aggregated metrics
- `shouldTriggerAlert(instanceId)` - Determine if alerts needed

**Metrics Tracked:**
- Response time (avg, p95, p99)
- Error rate
- Uptime percentage
- Health status (healthy/degraded/unhealthy)

### 2. Request Metrics (`lib/metrics.ts`)

Detailed performance metrics for API requests.

**Key Functions:**
- `recordRequestMetric(metric)` - Log request performance
- `getMetricsSummary(instanceId, hoursBack)` - Aggregated metrics
- `getEndpointMetrics(instanceId)` - Per-endpoint breakdown
- `getMetricsTimeSeries(instanceId)` - Time-series data for charts
- `cleanupOldMetrics(daysToKeep)` - Prevent database bloat

**Metrics Tracked:**
- Total requests
- Average latency
- P95/P99 latency
- Error rate
- Requests per second
- Per-endpoint performance

### 3. Automated Backups (`lib/backup-scheduler.ts`)

Scheduled backup system with configurable intervals and retention.

**Key Functions:**
- `setBackupSchedule(instanceId, intervalHours, retentionDays)` - Configure schedule
- `executeScheduledBackup(instanceId)` - Create a backup
- `getInstancesDueForBackup()` - Find instances needing backups
- `cleanupOldBackups(instanceId)` - Remove expired backups
- `getBackupHistory(instanceId)` - View backup history

**Features:**
- Configurable interval (default: 6 hours)
- Configurable retention (default: 30 days)
- Automatic cleanup of old backups
- Backup success/failure tracking

### 4. Alerting System (`lib/alerts.ts`)

Real-time notifications for critical events.

**Alert Types:**
- `instance_down` - Instance health check failures
- `instance_degraded` - Slow response times
- `backup_failed` - Backup creation failures
- `high_error_rate` - Error rate threshold exceeded
- `storage_limit` - Storage quota warnings
- `rate_limit_exceeded` - Rate limit violations

**Notification Channels:**
- Email (requires integration)
- Webhooks (HTTP POST to custom URLs)

**Key Functions:**
- `createAlert(instanceId, type, severity, title, message)` - Create alert
- `resolveAlert(alertId)` - Mark alert as resolved
- `getActiveAlerts(instanceId)` - Get unresolved alerts
- `addAlertChannel(instanceId, type, config)` - Configure notifications

### 5. API Key Rotation (`lib/api-keys.ts`)

Secure key rotation with grace periods.

**Key Functions:**
- `rotateApiKey(id, instanceId, gracePeriodHours)` - Create new key, expire old
- `getApiKeyStats(apiKeyId)` - View usage statistics

**Features:**
- Creates new key while keeping old key valid
- Configurable grace period (default: 24 hours)
- Old key auto-expires after grace period
- Usage tracking per key

### 6. IP Allowlisting (`lib/ip-allowlist.ts`)

IP-based access control for API requests.

**Key Functions:**
- `addIpToAllowlist(instanceId, ipAddress, options)` - Add IP/CIDR
- `removeIpFromAllowlist(id, instanceId)` - Remove IP
- `isIpAllowed(instanceId, ipAddress)` - Check if IP allowed
- `toggleIpAllowlistEntry(id, instanceId, enabled)` - Enable/disable entry

**Features:**
- Exact IP matching
- CIDR range support
- Per-entry descriptions
- Enable/disable without deletion

### 7. Audit Logging (`lib/audit-log.ts`)

Complete audit trail of administrative actions.

**Logged Actions:**
- Instance operations (create, start, stop, delete)
- API key operations (create, rotate, delete)
- Backup operations (create, restore, delete)
- Settings changes
- Security changes (IP allowlist, alert channels)

**Key Functions:**
- `logAuditEvent(userId, action, resourceType, options)` - Log action
- `getAuditLogs(instanceId, options)` - View logs
- `exportAuditLogs(instanceId, startDate, endDate)` - Export CSV
- `cleanupOldAuditLogs(daysToKeep)` - Prevent bloat

### 8. Scheduler (`lib/scheduler.ts`)

Cron job system for automated tasks.

**Tasks:**
- Health checks (every 5 minutes recommended)
- Automated backups (hourly recommended)
- Cleanup (daily recommended)

**Key Functions:**
- `runHealthChecks()` - Check all running instances
- `runScheduledBackups()` - Execute due backups
- `runCleanup()` - Clean old data
- `runScheduledTasks(task)` - Main entry point

## API Endpoints

### Health Monitoring
```
GET /api/instances/:id/health?hours=24
```
Returns health metrics and recent checks.

### Request Metrics
```
GET /api/instances/:id/metrics?hours=24&interval=60
```
Returns performance metrics and time-series data.

### Backup Schedule
```
GET /api/instances/:id/backup-schedule
POST /api/instances/:id/backup-schedule
  Body: { enabled, intervalHours, retentionDays }
```
Get or configure automated backup schedule.

### Alerts
```
GET /api/instances/:id/alerts?active=true
POST /api/instances/:id/alerts
  Body: { alertId, action: "resolve" }
```
View and manage alerts.

### Audit Logs
```
GET /api/instances/:id/audit-logs?limit=100&offset=0
GET /api/instances/:id/audit-logs?export=csv&startDate=...&endDate=...
```
View or export audit logs.

### IP Allowlist
```
GET /api/instances/:id/ip-allowlist
POST /api/instances/:id/ip-allowlist
  Body: { action: "add|remove|toggle", ipAddress, cidr, description, entryId, enabled }
```
Manage IP allowlist.

### API Key Rotation
```
POST /api/instances/:id/api-keys/rotate
  Body: { keyId, gracePeriodHours }
```
Rotate an API key.

### Cron Jobs
```
GET /api/cron?task=health|backup|cleanup|all
  Header: Authorization: Bearer <CRON_SECRET>
```
Trigger scheduled tasks (requires CRON_SECRET).

## Dashboard Components

### MetricsDashboard
Shows performance metrics with time range selector.
- Total requests, avg latency, error rate
- Top endpoints by traffic
- Located in: `components/MetricsDashboard.tsx`

### HealthMonitor
Displays instance health status and recent checks.
- Current status indicator
- Uptime, response time, error rate
- Recent health check history
- Located in: `components/HealthMonitor.tsx`

### AlertsPanel
Lists active and resolved alerts.
- Alert severity indicators
- Resolve button for active alerts
- Show/hide resolved toggle
- Located in: `components/AlertsPanel.tsx`

### AuditLogsPanel
Shows audit trail with export capability.
- Filterable log view
- CSV export for compliance
- Located in: `components/AuditLogsPanel.tsx`

### IpAllowlistPanel
Manage IP access control.
- Add/remove IPs and CIDR ranges
- Enable/disable entries
- Located in: `components/IpAllowlistPanel.tsx`

## Dashboard Pages

### Monitoring Page
`/dashboard/projects/:id/monitoring`

Combines AlertsPanel, HealthMonitor, and MetricsDashboard.

### Security Page
`/dashboard/projects/:id/security`

Combines IpAllowlistPanel and AuditLogsPanel.

Both pages accessible from the ProjectSidebar navigation.

## Database Schema

Run `PHASE_5_SCHEMA.sql` to create required tables:

**Tables Added:**
- `health_checks` - Health check results
- `request_metrics` - Request performance data
- `backup_schedules` - Automated backup config
- `backup_records` - Backup history
- `alerts` - Alert notifications
- `alert_channels` - Notification channels
- `audit_logs` - Administrative action logs
- `ip_allowlist` - IP access control

**Views Added:**
- `active_alerts` - Alert summary per instance
- `instance_health_summary` - Health metrics (24h)
- `request_metrics_summary` - Performance metrics (24h)

## Setup Instructions

### 1. Database Setup

Execute the schema:
```bash
# Apply schema to your Turso database
turso db shell <your-db> < PHASE_5_SCHEMA.sql
```

### 2. Environment Variables

Add to `.env`:
```bash
# Required for cron job authentication
CRON_SECRET=your-secret-here
```

### 3. Configure Vercel Cron Jobs

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron?task=health",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron?task=backup",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron?task=cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Or use external cron service:
```bash
# Every 5 minutes - health checks
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron?task=health

# Every hour - backups
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron?task=backup

# Daily - cleanup
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron?task=cleanup
```

### 4. Configure Backup Schedules

For each instance, set up automated backups via API or UI:
```bash
curl -X POST /api/instances/:id/backup-schedule \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "intervalHours": 6,
    "retentionDays": 30
  }'
```

### 5. Configure Alert Channels

Set up notification channels for alerts:
```bash
curl -X POST /api/instances/:id/alert-channels \
  -H "Content-Type: application/json" \
  -d '{
    "type": "webhook",
    "config": {
      "webhookUrl": "https://your-webhook-endpoint.com"
    }
  }'
```

## Usage Examples

### Monitor Instance Health

```typescript
import { getHealthMetrics } from '@/lib/health-monitor'

const metrics = await getHealthMetrics(instanceId, 24)
console.log(`Uptime: ${metrics.uptime}%`)
console.log(`Avg Response: ${metrics.avgResponseTime}ms`)
```

### Track Request Performance

```typescript
import { recordRequestMetric } from '@/lib/metrics'

// Record a request
await recordRequestMetric({
  instanceId,
  method: 'GET',
  path: '/api/posts',
  statusCode: 200,
  durationMs: 45,
  timestamp: new Date().toISOString(),
})
```

### Check IP Access

```typescript
import { isIpAllowed } from '@/lib/ip-allowlist'

const allowed = await isIpAllowed(instanceId, clientIp)
if (!allowed) {
  return res.status(403).json({ error: 'IP not allowed' })
}
```

### Log Admin Actions

```typescript
import { logAuditEvent } from '@/lib/audit-log'

await logAuditEvent(
  userId,
  'instance.delete',
  'instance',
  {
    instanceId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }
)
```

## Monitoring Best Practices

1. **Set appropriate retention periods**
   - Metrics: 30 days (balance between cost and history)
   - Audit logs: 90 days (compliance)
   - Health checks: 30 days

2. **Configure alerts wisely**
   - Use critical alerts sparingly
   - Set up webhooks for real-time notifications
   - Review and resolve alerts promptly

3. **Regular backups**
   - Enable automated backups for all instances
   - Test restore procedures periodically
   - Monitor backup success/failure alerts

4. **Security**
   - Enable IP allowlisting for sensitive instances
   - Rotate API keys regularly
   - Review audit logs for suspicious activity
   - Export audit logs for compliance

5. **Performance**
   - Monitor P95/P99 latency trends
   - Investigate error rate spikes
   - Track per-endpoint performance

## Troubleshooting

### Health checks failing
- Verify instance is running
- Check network connectivity
- Review instance logs for errors

### Backups not running
- Verify cron job is configured
- Check backup_schedules table
- Review backup failure alerts

### Metrics not appearing
- Verify requests are being logged
- Check request_metrics table
- Ensure cleanup isn't too aggressive

### Alerts not sending
- Verify alert channels are configured
- Check webhook URLs are valid
- Review alert creation logic

## Next Steps

Phase 5 provides the foundation for production operations. Future enhancements:

- **Advanced Alerting** - PagerDuty, Slack integration
- **Custom Dashboards** - User-defined metrics views
- **SLA Monitoring** - Uptime SLAs and reports
- **Cost Analysis** - Usage-based billing metrics
- **Anomaly Detection** - ML-based alerting

## Files Added/Modified

**New Libraries:**
- `lib/health-monitor.ts`
- `lib/metrics.ts`
- `lib/backup-scheduler.ts`
- `lib/alerts.ts`
- `lib/audit-log.ts`
- `lib/ip-allowlist.ts`
- `lib/scheduler.ts`

**Modified Libraries:**
- `lib/api-keys.ts` (added rotation)

**New Components:**
- `components/MetricsDashboard.tsx`
- `components/HealthMonitor.tsx`
- `components/AlertsPanel.tsx`
- `components/AuditLogsPanel.tsx`
- `components/IpAllowlistPanel.tsx`

**Modified Components:**
- `components/ProjectSidebar.tsx` (added nav links)

**New API Routes:**
- `app/api/cron/route.ts`
- `app/api/instances/[id]/health/route.ts`
- `app/api/instances/[id]/metrics/route.ts`
- `app/api/instances/[id]/backup-schedule/route.ts`
- `app/api/instances/[id]/alerts/route.ts`
- `app/api/instances/[id]/audit-logs/route.ts`
- `app/api/instances/[id]/ip-allowlist/route.ts`
- `app/api/instances/[id]/api-keys/rotate/route.ts`

**New Pages:**
- `app/dashboard/projects/[id]/monitoring/page.tsx`
- `app/dashboard/projects/[id]/security/page.tsx`

**Documentation:**
- `PHASE_5_SCHEMA.sql` - Database schema
- `PHASE_5_README.md` - This file

---

**Phase 5 Status:** ✅ Complete

All production readiness features have been implemented and are ready for deployment.
