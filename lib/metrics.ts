import { db } from './db'
import { nanoid } from 'nanoid'
import { createModuleLogger } from './logger'

const log = createModuleLogger('Metrics')

/**
 * Advanced metrics tracking for production monitoring.
 *
 * Tracks request latency, error rates, throughput, and other
 * production metrics per instance.
 */

export interface RequestMetric {
  instanceId: string
  method: string
  path: string
  statusCode: number
  durationMs: number
  timestamp: string
  apiKeyId?: string
  ipAddress?: string
}

export interface MetricsSummary {
  instanceId: string
  period: string
  totalRequests: number
  avgLatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  errorRate: number
  requestsPerSecond: number
}

/**
 * Record a request metric (extends usage logging with performance data).
 */
export async function recordRequestMetric(metric: RequestMetric): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO request_metrics
            (id, instance_id, method, path, status_code, duration_ms, api_key_id, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        metric.instanceId,
        metric.method,
        metric.path,
        metric.statusCode,
        metric.durationMs,
        metric.apiKeyId || null,
        metric.ipAddress || null,
        metric.timestamp,
      ],
    })
  } catch (error) {
    // Non-critical - don't let metrics failures affect requests
    log.error({ err: error }, 'Failed to record request metric')
  }
}

/**
 * Get metrics summary for an instance over a time period.
 */
export async function getMetricsSummary(
  instanceId: string,
  hoursBack: number = 24
): Promise<MetricsSummary | null> {
  try {
    const sinceTimestamp = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    const result = await db.execute({
      sql: `SELECT
              COUNT(*) as total_requests,
              AVG(duration_ms) as avg_latency_ms,
              SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as error_rate
            FROM request_metrics
            WHERE instance_id = ? AND created_at >= ?`,
      args: [instanceId, sinceTimestamp],
    })

    if (result.rows.length === 0 || result.rows[0].total_requests === 0) {
      return null
    }

    const row = result.rows[0]
    const totalRequests = Number(row.total_requests)
    const periodHours = hoursBack
    const periodSeconds = periodHours * 3600

    // Get percentile latencies
    const percentiles = await db.execute({
      sql: `SELECT duration_ms
            FROM request_metrics
            WHERE instance_id = ? AND created_at >= ?
            ORDER BY duration_ms`,
      args: [instanceId, sinceTimestamp],
    })

    const durations = percentiles.rows.map(r => r.duration_ms as number)
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    return {
      instanceId,
      period: `${hoursBack}h`,
      totalRequests,
      avgLatencyMs: Number(row.avg_latency_ms) || 0,
      p95LatencyMs: durations[p95Index] || 0,
      p99LatencyMs: durations[p99Index] || 0,
      errorRate: Number(row.error_rate) || 0,
      requestsPerSecond: totalRequests / periodSeconds,
    }
  } catch (error) {
    log.error({ err: error }, 'Failed to get metrics summary')
    return null
  }
}

/**
 * Get request metrics broken down by endpoint.
 */
export async function getEndpointMetrics(
  instanceId: string,
  hoursBack: number = 24
): Promise<Array<{ path: string; count: number; avgLatency: number; errorRate: number }>> {
  try {
    const sinceTimestamp = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    const result = await db.execute({
      sql: `SELECT
              path,
              COUNT(*) as count,
              AVG(duration_ms) as avg_latency,
              SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as error_rate
            FROM request_metrics
            WHERE instance_id = ? AND created_at >= ?
            GROUP BY path
            ORDER BY count DESC
            LIMIT 20`,
      args: [instanceId, sinceTimestamp],
    })

    return result.rows.map(row => ({
      path: row.path as string,
      count: Number(row.count),
      avgLatency: Number(row.avg_latency),
      errorRate: Number(row.error_rate) || 0,
    }))
  } catch (error) {
    log.error({ err: error }, 'Failed to get endpoint metrics')
    return []
  }
}

/**
 * Get time-series data for charting.
 */
export async function getMetricsTimeSeries(
  instanceId: string,
  hoursBack: number = 24,
  intervalMinutes: number = 60
): Promise<Array<{ timestamp: string; requests: number; avgLatency: number; errors: number }>> {
  try {
    const sinceTimestamp = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    // Group by time buckets
    const result = await db.execute({
      sql: `SELECT
              datetime((strftime('%s', created_at) / (? * 60)) * (? * 60), 'unixepoch') as time_bucket,
              COUNT(*) as requests,
              AVG(duration_ms) as avg_latency,
              SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
            FROM request_metrics
            WHERE instance_id = ? AND created_at >= ?
            GROUP BY time_bucket
            ORDER BY time_bucket ASC`,
      args: [intervalMinutes, intervalMinutes, instanceId, sinceTimestamp],
    })

    return result.rows.map(row => ({
      timestamp: row.time_bucket as string,
      requests: Number(row.requests),
      avgLatency: Number(row.avg_latency),
      errors: Number(row.errors),
    }))
  } catch (error) {
    log.error({ err: error }, 'Failed to get time series metrics')
    return []
  }
}

/**
 * Clean up old metrics to prevent database bloat.
 * Should be run periodically (e.g., daily cron).
 */
export async function cleanupOldMetrics(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffTimestamp = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

    await db.execute({
      sql: 'DELETE FROM request_metrics WHERE created_at < ?',
      args: [cutoffTimestamp],
    })

    await db.execute({
      sql: 'DELETE FROM health_checks WHERE checked_at < ?',
      args: [cutoffTimestamp],
    })

    log.info({ daysToKeep }, 'Cleaned up old metrics')
  } catch (error) {
    log.error({ err: error }, 'Failed to cleanup old metrics')
  }
}
