-- Phase 5: Production Readiness Database Schema
--
-- This file documents the database schema additions for Phase 5 features.
-- Execute these statements against your Turso database to enable Phase 5.

-- Health Checks Table
-- Stores periodic health check results for monitoring instance uptime
CREATE TABLE IF NOT EXISTS health_checks (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'degraded')),
  response_time_ms INTEGER NOT NULL,
  error_message TEXT,
  checked_at TEXT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_health_checks_instance_id ON health_checks(instance_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at);

-- Request Metrics Table
-- Stores detailed request metrics for performance monitoring
CREATE TABLE IF NOT EXISTS request_metrics (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  api_key_id TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE,
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_request_metrics_instance_id ON request_metrics(instance_id);
CREATE INDEX IF NOT EXISTS idx_request_metrics_created_at ON request_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_request_metrics_path ON request_metrics(path);

-- Backup Schedules Table
-- Stores automated backup configuration per instance
CREATE TABLE IF NOT EXISTS backup_schedules (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  interval_hours INTEGER NOT NULL DEFAULT 6,
  retention_days INTEGER NOT NULL DEFAULT 30,
  last_backup_at TEXT,
  next_backup_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backup_schedules_instance_id ON backup_schedules(instance_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_next_backup_at ON backup_schedules(next_backup_at);

-- Backup Records Table
-- Stores history of all backups (manual and automated)
CREATE TABLE IF NOT EXISTS backup_records (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  backup_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backup_records_instance_id ON backup_records(instance_id);
CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(created_at);

-- Alerts Table
-- Stores alerts and notifications for instance issues
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_instance_id ON alerts(instance_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Alert Channels Table
-- Stores notification channels for alerts (email, webhook)
CREATE TABLE IF NOT EXISTS alert_channels (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'webhook')),
  config TEXT NOT NULL, -- JSON: {email?: string, webhookUrl?: string}
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_channels_instance_id ON alert_channels(instance_id);

-- Audit Logs Table
-- Stores audit trail of all administrative actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  instance_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata TEXT, -- JSON for additional context
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_instance_id ON audit_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- IP Allowlist Table
-- Stores IP allowlist entries for access control
CREATE TABLE IF NOT EXISTS ip_allowlist (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  cidr TEXT,
  description TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ip_allowlist_instance_id ON ip_allowlist(instance_id);
CREATE INDEX IF NOT EXISTS idx_ip_allowlist_ip_address ON ip_allowlist(ip_address);

-- Views for common queries

-- Active alerts by instance
CREATE VIEW IF NOT EXISTS active_alerts AS
SELECT
  instance_id,
  COUNT(*) as total_alerts,
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
  SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_count,
  SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info_count
FROM alerts
WHERE resolved = 0
GROUP BY instance_id;

-- Instance health summary (last 24 hours)
CREATE VIEW IF NOT EXISTS instance_health_summary AS
SELECT
  instance_id,
  COUNT(*) as total_checks,
  SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as uptime_percentage,
  AVG(response_time_ms) as avg_response_time,
  MAX(checked_at) as last_check_at
FROM health_checks
WHERE datetime(checked_at) > datetime('now', '-24 hours')
GROUP BY instance_id;

-- Request metrics summary (last 24 hours)
CREATE VIEW IF NOT EXISTS request_metrics_summary AS
SELECT
  instance_id,
  COUNT(*) as total_requests,
  AVG(duration_ms) as avg_latency,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as error_rate,
  COUNT(*) / 86400.0 as requests_per_second
FROM request_metrics
WHERE datetime(created_at) > datetime('now', '-24 hours')
GROUP BY instance_id;
